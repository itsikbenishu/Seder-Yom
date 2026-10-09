import { dateForDayOfWeek, dayOfWeekForDate } from "@project/shared";
import type { GoogleCalendarEvent } from "@project/shared";
import type { AllDayCalendarEvent, CalendarEvent, TimedCalendarEvent } from "../types/calendarEvent";
import { hasAllDayReminder, type DayAllDayEvent, type DayTimedEvent, type DayViewData } from "../types/day";

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
  // No-reminder events first (original order), then reminder-having events ascending by reminderTime.
  const allDayEventsUnsorted: DayAllDayEvent[] = [...localAllDayEvents, ...googleAllDayEvents];
  const withoutReminder = allDayEventsUnsorted.filter((event) => !hasAllDayReminder(event));
  const withReminder = allDayEventsUnsorted
    .filter(hasAllDayReminder)
    .sort((a, b) => a.reminderTime.localeCompare(b.reminderTime));
  const allDayEvents: DayAllDayEvent[] = [...withoutReminder, ...withReminder];

  const date = dateForDayOfWeek(dayOfWeek);
  const isToday = dayOfWeek === dayOfWeekForDate(now);

  return {
    dayOfWeek,
    date: { yr: date.getFullYear(), month: date.getMonth(), day: date.getDate() },
    timedEvents,
    allDayEvents,
    isMuted,
    // "Next up" is a same-day concept - a future day's first event-after-current-clock-time is
    // not "next up", it just happens to share a time-of-day with whatever moment "now" is.
    nextUpEventId: isToday ? nextUpEventId(timedEvents, now) : null,
  };
}
