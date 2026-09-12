import type { ReminderMode } from "../schemas/event.schema.js";
import { dateForDayOfWeek } from "./weekDates.js";

// Resolves an event's reminder instant — shared so server (enqueue) and worker (send) agree.

const OFFSET_MINUTES: Record<Exclude<ReminderMode, "time">, number> = {
  "15m": 15,
  "30m": 30,
  "1h": 60,
  "1d": 1440,
};

export interface ReminderTimeInput {
  dayOfWeek: number;
  start: string;
  reminderMode: ReminderMode;
  reminderTime?: string;
}

function withTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

export function computeReminderTime(event: ReminderTimeInput): Date {
  if (event.reminderMode === "time") {
    if (!event.reminderTime) {
      throw new Error("reminderTime is required when reminderMode is 'time'");
    }
    return withTime(dateForDayOfWeek(event.dayOfWeek), event.reminderTime);
  }

  const eventDateTime = withTime(dateForDayOfWeek(event.dayOfWeek), event.start);
  const offsetMinutes = OFFSET_MINUTES[event.reminderMode];
  return new Date(eventDateTime.getTime() - offsetMinutes * 60_000);
}
