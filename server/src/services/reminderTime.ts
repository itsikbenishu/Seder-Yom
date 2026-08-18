import { z } from "zod";
import { reminderLeadSchema } from "@project/shared";
import { dateForDayOfWeek } from "./weekDates.js";

type ReminderLead = z.infer<typeof reminderLeadSchema>;

const LEAD_OFFSET_MINUTES: Record<Exclude<ReminderLead, "time">, number> = {
  "15m": 15,
  "30m": 30,
  "1h": 60,
  "1d": 1440,
};

interface ReminderTimeInput {
  dayOfWeek: number;
  start: string;
  reminderLead: ReminderLead;
  reminderLeadTime?: string;
}

function withTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

export function computeReminderTime(event: ReminderTimeInput): Date {
  if (event.reminderLead === "time") {
    if (!event.reminderLeadTime) {
      throw new Error("reminderLeadTime is required when reminderLead is 'time'");
    }
    return withTime(dateForDayOfWeek(event.dayOfWeek), event.reminderLeadTime);
  }

  const eventDateTime = withTime(dateForDayOfWeek(event.dayOfWeek), event.start);
  const offsetMinutes = LEAD_OFFSET_MINUTES[event.reminderLead];
  return new Date(eventDateTime.getTime() - offsetMinutes * 60_000);
}
