import { z } from "zod";

export const notificationChannelSchema = z.enum(["browser", "mobile"]);

export const notificationPreferencesSchema = z.object({
  user_id: z.uuid(),
  reminderEnabled: z.boolean().default(true),
  channels: z
    .array(notificationChannelSchema)
    .min(1, "validation.notifications.channelRequired")
    .max(1, "validation.notifications.channelSingle")
    .default(["browser"]),
});

export const updateNotificationPreferencesSchema = notificationPreferencesSchema.omit({
  user_id: true,
});

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;
