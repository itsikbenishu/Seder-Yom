import { and, eq, inArray } from "drizzle-orm";
import { computeReminderTime, type Event } from "@project/shared";
import { db } from "../db/client.js";
import { archivedDays, events, eventFiles } from "../db/schema/index.js";
import { NotFoundError } from "../utils/AppError.js";
import { removeStorageObjects } from "./files.service.js";
import { publishReminderJob } from "./reminderQueue.service.js";

type EventRow = typeof events.$inferSelect;
type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Pairs a freshly-inserted row with its source event so the reminder pass can read the original "HH:mm" fields.
interface CopiedEvent {
  row: EventRow;
  source: Event;
}

// Mirrors events.service.ts's clearDayEvents but runs inside the caller's transaction, alongside the inserts below.
async function deleteLocalDayEvents(tx: DbTransaction, userId: string, dayOfWeek: number): Promise<string[]> {
  const localEventsPredicate = and(eq(events.userId, userId), eq(events.dayOfWeek, dayOfWeek), eq(events.googleCalendarSynced, false));
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
}

async function insertCopiedEvents(tx: DbTransaction, userId: string, dayOfWeek: number, sourceEvents: Event[]): Promise<CopiedEvent[]> {
  const copied: CopiedEvent[] = [];

  for (const source of sourceEvents) {
    const [row] = await tx
      .insert(events)
      .values({
        userId,
        dayOfWeek,
        title: source.title,
        description: source.description,
        note: source.note,
        start: source.start,
        end: source.end,
        allDay: source.allDay,
        frequency: source.frequency,
        reminder: source.reminder,
        reminderMode: source.reminderMode,
        reminderTime: source.reminderTime,
        googleCalendarSynced: false,
        mutedUntilArchive: false,
      })
      .returning();
    copied.push({ row, source });
  }

  return copied;
}

// Publishes reminder jobs for copies due later this week - mirrors events.service.ts's createEvent, but skips
// anything whose dayOfWeek already passed this week: computeReminderTime always resolves against the current
// week, so an unfiltered publish would fire every past-due copy's reminder immediately on copy.
async function publishReminderJobsFor(userId: string, dayOfWeek: number, copied: CopiedEvent[], correlationId: string): Promise<void> {
  const now = Date.now();
  const dueReminders = copied
    .filter(({ source }) => source.reminder)
    .map(({ row, source }) => ({
      row,
      source,
      reminderTime: computeReminderTime({
        dayOfWeek,
        start: source.start,
        reminderMode: source.reminderMode ?? "time",
        reminderTime: source.reminderTime,
      }),
    }))
    .filter(({ reminderTime }) => reminderTime.getTime() > now);

  await Promise.all(
    dueReminders.map(({ row, source, reminderTime }) =>
      publishReminderJob({
        eventId: row.id,
        userId,
        eventTitle: source.title,
        reminderTime,
        correlationId,
      }),
    ),
  );
}

// "Overwrite this day?": replaces the target day's local events with fresh, always-local copies of the archived day's events.
export async function copyArchivedDayToDay(userId: string, archivedDayId: string, dayOfWeek: number, correlationId: string): Promise<void> {
  const [archivedDay] = await db
    .select()
    .from(archivedDays)
    .where(and(eq(archivedDays.id, archivedDayId), eq(archivedDays.userId, userId)));

  if (!archivedDay) {
    throw new NotFoundError("Archived day not found");
  }

  const { storagePaths, copied } = await db.transaction(async (tx) => {
    const storagePaths = await deleteLocalDayEvents(tx, userId, dayOfWeek);
    const copied = await insertCopiedEvents(tx, userId, dayOfWeek, archivedDay.events);
    return { storagePaths, copied };
  });

  // Both run after the transaction commits - Storage cleanup and RabbitMQ publishing aren't part of it.
  await removeStorageObjects(storagePaths);
  await publishReminderJobsFor(userId, dayOfWeek, copied, correlationId);
}
