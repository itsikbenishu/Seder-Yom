import type { Event } from "@project/shared";

/** A calendar event as consumed by client views (Week/Day). Alias over the shared, Zod-inferred `Event`. */
export type CalendarEvent = Event;

export type TimedCalendarEvent = Extract<CalendarEvent, { allDay: false }>;
export type AllDayCalendarEvent = Extract<CalendarEvent, { allDay: true }>;
