import { z } from "zod";
import { dayOfWeekSchema, eventFilesSchema, timeStringSchema } from "./common.schema";

export const eventFrequencySchema = z.enum(["once", "daily", "weekly"]);

export const reminderLeadSchema = z.enum(["30m", "1h", "1d", "time"]);

const eventCoreShape = {
  dayOfWeek: dayOfWeekSchema,
  titleHe: z.string().min(1, "validation.title.required").max(80, "validation.title.maxLength"),
  titleEn: z.string().min(1, "validation.title.required").max(80, "validation.title.maxLength"),
  descHe: z.string().max(200, "validation.description.maxLength").optional(),
  descEn: z.string().max(200, "validation.description.maxLength").optional(),
  note: z.string().max(500, "validation.note.maxLength").optional(),
  start: timeStringSchema,
  end: timeStringSchema,
  allDay: z.boolean().default(false),
  freq: eventFrequencySchema,
  reminder: z.boolean().default(false),
  lead: reminderLeadSchema.optional(),
  leadTime: timeStringSchema.optional(),
  files: eventFilesSchema.default([]),
};

type EventCoreInput = {
  [K in keyof typeof eventCoreShape]?: z.infer<(typeof eventCoreShape)[K]>;
};

function applyEventBusinessRules(data: EventCoreInput, ctx: z.RefinementCtx) {
  if (!data.allDay && data.start !== undefined && data.end !== undefined && data.start >= data.end) {
    ctx.addIssue({
      code: "custom",
      message: "validation.time.endBeforeStart",
      path: ["end"],
    });
  }

  if (data.reminder && !data.lead) {
    ctx.addIssue({
      code: "custom",
      message: "validation.reminder.leadRequired",
      path: ["lead"],
    });
  }

  if (data.lead === "time" && !data.leadTime) {
    ctx.addIssue({
      code: "custom",
      message: "validation.reminder.leadTimeRequired",
      path: ["leadTime"],
    });
  }
}

export const createEventSchema = z.object(eventCoreShape).superRefine(applyEventBusinessRules);

export const updateEventSchema = z
  .object(eventCoreShape)
  .partial()
  .superRefine(applyEventBusinessRules);

export const eventSchema = z.object({
  id: z.uuid(),
  ...eventCoreShape,
  gcal: z.boolean().default(false),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type Event = z.infer<typeof eventSchema>;
