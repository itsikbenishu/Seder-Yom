import type { ArchivedDay, GoogleCalendarConnectionStatus, GoogleCalendarEvent } from "@project/shared";
import { apiRequest } from "./apiClient";

export function getGoogleCalendarEventsForDate(day: ArchivedDay): Promise<GoogleCalendarEvent[]> {
  const query = new URLSearchParams({
    year: String(day.year),
    month: String(day.month),
    day: String(day.dayOfMonth),
  });

  return apiRequest<GoogleCalendarEvent[]>(`/gcal/events?${query.toString()}`);
}

export function getGoogleCalendarStatus(): Promise<GoogleCalendarConnectionStatus> {
  return apiRequest<GoogleCalendarConnectionStatus>("/gcal/status");
}

export async function disconnectGoogleCalendar(): Promise<void> {
  await apiRequest<null>("/gcal/disconnect", { method: "POST" });
}
