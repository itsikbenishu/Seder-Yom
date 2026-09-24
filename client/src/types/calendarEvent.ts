import type { Event, GoogleCalendarEvent } from "@project/shared";

/** A calendar event as consumed by client views (Week/Day). Alias over the shared, Zod-inferred `Event`. */
export type CalendarEvent = Event;

export type TimedCalendarEvent = Extract<CalendarEvent, { allDay: false }>;
export type AllDayCalendarEvent = Extract<CalendarEvent, { allDay: true }>;

export type CalendarEventOrGoogle = CalendarEvent | GoogleCalendarEvent;

export function isGoogleCalendarEvent(event: CalendarEventOrGoogle): event is GoogleCalendarEvent {
  return "gcal" in event;
}
