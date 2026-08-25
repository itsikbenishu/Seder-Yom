import { pgTable, uuid, smallint, varchar, time, boolean, pgEnum, index, check, pgPolicy } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { authUsers, authenticatedRole, authUid } from "drizzle-orm/supabase";

export const eventFrequencyEnum = pgEnum("event_frequency", ["once", "daily", "weekly"]);
export const reminderModeEnum = pgEnum("reminder_mode", ["15m", "30m", "1h", "1d", "time"]);

export const events = pgTable("events", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull().references(() => authUsers.id, { onDelete: "cascade" }),
  dayOfWeek: smallint().notNull(),
  title: varchar({ length: 80 }).notNull(),
  description: varchar({ length: 200 }),
  note: varchar({ length: 500 }),
  // stored as native `time`; round-trips as "HH:mm:ss" via postgres-js — repository layer must trim to HH:mm for the API/Zod contract
  start: time().notNull(),
  end: time().notNull(),
  allDay: boolean().notNull().default(false),
  frequency: eventFrequencyEnum().notNull(),
  reminder: boolean().notNull().default(false),
  reminderMode: reminderModeEnum(),
  reminderTime: time(),
  googleCalendarSynced: boolean().notNull().default(false),
  mutedUntilArchive: boolean().notNull().default(false),
}, (t) => [
  index("events_user_day_idx").on(t.userId, t.dayOfWeek),
  check("events_day_of_week_range", sql`${t.dayOfWeek} >= 0 AND ${t.dayOfWeek} <= 6`),
  check("events_all_day_frequency", sql`${t.allDay} = false OR ${t.frequency} <> 'once'`),
  check("events_all_day_reminder_mode", sql`${t.allDay} = false OR ${t.reminderMode} IS NULL OR ${t.reminderMode} = 'time'`),
  check("events_all_day_muted", sql`${t.allDay} = false OR ${t.mutedUntilArchive} = false`),
  pgPolicy("events_crud_own_rows", {
    for: "all",
    to: authenticatedRole,
    using: sql`${authUid} = ${t.userId}`,
    withCheck: sql`${authUid} = ${t.userId}`,
  }),
]).enableRLS();
