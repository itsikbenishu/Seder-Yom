import { useQuery } from "@tanstack/react-query";
import { eventKeys } from "../services/queryKeys";
import { getWeekEvents } from "../services/events.api";
import type { CalendarEvent } from "../types/calendarEvent";

export function useWeekEvents() {
  return useQuery<CalendarEvent[]>({
    queryKey: eventKeys.week(),
    queryFn: getWeekEvents,
  });
}
