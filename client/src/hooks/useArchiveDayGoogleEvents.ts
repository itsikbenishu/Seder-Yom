import { useQuery } from "@tanstack/react-query";
import type { ArchivedDay, GoogleCalendarEvent } from "@project/shared";
import { googleCalendarKeys } from "../services/queryKeys";
import { getGoogleCalendarEventsForDate } from "../services/googleCalendar.api";

const SYNC_INTERVAL_MS = 5 * 60 * 1000;

export function useArchiveDayGoogleEvents(day: ArchivedDay) {
  return useQuery<GoogleCalendarEvent[]>({
    queryKey: googleCalendarKeys.forArchivedDay(day),
    queryFn: () => getGoogleCalendarEventsForDate(day),
    refetchInterval: SYNC_INTERVAL_MS,
  });
}
