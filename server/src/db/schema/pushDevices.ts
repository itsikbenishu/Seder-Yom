import { pgTable, uuid, text, timestamp, index, pgPolicy } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { authUsers, authenticatedRole, authUid } from "drizzle-orm/supabase";
import { notificationChannelEnum } from "./userPreferences.js";

// One row per FCM registration token. `platform` is derived client-side from the
// user agent so the worker can honour the user's single notification channel.
export const pushDevices = pgTable("push_devices", {
  token: text().primaryKey(),
  userId: uuid().notNull().references(() => authUsers.id, { onDelete: "cascade" }),
  platform: notificationChannelEnum().notNull(),
  userAgent: text(),
  createdAt: timestamp().notNull().defaultNow(),
  lastSeenAt: timestamp().notNull().defaultNow(),
}, (t) => [
  index("push_devices_user_idx").on(t.userId),
  pgPolicy("push_devices_crud_own_rows", {
    for: "all",
    to: authenticatedRole,
    using: sql`${authUid} = ${t.userId}`,
    withCheck: sql`${authUid} = ${t.userId}`,
  }),
]).enableRLS();
