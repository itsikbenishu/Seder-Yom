import { useMutation, useQueryClient } from "@tanstack/react-query";
import { googleCalendarKeys } from "../services/queryKeys";
import { disconnectGoogleCalendar } from "../services/googleCalendar.api";

export function useDisconnectGoogleCalendarMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: disconnectGoogleCalendar,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: googleCalendarKeys.status() });
    },
  });
}
