import { z } from "zod";
import { notificationChannelSchema } from "./userPreferences.schema.js";

export const reminderJobStatusSchema = z.enum(["pending", "sent", "failed"]);

export const reminderJobSchema = z.object({
  eventId: z.uuid(),
  userId: z.uuid(),
  eventTitle: z.string(),
  reminderTime: z.iso.datetime(),
  channels: z.array(notificationChannelSchema),
  status: reminderJobStatusSchema,
});

export type ReminderJob = z.infer<typeof reminderJobSchema>;
