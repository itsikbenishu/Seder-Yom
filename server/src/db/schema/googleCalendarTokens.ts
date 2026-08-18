import { pgTable, uuid, text, timestamp, pgPolicy } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { authUsers, authenticatedRole, authUid } from "drizzle-orm/supabase";

export const googleCalendarTokens = pgTable("google_calendar_tokens", {
  userId: uuid().primaryKey().references(() => authUsers.id, { onDelete: "cascade" }),
  accessToken: text().notNull(),
  refreshToken: text().notNull(),
  accessTokenExpiresAt: timestamp().notNull(),
  scope: text().notNull(),
  connectedAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
}, (t) => [
  pgPolicy("google_calendar_tokens_crud_own_row", {
    for: "all",
    to: authenticatedRole,
    using: sql`${authUid} = ${t.userId}`,
    withCheck: sql`${authUid} = ${t.userId}`,
  }),
]).enableRLS();
