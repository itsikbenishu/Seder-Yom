import type { ArchiveConflictResolution, CreateEventInput, UpdateEventInput } from "@project/shared";
import type { CalendarEvent } from "../types/calendarEvent";
import { apiRequest } from "./apiClient";

export function getWeekEvents(): Promise<CalendarEvent[]> {
  return apiRequest<CalendarEvent[]>("/events");
}

export async function muteDay(dayOfWeek: number): Promise<void> {
  await apiRequest<null>(`/events/mute-day/${dayOfWeek}`, { method: "PATCH" });
}

export async function unmuteDay(dayOfWeek: number): Promise<void> {
  await apiRequest<null>(`/events/unmute-day/${dayOfWeek}`, { method: "PATCH" });
}

export function createEvent(input: CreateEventInput): Promise<CalendarEvent> {
  return apiRequest<CalendarEvent>("/events", { method: "POST", body: JSON.stringify(input) });
}

export interface UpdateEventArgs {
  id: string;
  input: UpdateEventInput;
}

export function updateEvent({ id, input }: UpdateEventArgs): Promise<CalendarEvent> {
  return apiRequest<CalendarEvent>(`/events/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function deleteEvent(id: string): Promise<void> {
  await apiRequest<null>(`/events/${id}`, { method: "DELETE" });
}

export async function clearDay(dayOfWeek: number): Promise<void> {
  await apiRequest<null>(`/events/day/${dayOfWeek}`, { method: "DELETE" });
}

export async function archiveDay(dayOfWeek: number, onConflict?: ArchiveConflictResolution): Promise<void> {
  const query = onConflict ? `?onConflict=${onConflict}` : "";
  await apiRequest<null>(`/archive/${dayOfWeek}${query}`, { method: "POST" });
}
