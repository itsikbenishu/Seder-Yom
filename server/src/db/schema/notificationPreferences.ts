import { pgTable, uuid, boolean, pgEnum, pgPolicy } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { authUsers, authenticatedRole, authUid } from "drizzle-orm/supabase";

export const notificationChannelEnum = pgEnum("notification_channel", ["browser", "mobile"]);

export const notificationPreferences = pgTable("notification_preferences", {
  userId: uuid().primaryKey().references(() => authUsers.id, { onDelete: "cascade" }),
  reminderEnabled: boolean().notNull().default(true),
  channels: notificationChannelEnum().array().notNull().default(["browser"]),
}, (t) => [
  pgPolicy("notification_preferences_crud_own_row", {
    for: "all",
    to: authenticatedRole,
    using: sql`${authUid} = ${t.userId}`,
    withCheck: sql`${authUid} = ${t.userId}`,
  }),
]).enableRLS();
