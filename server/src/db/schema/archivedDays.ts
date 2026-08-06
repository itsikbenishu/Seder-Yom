import { pgTable, uuid, smallint, text, integer, jsonb, index, uniqueIndex, check, pgPolicy } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { authUsers, authenticatedRole, authUid } from "drizzle-orm/supabase";
import type { Event } from "@project/shared";

export const archivedDays = pgTable("archived_days", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull().references(() => authUsers.id, { onDelete: "cascade" }),
  dayOfWeek: smallint().notNull(),
  month: smallint().notNull(),
  dayOfMonth: smallint().notNull(),
  year: smallint().notNull(),
  summary: text().notNull(),
  count: integer().notNull().default(0),
  events: jsonb().$type<Event[]>().notNull().default([]),
}, (t) => [
  index("archived_days_user_year_month_day_idx").on(t.userId.desc(), t.year.desc(), t.month.desc(), t.dayOfMonth.desc()),
  uniqueIndex("archived_days_user_year_month_day_unique").on(t.userId, t.year, t.month, t.dayOfMonth),
  check("archived_days_day_of_week_range", sql`${t.dayOfWeek} >= 0 AND ${t.dayOfWeek} <= 6`),
  check("archived_days_month_range", sql`${t.month} >= 0 AND ${t.month} <= 11`),
  check("archived_days_day_of_month_range", sql`${t.dayOfMonth} >= 1 AND ${t.dayOfMonth} <= 31`),
  pgPolicy("archived_days_crud_own_rows", {
    for: "all",
    to: authenticatedRole,
    using: sql`${authUid} = ${t.userId}`,
    withCheck: sql`${authUid} = ${t.userId}`,
  }),
]).enableRLS();
