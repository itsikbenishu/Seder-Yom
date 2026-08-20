import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eventKeys } from "../services/queryKeys";
import { archiveDay } from "../services/events.api";

// Archiving is a transactional server-side copy-then-delete, so the
// resulting client state can't be guessed optimistically — just refetch on success.
export function useArchiveDayMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: archiveDay,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: eventKeys.week() });
    },
  });
}
