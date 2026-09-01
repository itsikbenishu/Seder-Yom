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
// Lets attachFiles/syncEventFiles run against either the plain db client or an in-progress transaction.
type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbExecutor = typeof db | DbTransaction;

function trimSeconds(time: string): string {
  return time.slice(0, 5);
}

type EventFileRow = typeof eventFiles.$inferSelect;

function toApiEventFromRow(row: EventRow, fileRows: EventFileRow[]): Event {
  return eventSchema.parse({
    ...toWritableFields(row),
    id: row.id,
    googleCalendarSynced: row.googleCalendarSynced,
    files: fileRows.map(toApiEventFile),
  });
}

export async function toApiEvent(row: EventRow): Promise<Event> {
  const fileRows = await db.select().from(eventFiles).where(eq(eventFiles.eventId, row.id));
  return toApiEventFromRow(row, fileRows);
}

// Batched variant of toApiEvent — issues a single eventFiles query for all rows instead of
export async function toApiEvents(rows: EventRow[]): Promise<Event[]> {
  if (rows.length === 0) {
    return [];
  }

  const fileRows = await db
    .select()
    .from(eventFiles)
    .where(inArray(eventFiles.eventId, rows.map((row) => row.id)));

  const filesByEventId = new Map<string, EventFileRow[]>();
  for (const fileRow of fileRows) {
    if (!fileRow.eventId) {
      continue;
    }
    const existing = filesByEventId.get(fileRow.eventId);
    if (existing) {
      existing.push(fileRow);
    } else {
      filesByEventId.set(fileRow.eventId, [fileRow]);
    }
  }

  return rows.map((row) => toApiEventFromRow(row, filesByEventId.get(row.id) ?? []));
}

// Only files owned by this user, unattached or already on this event, are eligible — keeps
// PATCHes idempotent and blocks hijacking another event's files. Size/duplicate are checked
// up front so violations report as validation.* messages, not a later 500.
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

// Reconciles attachments with a PATCH's fileIds: attaches new ones, detaches dropped ones
// (left for the daily orphan-cleanup job, not deleted immediately).
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
    reminderMode: row.reminderMode ?? undefined,
    reminderTime: row.reminderTime ? trimSeconds(row.reminderTime) : undefined,
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
      reminderMode: input.reminderMode ?? "time",
      reminderTime: input.reminderTime,
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

export async function unmuteDayEvents(userId: string, dayOfWeek: number): Promise<void> {
  await db
    .update(events)
    .set({ mutedUntilArchive: false })
    .where(and(eq(events.userId, userId), eq(events.dayOfWeek, dayOfWeek), eq(events.allDay, false)));
}

// Excludes Google-synced events (never deletable from this app), same as archiveDay.
export async function clearDayEvents(userId: string, dayOfWeek: number): Promise<void> {
  const localEventsPredicate = and(
    eq(events.userId, userId),
    eq(events.dayOfWeek, dayOfWeek),
    eq(events.googleCalendarSynced, false),
  );

  const storagePaths = await db.transaction(async (tx) => {
    const targetEvents = await tx.select({ id: events.id }).from(events).where(localEventsPredicate);
    const eventIds = targetEvents.map((event) => event.id);

    if (eventIds.length === 0) {
      return [];
    }

    const files = await tx
      .select({ storagePath: eventFiles.storagePath })
      .from(eventFiles)
      .where(and(inArray(eventFiles.eventId, eventIds), eq(eventFiles.userId, userId)));

    await tx.delete(eventFiles).where(inArray(eventFiles.eventId, eventIds));
    await tx.delete(events).where(inArray(events.id, eventIds));

    return files.map((file) => file.storagePath);
  });

  // Runs after the DB transaction commits — Storage isn't part of it — as one batched call.
  await removeStorageObjects(storagePaths);
}
