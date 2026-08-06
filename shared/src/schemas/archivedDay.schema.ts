import { z } from "zod";
import { dayOfWeekSchema } from "./common.schema.js";
import { eventSchema } from "./event.schema.js";

export const archivedDaySchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  month: z.number().int().min(0).max(11),
  dayOfMonth: z.number().int().min(1).max(31),
  year: z.number().int().min(2000),
  summary: z.string(),
  count: z.number().int().nonnegative(),
  events: z.array(eventSchema),
});

export type ArchivedDay = z.infer<typeof archivedDaySchema>;
