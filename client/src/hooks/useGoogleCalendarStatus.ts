import { useQuery } from "@tanstack/react-query";
import type { GoogleCalendarConnectionStatus } from "@project/shared";
import { googleCalendarKeys } from "../services/queryKeys";
import { getGoogleCalendarStatus } from "../services/googleCalendar.api";

export function useGoogleCalendarStatus() {
  return useQuery<GoogleCalendarConnectionStatus>({
    queryKey: googleCalendarKeys.status(),
    queryFn: getGoogleCalendarStatus,
  });
}
