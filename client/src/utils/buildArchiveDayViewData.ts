import type { ArchivedDay, GoogleCalendarEvent } from "@project/shared";
import type { AllDayCalendarEvent, TimedCalendarEvent } from "../types/calendarEvent";
import type { ArchiveDayViewData } from "../types/archiveDay";

export function buildArchiveDayViewData(day: ArchivedDay, googleEvents: GoogleCalendarEvent[]): ArchiveDayViewData {
  const localTimedEvents = day.events.filter((event) => !event.allDay) as TimedCalendarEvent[];
  const localAllDayEvents = day.events.filter((event) => event.allDay) as AllDayCalendarEvent[];

  const googleTimedEvents = googleEvents.filter((event) => !event.allDay);
  const googleAllDayEvents = googleEvents.filter((event) => event.allDay);

  const timedEvents = [...localTimedEvents, ...googleTimedEvents].sort((a, b) => a.start.localeCompare(b.start));
  const allDayEvents = [...localAllDayEvents, ...googleAllDayEvents];

  return { day, timedEvents, allDayEvents };
}
