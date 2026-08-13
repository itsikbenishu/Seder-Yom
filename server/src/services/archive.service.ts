import { and, count, desc, eq, ilike } from "drizzle-orm";
import { archivedDaySchema, type ArchivedDay, type ArchiveQuery, type ArchiveResponseData } from "@project/shared";
import { db } from "../db/client.js";
import { archivedDays, events } from "../db/schema/index.js";
import { ConflictError } from "../utils/AppError.js";
import { toApiEvent } from "./events.service.js";

type ArchivedDayRow = typeof archivedDays.$inferSelect;

// Events only carry a day-of-week, not an absolute date — this resolves
// dayOfWeek to a concrete date in the current week, using JS's own Date.getDay()
// convention (0 = Sunday .. 6 = Saturday). Duplicated from reminderTime.ts rather than
// imported: it's a 5-line pure function, not worth a shared module for one extra caller.
function dateForDayOfWeek(dayOfWeek: number): Date {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  date.setDate(date.getDate() + (dayOfWeek - date.getDay()));
  return date;
}

function toApiArchivedDay(row: ArchivedDayRow): ArchivedDay {
  return archivedDaySchema.parse({
    dayOfWeek: row.dayOfWeek,
    month: row.month,
    dayOfMonth: row.dayOfMonth,
    year: row.year,
    summary: row.summary,
    count: row.count,
    events: row.events,
  });
}

export async function listArchivedDays(userId: string, query: ArchiveQuery): Promise<ArchiveResponseData> {
  const where = and(eq(archivedDays.userId, userId), query.search ? ilike(archivedDays.summary, `%${query.search}%`) : undefined);

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

export async function archiveDay(userId: string, dayOfWeek: number): Promise<ArchivedDay> {
  const localEventsPredicate = and(eq(events.userId, userId), eq(events.dayOfWeek, dayOfWeek), eq(events.googleCalendarSynced, false));

  const precheck = await db.select().from(events).where(localEventsPredicate);
  if (precheck.length === 0) {
    throw new ConflictError("No events to archive for this day", "ARCHIVE_EMPTY_DAY");
  }

  try {
    const inserted = await db.transaction(async (archiveTransaction) => {
      const localEvents = await archiveTransaction.select().from(events).where(localEventsPredicate);
      if (localEvents.length === 0) {
        throw new ConflictError("No events to archive for this day", "ARCHIVE_EMPTY_DAY");
      }

      const summary = localEvents
        .slice(0, 3)
        .map((event) => event.title)
        .join(", ");
      const date = dateForDayOfWeek(dayOfWeek);
      const eventsSnapshot = await Promise.all(localEvents.map(toApiEvent));

      const [row] = await archiveTransaction
        .insert(archivedDays)
        .values({
          userId,
          dayOfWeek,
          month: date.getMonth(),
          dayOfMonth: date.getDate(),
          year: date.getFullYear(),
          summary,
          count: localEvents.length,
          events: eventsSnapshot,
        })
        .returning();

      await archiveTransaction.delete(events).where(localEventsPredicate);

      return row;
    });

    return toApiArchivedDay(inserted);
  } catch (error) {
    if (error instanceof ConflictError) {
      throw error;
    }
    if ((error as { code?: string }).code === "23505") {
      throw new ConflictError("This day has already been archived", "ARCHIVE_ALREADY_EXISTS");
    }
    throw error;
  }
}
