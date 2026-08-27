import type { NotificationPreferences, UpdateNotificationPreferencesInput } from "@project/shared";
import { apiRequest } from "./apiClient";

export function getNotificationPreferences(): Promise<NotificationPreferences> {
  return apiRequest<NotificationPreferences>("/notifications/preferences");
}

export function updateNotificationPreferences(
  input: UpdateNotificationPreferencesInput,
): Promise<NotificationPreferences> {
  return apiRequest<NotificationPreferences>("/notifications/preferences", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
