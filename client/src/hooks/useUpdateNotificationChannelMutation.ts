import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationKeys } from "../services/queryKeys";
import { updateNotificationPreferences } from "../services/notifications.api";
import type { NotificationChannel } from "../types/settings";

export function useUpdateNotificationChannelMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, NotificationChannel>({
    mutationFn: async (channel) => {
      await updateNotificationPreferences({ reminderEnabled: true, channels: [channel] });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.preferences() });
    },
  });
}
