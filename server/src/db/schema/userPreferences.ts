import { pgTable, uuid, boolean, pgEnum, pgPolicy } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { authUsers, authenticatedRole, authUid } from "drizzle-orm/supabase";

export const notificationChannelEnum = pgEnum("notification_channel", ["browser", "mobile"]);
export const appLanguageEnum = pgEnum("app_language", ["he", "en"]);
export const appThemeEnum = pgEnum("app_theme", ["light", "dark", "system"]);

export const userPreferences = pgTable("user_preferences", {
  userId: uuid().primaryKey().references(() => authUsers.id, { onDelete: "cascade" }),
  language: appLanguageEnum().notNull().default("he"),
  theme: appThemeEnum().notNull().default("system"),
  reminderEnabled: boolean().notNull().default(true),
  channels: notificationChannelEnum().array().notNull().default(["browser"]),
}, (t) => [
  pgPolicy("user_preferences_crud_own_row", {
    for: "all",
    to: authenticatedRole,
    using: sql`${authUid} = ${t.userId}`,
    withCheck: sql`${authUid} = ${t.userId}`,
  }),
]).enableRLS();
