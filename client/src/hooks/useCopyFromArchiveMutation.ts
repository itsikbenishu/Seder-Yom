import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { eventKeys } from "../services/queryKeys";
import { copyArchivedDayToDay } from "../services/archive.api";
import { useToast } from "./useToast";

export interface CopyFromArchiveArgs {
  archivedDayId: string;
  dayOfWeek: number;
}

// Server-side delete-then-insert - not optimistically guessable, so just invalidate on success.
export function useCopyFromArchiveMutation() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<void, Error, CopyFromArchiveArgs>({
    mutationFn: ({ archivedDayId, dayOfWeek }) => copyArchivedDayToDay(archivedDayId, dayOfWeek),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: eventKeys.week() });
      showToast(t("day.copyFromArchive.successToast"), "success");
    },
    onError: () => showToast(t("day.copyFromArchive.errorToast"), "error"),
  });
}
