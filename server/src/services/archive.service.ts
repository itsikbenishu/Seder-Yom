import { randomUUID } from "node:crypto";
import { and, count, desc, eq, ilike } from "drizzle-orm";
import {
  archivedDaySchema,
  eventSchema,
  type ArchivedDay,
  type ArchiveConflictResolution,
  type ArchiveQuery,
  type ArchiveResponseData,
  type Event,
  type GoogleCalendarEvent,
} from "@project/shared";
import { db } from "../db/client.js";
import { archivedDays, events } from "../db/schema/index.js";
import { ConflictError, NotFoundError } from "../utils/AppError.js";
import { removeStorageObjects } from "./files.service.js";
import { toApiEvents } from "./events.service.js";
import { listGoogleCalendarEventsForDate } from "./googleCalendarEvents.service.js";
import { dateForDayOfWeek } from "./weekDates.js";

type ArchivedDayRow = typeof archivedDays.$inferSelect;

function toApiArchivedDay(row: ArchivedDayRow): ArchivedDay {
  return archivedDaySchema.parse({
    id: row.id,
    dayOfWeek: row.dayOfWeek,
    month: row.month,
    dayOfMonth: row.dayOfMonth,
    year: row.year,
    summary: row.summary,
    count: row.count,
    events: row.events,
  });
}

// Splits on "-" rather than `new Date(query.date)` to avoid server-local timezone parsing quirks.
function parseDateFilter(date: string): { year: number; month: number; dayOfMonth: number } {
  const [year, month, dayOfMonth] = date.split("-").map(Number);
  return { year, month: month - 1, dayOfMonth };
}

export async function listArchivedDays(userId: string, query: ArchiveQuery): Promise<ArchiveResponseData> {
  const dateFilter = query.date ? parseDateFilter(query.date) : undefined;

  const where = and(
    eq(archivedDays.userId, userId),
    query.search ? ilike(archivedDays.summary, `%${query.search}%`) : undefined,
    dateFilter ? eq(archivedDays.year, dateFilter.year) : undefined,
    dateFilter ? eq(archivedDays.month, dateFilter.month) : undefined,
    dateFilter ? eq(archivedDays.dayOfMonth, dateFilter.dayOfMonth) : undefined,
  );

  const [{ value: totalCount }] = await db.select({ value: count() }).from(archivedDays).where(where);

  const rows = await db
    .select()
    .from(archivedDays)
    .where(where)
    .orderBy(desc(archivedDays.year), desc(archivedDays.month), desc(archivedDays.dayOfMonth))
    .limit(query.limit)
    .offset(query.offset);

  const days = rows.map(toApiArchivedDay);

  return { days, total_count: totalCount, has_more: query.offset + days.length < totalCount };
}

// Google events aren't stored locally, so the snapshot needs them fetched separately - local-only fields get reasonable defaults.
function toArchivableGoogleEvent(event: GoogleCalendarEvent): Event {
  return eventSchema.parse({
    id: randomUUID(),
    dayOfWeek: event.dayOfWeek,
    title: event.title,
    description: event.description,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    frequency: "once",
    reminder: false,
    mutedUntilArchive: false,
    googleCalendarSynced: true,
    files: [],
  });
}

export async function archiveDay(userId: string, dayOfWeek: number, onConflict?: ArchiveConflictResolution): Promise<ArchivedDay> {
  const localEventsPredicate = and(eq(events.userId, userId), eq(events.dayOfWeek, dayOfWeek), eq(events.googleCalendarSynced, false));
  const date = dateForDayOfWeek(dayOfWeek);
  // Fetched outside the transaction - a live Google API call shouldn't hold a DB transaction open.
  const googleEvents = await listGoogleCalendarEventsForDate(userId, date);
  const googleEventsSnapshot = googleEvents.map(toArchivableGoogleEvent);

  try {
    const savedRow = await db.transaction(async (archiveTransaction) => {
      const localEvents = await archiveTransaction.select().from(events).where(localEventsPredicate);
      if (localEvents.length === 0 && googleEventsSnapshot.length === 0) {
        throw new ConflictError("No events to archive for this day", "ARCHIVE_EMPTY_DAY");
      }

      const localSnapshot = await toApiEvents(localEvents);
      const newEventsSnapshot = [...localSnapshot, ...googleEventsSnapshot];

      // A day already archived for this date is a conflict unless `onConflict` resolves it.
      const [existing] = await archiveTransaction
        .select()
        .from(archivedDays)
        .where(and(eq(archivedDays.userId, userId), eq(archivedDays.year, date.getFullYear()), eq(archivedDays.month, date.getMonth()), eq(archivedDays.dayOfMonth, date.getDate())));

      if (existing && !onConflict) {
        throw new ConflictError("This day has already been archived", "ARCHIVE_ALREADY_EXISTS");
      }

      const eventsSnapshot = existing && onConflict === "merge" ? [...existing.events, ...newEventsSnapshot] : newEventsSnapshot;
      const summary = eventsSnapshot
        .slice(0, 3)
        .map((event) => event.title)
        .join(", ");

      const [row] = existing
        ? await archiveTransaction
            .update(archivedDays)
            .set({ summary, count: eventsSnapshot.length, events: eventsSnapshot })
            .where(eq(archivedDays.id, existing.id))
            .returning()
        : await archiveTransaction
            .insert(archivedDays)
            .values({
              userId,
              dayOfWeek,
              month: date.getMonth(),
              dayOfMonth: date.getDate(),
              year: date.getFullYear(),
              summary,
              count: eventsSnapshot.length,
              events: eventsSnapshot,
            })
            .returning();

      await archiveTransaction.delete(events).where(localEventsPredicate);

      return row;
    });

    return toApiArchivedDay(savedRow);
  } catch (error) {
    if (error instanceof ConflictError) {
      throw error;
    }
    // Drizzle puts the Postgres error code on .cause; catches only a race past the select above.
    const pgCode = (error as { code?: string }).code ?? (error as { cause?: { code?: string } }).cause?.code;
    if (pgCode === "23505") {
      throw new ConflictError("This day has already been archived", "ARCHIVE_ALREADY_EXISTS");
    }
    throw error;
  }
}

export async function deleteArchivedDay(userId: string, id: string): Promise<void> {
  const [deleted] = await db
    .delete(archivedDays)
    .where(and(eq(archivedDays.id, id), eq(archivedDays.userId, userId)))
    .returning();

  if (!deleted) {
    throw new NotFoundError("Archived day not found");
  }

  // Archiving already deleted the live event_files rows - the jsonb snapshot is the only source left.
  const storagePaths = deleted.events.flatMap((event) => event.files.map((file) => file.storagePath));
  await removeStorageObjects(storagePaths);
}
