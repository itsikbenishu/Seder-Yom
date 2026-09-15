import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ArchiveConflictResolution } from "@project/shared";
import { archiveKeys, eventKeys } from "../services/queryKeys";
import { archiveDay } from "../services/events.api";

export interface ArchiveDayArgs {
  dayOfWeek: number;
  /** Resolves an existing archive for this calendar date (ARCHIVE_ALREADY_EXISTS) - omit to let it conflict. */
  onConflict?: ArchiveConflictResolution;
}

// Archiving is a transactional server-side copy-then-delete, so the
// resulting client state can't be guessed optimistically - just refetch on success.
export function useArchiveDayMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ArchiveDayArgs>({
    mutationFn: ({ dayOfWeek, onConflict }) => archiveDay(dayOfWeek, onConflict),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: eventKeys.week() });
      void queryClient.invalidateQueries({ queryKey: archiveKeys.all });
    },
  });
}
