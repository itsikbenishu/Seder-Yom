import type { ArchivedDay, GoogleCalendarEvent } from "@project/shared";
import { apiRequest } from "./apiClient";

export function getGoogleCalendarEventsForDate(day: ArchivedDay): Promise<GoogleCalendarEvent[]> {
  const query = new URLSearchParams({
    year: String(day.year),
    month: String(day.month),
    day: String(day.dayOfMonth),
  });

  return apiRequest<GoogleCalendarEvent[]>(`/gcal/events?${query.toString()}`);
}
