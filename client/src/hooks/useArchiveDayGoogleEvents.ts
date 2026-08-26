import { useQuery } from "@tanstack/react-query";
import type { ArchivedDay, GoogleCalendarEvent } from "@project/shared";
import { googleCalendarKeys } from "../services/queryKeys";
import { getGoogleCalendarEventsForDate } from "../services/googleCalendar.api";

export function useArchiveDayGoogleEvents(day: ArchivedDay) {
  return useQuery<GoogleCalendarEvent[]>({
    queryKey: googleCalendarKeys.forArchivedDay(day),
    queryFn: () => getGoogleCalendarEventsForDate(day),
  });
}
