import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ArchiveConflictResolution } from "@project/shared";
import type { ConfirmDialogProps } from "../components/ui/ConfirmDialog";
import { ApiError } from "../services/apiClient";
import { useArchiveDayMutation } from "./useArchiveDayMutation";

type ArchiveStep = { kind: "confirm"; dayOfWeek: number } | { kind: "confirmOverwrite"; dayOfWeek: number };

export interface UseArchiveDayFlowResult {
  requestArchiveDay: (dayOfWeek: number) => void;
  /** Props for whichever confirm dialog is currently active, or null when none is open. */
  dialog: ConfirmDialogProps | null;
}

/** Two-step archive-day confirm shared by Week/Day: escalates to a merge/overwrite choice on ARCHIVE_ALREADY_EXISTS. */
export function useArchiveDayFlow(): UseArchiveDayFlowResult {
  const { t } = useTranslation();
  const archiveDayMutation = useArchiveDayMutation();
  const [step, setStep] = useState<ArchiveStep | null>(null);
  const [pendingResolution, setPendingResolution] = useState<ArchiveConflictResolution | null>(null);

  function requestArchiveDay(dayOfWeek: number) {
    setStep({ kind: "confirm", dayOfWeek });
  }

  function runArchive(dayOfWeek: number, onConflict?: ArchiveConflictResolution) {
    setPendingResolution(onConflict ?? null);
    archiveDayMutation.mutate(
      { dayOfWeek, onConflict },
      {
        onSuccess: () => setStep(null),
        onError: (error) => {
          if (!onConflict && error instanceof ApiError && error.code === "ARCHIVE_ALREADY_EXISTS") {
            setStep({ kind: "confirmOverwrite", dayOfWeek });
            return;
          }
          setStep(null);
        },
        onSettled: () => setPendingResolution(null),
      },
    );
  }

  if (!step) {
    return { requestArchiveDay, dialog: null };
  }

  const shared = {
    open: true,
    danger: true,
    cancelLabel: t("common.cancel"),
    onCancel: () => setStep(null),
  };

  const dialog: ConfirmDialogProps =
    step.kind === "confirm"
      ? {
          ...shared,
          confirmPending: archiveDayMutation.isPending,
          title: t("day.confirm.archiveDayTitle"),
          body: t("day.confirm.archiveDayBody"),
          confirmLabel: t("day.confirm.archiveDayConfirm"),
          onConfirm: () => runArchive(step.dayOfWeek),
        }
      : {
          ...shared,
          confirmPending: archiveDayMutation.isPending && pendingResolution === "overwrite",
          title: t("day.confirm.archiveDayOverwriteTitle"),
          body: t("day.confirm.archiveDayOverwriteBody"),
          confirmLabel: t("day.confirm.archiveDayOverwriteConfirm"),
          onConfirm: () => runArchive(step.dayOfWeek, "overwrite"),
          secondaryAction: {
            label: t("day.confirm.archiveDayMergeConfirm"),
            pending: archiveDayMutation.isPending && pendingResolution === "merge",
            onClick: () => runArchive(step.dayOfWeek, "merge"),
          },
        };

  return { requestArchiveDay, dialog };
}
