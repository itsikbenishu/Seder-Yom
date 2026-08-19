import type { CalendarEvent } from "../types/calendarEvent";
import { apiRequest } from "./apiClient";

export function getWeekEvents(): Promise<CalendarEvent[]> {
  return apiRequest<CalendarEvent[]>("/events");
}

export async function muteDay(dayOfWeek: number): Promise<void> {
  await apiRequest<null>(`/events/mute-day/${dayOfWeek}`, { method: "PATCH" });
}
