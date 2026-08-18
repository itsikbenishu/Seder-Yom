import { eq } from "drizzle-orm";
import {
  notificationPreferencesSchema,
  type NotificationPreferences,
  type UpdateNotificationPreferencesInput,
} from "@project/shared";
import { db } from "../db/client.js";
import { notificationPreferences } from "../db/schema/index.js";

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const [row] = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId));

  // No row yet (user never touched Settings) — fall back to the same defaults the DB
  // columns themselves declare, rather than a 404: preferences always "exist" logically.
  if (!row) {
    return notificationPreferencesSchema.parse({ user_id: userId, reminderEnabled: true, channels: ["browser"] });
  }

  return notificationPreferencesSchema.parse({
    user_id: row.userId,
    reminderEnabled: row.reminderEnabled,
    channels: row.channels,
  });
}

export async function upsertNotificationPreferences(
  userId: string,
  input: UpdateNotificationPreferencesInput,
): Promise<NotificationPreferences> {
  const [row] = await db
    .insert(notificationPreferences)
    .values({ userId, reminderEnabled: input.reminderEnabled, channels: input.channels })
    .onConflictDoUpdate({
      target: notificationPreferences.userId,
      set: { reminderEnabled: input.reminderEnabled, channels: input.channels },
    })
    .returning();

  return notificationPreferencesSchema.parse({
    user_id: row.userId,
    reminderEnabled: row.reminderEnabled,
    channels: row.channels,
  });
}
