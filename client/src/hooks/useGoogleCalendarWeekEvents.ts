import { useQuery } from "@tanstack/react-query";
import type { GoogleCalendarEvent } from "@project/shared";
import { googleCalendarKeys } from "../services/queryKeys";
import { getGoogleCalendarWeekEvents } from "../services/googleCalendar.api";

const SYNC_INTERVAL_MS = 5 * 60 * 1000;

export function useGoogleCalendarWeekEvents() {
  return useQuery<GoogleCalendarEvent[]>({
    queryKey: googleCalendarKeys.week(),
    queryFn: getGoogleCalendarWeekEvents,
    refetchInterval: SYNC_INTERVAL_MS,
  });
}
