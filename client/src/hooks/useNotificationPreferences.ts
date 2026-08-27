import { useQuery } from "@tanstack/react-query";
import type { NotificationPreferences } from "@project/shared";
import { notificationKeys } from "../services/queryKeys";
import { getNotificationPreferences } from "../services/notifications.api";

export function useNotificationPreferences() {
  return useQuery<NotificationPreferences>({
    queryKey: notificationKeys.preferences(),
    queryFn: getNotificationPreferences,
  });
}
