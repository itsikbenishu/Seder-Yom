import { z } from "zod";
import { dayOfWeekSchema, eventFilesSchema, timeStringSchema } from "./common.schema.js";

export const eventFrequencySchema = z.enum(["once", "daily", "weekly"]);
export const allDayEventFrequencySchema = z.enum(["daily", "weekly"]);

export const reminderLeadSchema = z.enum(["15m", "30m", "1h", "1d", "time"]);

const sharedEventFields = {
  dayOfWeek: dayOfWeekSchema,
  titleHe: z.string().min(1, "validation.title.required").max(80, "validation.title.maxLength"),
  titleEn: z.string().min(1, "validation.title.required").max(80, "validation.title.maxLength"),
  descHe: z.string().max(200, "validation.description.maxLength").optional(),
  descEn: z.string().max(200, "validation.description.maxLength").optional(),
  note: z.string().max(500, "validation.note.maxLength").optional(),
  start: timeStringSchema,
  end: timeStringSchema,
  reminder: z.boolean().default(false),
  reminderLeadTime: timeStringSchema.optional(),
  files: eventFilesSchema.default([]),
};

const timedEventShape = z.object({
  ...sharedEventFields,
  allDay: z.literal(false),
  frequency: eventFrequencySchema,
  reminderLead: reminderLeadSchema.optional(),
});

const allDayEventShape = z.object({
  ...sharedEventFields,
  allDay: z.literal(true),
  frequency: allDayEventFrequencySchema,
  // all-day reminders are always a fixed clock-time — no offset menu, so this is
  // never user-selected; defaults to "time" when omitted so the shared DB column
  // stays meaningfully populated for both event kinds.
  reminderLead: z.literal("time").default("time"),
});

type EventBusinessRuleInput = {
  allDay?: boolean;
  start?: string;
  end?: string;
  reminder?: boolean;
  reminderLead?: string;
  reminderLeadTime?: string;
};

function applyEventBusinessRules(data: EventBusinessRuleInput, ctx: z.RefinementCtx) {
  if (!data.allDay && data.start !== undefined && data.end !== undefined && data.start >= data.end) {
    ctx.addIssue({ code: "custom", message: "validation.time.endBeforeStart", path: ["end"] });
  }
  if (data.reminder && !data.reminderLead) {
    ctx.addIssue({ code: "custom", message: "validation.reminder.leadRequired", path: ["reminderLead"] });
  }
  if (data.reminderLead === "time" && !data.reminderLeadTime) {
    ctx.addIssue({ code: "custom", message: "validation.reminder.leadTimeRequired", path: ["reminderLeadTime"] });
  }
}

export const eventWriteSchema = z
  .discriminatedUnion("allDay", [timedEventShape, allDayEventShape])
  .superRefine(applyEventBusinessRules);

export const createEventSchema = eventWriteSchema;

// PATCH /events/:id — field-level validation only. The allDay <-> frequency/reminderLead
// cross-rule can't be checked from a partial payload (the existing row's `allDay` may not
// be part of the patch at all). The service layer must merge the validated patch onto the
// current row and re-validate the merged object with `eventWriteSchema` before persisting.
export const updateEventSchema = z
  .object({
    ...sharedEventFields,
    allDay: z.boolean(),
    frequency: eventFrequencySchema,
    reminderLead: reminderLeadSchema.optional(),
  })
  .partial()
  .superRefine(applyEventBusinessRules);

export const eventSchema = z.discriminatedUnion("allDay", [
  timedEventShape.extend({ id: z.uuid(), googleCalendarSynced: z.boolean().default(false) }),
  allDayEventShape.extend({ id: z.uuid(), googleCalendarSynced: z.boolean().default(false) }),
]);

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type Event = z.infer<typeof eventSchema>;
