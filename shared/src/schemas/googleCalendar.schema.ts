import { z } from "zod";
import { dayOfWeekSchema, timeStringSchema } from "./common.schema.js";

// Distinct from `eventSchema`: reminder/frequency/files/note don't apply to a read-only
// external event, and Google's event IDs are opaque strings, not UUIDs.
export const googleCalendarEventSchema = z.object({
  id: z.string().min(1),
  dayOfWeek: dayOfWeekSchema,
  title: z.string(),
  description: z.string().optional(),
  start: timeStringSchema,
  end: timeStringSchema,
  allDay: z.boolean(),
  gcal: z.literal(true),
});

export type GoogleCalendarEvent = z.infer<typeof googleCalendarEventSchema>;

export const googleCalendarConnectionStatusSchema = z.object({
  connected: z.boolean(),
  scope: z.string().optional(),
  connectedAt: z.iso.datetime().optional(),
});

export type GoogleCalendarConnectionStatus = z.infer<typeof googleCalendarConnectionStatusSchema>;

export const googleCalendarCallbackQuerySchema = z.object({
  code: z.string().min(1).optional(),
  state: z.string().min(1),
  error: z.string().optional(),
});

export type GoogleCalendarCallbackQuery = z.infer<typeof googleCalendarCallbackQuerySchema>;
