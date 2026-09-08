import { useQuery } from "@tanstack/react-query";
import type { GoogleCalendarConnectionStatus } from "@project/shared";
import { googleCalendarKeys } from "../services/queryKeys";
import { getGoogleCalendarStatus } from "../services/googleCalendar.api";

const SYNC_INTERVAL_MS = 5 * 60 * 1000;

export function useGoogleCalendarStatus() {
  return useQuery<GoogleCalendarConnectionStatus>({
    queryKey: googleCalendarKeys.status(),
    queryFn: getGoogleCalendarStatus,
    refetchInterval: SYNC_INTERVAL_MS,
  });
}
