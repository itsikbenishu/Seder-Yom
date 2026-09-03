import { z } from "zod";
import { dayOfWeekSchema, eventFilesSchema, MAX_FILES_PER_EVENT, timeStringSchema } from "./common.schema.js";

export const eventFrequencySchema = z.enum(["once", "daily", "weekly"]);
export const allDayEventFrequencySchema = z.enum(["daily", "weekly"]);

export const reminderModeSchema = z.enum(["15m", "30m", "1h", "1d", "time"]);

const fileIdsSchema = z.array(z.uuid()).max(MAX_FILES_PER_EVENT, "validation.file.count").default([]);

const sharedEventFields = {
  dayOfWeek: dayOfWeekSchema,
  title: z.string().min(1, "validation.title.required").max(80, "validation.title.maxLength"),
  description: z.string().max(200, "validation.description.maxLength").optional(),
  note: z.string().max(500, "validation.note.maxLength").optional(),
  start: timeStringSchema,
  end: timeStringSchema,
  reminder: z.boolean().default(false),
  reminderTime: timeStringSchema.optional(),
  mutedUntilArchive: z.boolean().default(false),
  fileIds: fileIdsSchema,
};

const timedEventShape = z.object({
  ...sharedEventFields,
  allDay: z.literal(false),
  frequency: eventFrequencySchema,
  reminderMode: reminderModeSchema.optional(),
});

const allDayEventShape = z.object({
  ...sharedEventFields,
  allDay: z.literal(true),
  frequency: allDayEventFrequencySchema,
  // all-day reminders are always a fixed clock-time, never user-selected.
  reminderMode: z.literal("time").default("time"),
});

type EventBusinessRuleInput = {
  allDay?: boolean;
  start?: string;
  end?: string;
  reminder?: boolean;
  reminderMode?: string;
  reminderTime?: string;
};

function applyEventBusinessRules(data: EventBusinessRuleInput, ctx: z.RefinementCtx) {
  if (!data.allDay && data.start !== undefined && data.end !== undefined && data.start >= data.end) {
    ctx.addIssue({ code: "custom", message: "validation.time.endBeforeStart", path: ["end"] });
  }
  if (data.reminder && !data.reminderMode) {
    ctx.addIssue({ code: "custom", message: "validation.reminder.modeRequired", path: ["reminderMode"] });
  }
  if (data.reminder && data.reminderMode === "time" && !data.reminderTime) {
    ctx.addIssue({ code: "custom", message: "validation.reminder.timeRequired", path: ["reminderTime"] });
  }
}

export const eventWriteSchema = z
  .discriminatedUnion("allDay", [timedEventShape, allDayEventShape])
  .superRefine(applyEventBusinessRules);

export const createEventSchema = eventWriteSchema;

// PATCH: field-level only — a partial payload can't enforce the allDay/frequency/reminderMode
// cross-rule, so the service layer must merge onto the current row and re-validate with eventWriteSchema.
export const updateEventSchema = z
  .object({
    ...sharedEventFields,
    allDay: z.boolean(),
    frequency: eventFrequencySchema,
    reminderMode: reminderModeSchema.optional(),
  })
  .partial()
  .superRefine(applyEventBusinessRules);

export const eventSchema = z.discriminatedUnion("allDay", [
  timedEventShape
    .omit({ fileIds: true })
    .extend({ id: z.uuid(), googleCalendarSynced: z.boolean().default(false), files: eventFilesSchema.default([]) }),
  allDayEventShape
    .omit({ fileIds: true })
    .extend({ id: z.uuid(), googleCalendarSynced: z.boolean().default(false), files: eventFilesSchema.default([]) }),
]);

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type Event = z.infer<typeof eventSchema>;
export type EventFrequency = z.infer<typeof eventFrequencySchema>;
export type AllDayEventFrequency = z.infer<typeof allDayEventFrequencySchema>;
export type ReminderMode = z.infer<typeof reminderModeSchema>;
