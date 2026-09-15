import { sql } from "./client.js";
import type { ReminderMode } from "@project/shared";

export interface EventReminderState {
  id: string;
  mutedUntilArchive: boolean;
  reminder: boolean;
  dayOfWeek: number;
  start: string;
  reminderMode: ReminderMode | null;
  reminderTime: string | null;
  reminderSentFor: Date | null;
}

interface EventRow {
  id: string;
  muted_until_archive: boolean;
  reminder: boolean;
  day_of_week: number;
  start: string;
  reminder_mode: ReminderMode | null;
  reminder_time: string | null;
  reminder_sent_for: Date | null;
}

// Raw SQL (worker has no Drizzle access) - the fields the consumer needs to re-derive the due instant.
export async function findEventReminderState(eventId: string): Promise<EventReminderState | null> {
  const rows = await sql<EventRow[]>`
    SELECT id, muted_until_archive, reminder, day_of_week, start, reminder_mode, reminder_time, reminder_sent_for
    FROM events WHERE id = ${eventId}
  `;
  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    mutedUntilArchive: row.muted_until_archive,
    reminder: row.reminder,
    dayOfWeek: row.day_of_week,
    start: row.start,
    reminderMode: row.reminder_mode,
    reminderTime: row.reminder_time,
    reminderSentFor: row.reminder_sent_for,
  };
}

// Records the reminder instant a push was just delivered.
export async function markReminderSent(eventId: string, sentFor: Date): Promise<void> {
  await sql`UPDATE events SET reminder_sent_for = ${sentFor} WHERE id = ${eventId}`;
}
