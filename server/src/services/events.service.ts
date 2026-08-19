import { and, eq, inArray, isNull, notInArray, or } from "drizzle-orm";
import {
  eventSchema,
  eventWriteSchema,
  MAX_TOTAL_FILES_SIZE_BYTES,
  type CreateEventInput,
  type Event,
  type UpdateEventInput,
} from "@project/shared";
import { db } from "../db/client.js";
import { events, eventFiles } from "../db/schema/index.js";
import { NotFoundError, ValidationError } from "../utils/AppError.js";
import { computeReminderTime } from "./reminderTime.js";
import { publishReminderJob } from "./reminderQueue.service.js";
import { removeStorageObjects, toApiEventFile } from "./files.service.js";

type EventRow = typeof events.$inferSelect;
// The type of the callback argument `db.transaction` hands out — lets attachFiles/syncEventFiles
// run either against the plain `db` client or inside an in-progress transaction.
type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbExecutor = typeof db | DbTransaction;

function trimSeconds(time: string): string {
  return time.slice(0, 5);
}

export async function toApiEvent(row: EventRow): Promise<Event> {
  const fileRows = await db.select().from(eventFiles).where(eq(eventFiles.eventId, row.id));
  return eventSchema.parse({
    ...toWritableFields(row),
    id: row.id,
    googleCalendarSynced: row.googleCalendarSynced,
    files: fileRows.map(toApiEventFile),
  });
}

// Attaches already-uploaded (POST /files/upload) rows to this event. Only files owned by
// this user that are unattached or already belong to this same event are eligible — this
// keeps the attach idempotent across repeated PATCHes and prevents hijacking another
// event's files. A count mismatch means a fileId was invalid, foreign, or already used
// elsewhere. Total size and duplicate name+size are validated up front, before the write,
// so a violation is reported as the SPEC's validation.* message instead of surfacing later
// as an unhandled ZodError (size, checked at response-build time) or a raw postgres unique
// violation (duplicate name+size, enforced by event_files_event_filename_size_unique) —
// either of which would 500 after the attach had already been persisted.
async function attachFiles(dbExecutor: DbExecutor, userId: string, eventId: string, fileIds: string[]): Promise<void> {
  if (fileIds.length === 0) {
    return;
  }

  const candidates = await dbExecutor
    .select({ id: eventFiles.id, filename: eventFiles.filename, size: eventFiles.size })
    .from(eventFiles)
    .where(
      and(
        inArray(eventFiles.id, fileIds),
        eq(eventFiles.userId, userId),
        or(isNull(eventFiles.eventId), eq(eventFiles.eventId, eventId)),
      ),
    );

  if (candidates.length !== fileIds.length) {
    throw new ValidationError("validation.file.notFound");
  }

  const totalSize = candidates.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > MAX_TOTAL_FILES_SIZE_BYTES) {
    throw new ValidationError("validation.file.totalSize");
  }

  const seenNameAndSize = new Set<string>();
  for (const file of candidates) {
    const key = `${file.filename}:${file.size}`;
    if (seenNameAndSize.has(key)) {
      throw new ValidationError("validation.file.duplicate");
    }
    seenNameAndSize.add(key);
  }

  try {
    await dbExecutor
      .update(eventFiles)
      .set({ eventId })
      .where(inArray(eventFiles.id, candidates.map((file) => file.id)));
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new ValidationError("validation.file.duplicate");
    }
    throw error;
  }
}

// Reconciles an existing event's attachments with the full `fileIds` set from a PATCH:
// attaches newly-referenced uploads, then detaches (eventId -> null) any file that was
// attached before but dropped out of the list. This is the "replaced" stage of the file
// lifecycle (SPEC.md EventFile) — detached files are left orphaned for the daily cleanup
// job rather than deleted immediately, same as an abandoned pre-save upload.
async function syncEventFiles(dbExecutor: DbExecutor, userId: string, eventId: string, fileIds: string[]): Promise<void> {
  await attachFiles(dbExecutor, userId, eventId, fileIds);

  await dbExecutor
    .update(eventFiles)
    .set({ eventId: null })
    .where(
      and(
        eq(eventFiles.eventId, eventId),
        eq(eventFiles.userId, userId),
        fileIds.length > 0 ? notInArray(eventFiles.id, fileIds) : undefined,
      ),
    );
}

function toWritableFields(row: EventRow) {
  return {
    dayOfWeek: row.dayOfWeek,
    title: row.title,
    description: row.description ?? undefined,
    note: row.note ?? undefined,
    start: trimSeconds(row.start),
    end: trimSeconds(row.end),
    allDay: row.allDay,
    frequency: row.frequency,
    reminder: row.reminder,
    reminderLead: row.reminderLead ?? undefined,
    reminderLeadTime: row.reminderLeadTime ? trimSeconds(row.reminderLeadTime) : undefined,
    mutedUntilArchive: row.mutedUntilArchive,
  };
}

export async function listEvents(userId: string): Promise<Event[]> {
  const rows = await db.select().from(events).where(eq(events.userId, userId));
  return Promise.all(rows.map(toApiEvent));
}

export async function createEvent(userId: string, input: CreateEventInput, correlationId: string): Promise<Event> {
  const { fileIds, ...eventFields } = input;

  const row = await db.transaction(async (tx) => {
    const [inserted] = await tx.insert(events).values({ ...eventFields, userId }).returning();
    await attachFiles(tx, userId, inserted.id, fileIds);
    return inserted;
  });

  if (input.reminder) {
    const reminderTime = computeReminderTime({
      dayOfWeek: input.dayOfWeek,
      start: input.start,
      reminderLead: input.reminderLead ?? "time",
      reminderLeadTime: input.reminderLeadTime,
    });

    await publishReminderJob({
      eventId: row.id,
      userId,
      eventTitle: row.title,
      reminderTime,
      correlationId,
    });
  }

  return toApiEvent(row);
}

export async function updateEvent(userId: string, id: string, patch: UpdateEventInput): Promise<Event> {
  const [existing] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.userId, userId)));

  if (!existing) {
    throw new NotFoundError("Event not found");
  }

  const { fileIds, ...patchFields } = patch;
  const merged = eventWriteSchema.parse({ ...toWritableFields(existing), ...patchFields });
  const { fileIds: _mergedFileIds, ...mergedFields } = merged;

  const row = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(events)
      .set(mergedFields)
      .where(and(eq(events.id, id), eq(events.userId, userId)))
      .returning();

    if (fileIds !== undefined) {
      await syncEventFiles(tx, userId, id, fileIds);
    }

    return updated;
  });

  return toApiEvent(row);
}

export async function deleteEvent(userId: string, id: string): Promise<void> {
  const filesToRemove = await db
    .select({ storagePath: eventFiles.storagePath })
    .from(eventFiles)
    .where(and(eq(eventFiles.eventId, id), eq(eventFiles.userId, userId)));

  const [deleted] = await db
    .delete(events)
    .where(and(eq(events.id, id), eq(events.userId, userId)))
    .returning({ id: events.id });

  if (!deleted) {
    throw new NotFoundError("Event not found");
  }

  await removeStorageObjects(filesToRemove.map((file) => file.storagePath));
}

export async function muteDayEvents(userId: string, dayOfWeek: number): Promise<void> {
  await db
    .update(events)
    .set({ mutedUntilArchive: true })
    .where(and(eq(events.userId, userId), eq(events.dayOfWeek, dayOfWeek), eq(events.allDay, false)));
}
