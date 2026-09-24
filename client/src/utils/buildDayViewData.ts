import { dateForDayOfWeek } from "@project/shared";
import type { GoogleCalendarEvent } from "@project/shared";
import type { AllDayCalendarEvent, CalendarEvent, TimedCalendarEvent } from "../types/calendarEvent";
import type { DayAllDayEvent, DayTimedEvent, DayViewData } from "../types/day";

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function nextUpEventId(timedEvents: DayTimedEvent[], now: Date): string | null {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const upcoming = timedEvents.find((event) => toMinutes(event.start) >= nowMinutes);
  return upcoming?.id ?? null;
}

export function buildDayViewData(
  events: CalendarEvent[],
  dayOfWeek: number,
  now: Date = new Date(),
  googleEvents: GoogleCalendarEvent[] = [],
): DayViewData {
  const dayEvents = events.filter((event) => event.dayOfWeek === dayOfWeek);
  const localTimedEvents = dayEvents.filter((event) => !event.allDay) as TimedCalendarEvent[];
  const localAllDayEvents = dayEvents.filter((event) => event.allDay) as AllDayCalendarEvent[];

  const dayGoogleEvents = googleEvents.filter((event) => event.dayOfWeek === dayOfWeek);
  const googleTimedEvents = dayGoogleEvents.filter((event) => !event.allDay);
  const googleAllDayEvents = dayGoogleEvents.filter((event) => event.allDay);

  // Local-only: Google events have no mutedUntilArchive.
  const isMuted = localTimedEvents.length > 0 && localTimedEvents.every((event) => event.mutedUntilArchive);

  const timedEvents: DayTimedEvent[] = [...localTimedEvents, ...googleTimedEvents].sort((a, b) =>
    a.start.localeCompare(b.start),
  );
  const allDayEvents: DayAllDayEvent[] = [...localAllDayEvents, ...googleAllDayEvents];

  const date = dateForDayOfWeek(dayOfWeek);

  return {
    dayOfWeek,
    date: { yr: date.getFullYear(), month: date.getMonth(), day: date.getDate() },
    timedEvents,
    allDayEvents,
    isMuted,
    nextUpEventId: nextUpEventId(timedEvents, now),
  };
}
