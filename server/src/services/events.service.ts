import { and, eq } from "drizzle-orm";
import { eventSchema, eventWriteSchema, type CreateEventInput, type Event, type UpdateEventInput } from "@project/shared";
import { db } from "../db/client.js";
import { events } from "../db/schema/index.js";
import { NotFoundError } from "../utils/AppError.js";
import { computeReminderTime } from "./reminderTime.js";
import { publishReminderJob } from "./reminderQueue.service.js";

type EventRow = typeof events.$inferSelect;

function trimSeconds(time: string): string {
  return time.slice(0, 5);
}

export function toApiEvent(row: EventRow): Event {
  return eventSchema.parse({
    ...toWritableFields(row),
    id: row.id,
    googleCalendarSynced: row.googleCalendarSynced,
  });
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
    files: row.files,
  };
}

export async function listEvents(userId: string): Promise<Event[]> {
  const rows = await db.select().from(events).where(eq(events.userId, userId));
  return rows.map(toApiEvent);
}

export async function createEvent(userId: string, input: CreateEventInput, correlationId: string): Promise<Event> {
  const [row] = await db
    .insert(events)
    .values({ ...input, userId })
    .returning();

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

  const merged = eventWriteSchema.parse({ ...toWritableFields(existing), ...patch });

  const [row] = await db
    .update(events)
    .set(merged)
    .where(and(eq(events.id, id), eq(events.userId, userId)))
    .returning();

  return toApiEvent(row);
}

export async function deleteEvent(userId: string, id: string): Promise<void> {
  const [deleted] = await db
    .delete(events)
    .where(and(eq(events.id, id), eq(events.userId, userId)))
    .returning({ id: events.id });

  if (!deleted) {
    throw new NotFoundError("Event not found");
  }
}
