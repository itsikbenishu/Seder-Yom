import { dateForDayOfWeek } from "@project/shared";
import type { AllDayCalendarEvent, CalendarEvent, TimedCalendarEvent } from "../types/calendarEvent";
import type { DayViewData } from "../types/day";

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function nextUpEventId(timedEvents: TimedCalendarEvent[], now: Date): string | null {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const upcoming = timedEvents.find((event) => toMinutes(event.start) >= nowMinutes);
  return upcoming?.id ?? null;
}

export function buildDayViewData(events: CalendarEvent[], dayOfWeek: number, now: Date = new Date()): DayViewData {
  const dayEvents = events.filter((event) => event.dayOfWeek === dayOfWeek);

  const timedEvents = (dayEvents.filter((event) => !event.allDay) as TimedCalendarEvent[])
    .slice()
    .sort((a, b) => a.start.localeCompare(b.start));

  const allDayEvents = dayEvents.filter((event) => event.allDay) as AllDayCalendarEvent[];

  const date = dateForDayOfWeek(dayOfWeek);

  return {
    dayOfWeek,
    date: { yr: date.getFullYear(), month: date.getMonth(), day: date.getDate() },
    timedEvents,
    allDayEvents,
    isMuted: timedEvents.length > 0 && timedEvents.every((event) => event.mutedUntilArchive),
    nextUpEventId: nextUpEventId(timedEvents, now),
  };
}
