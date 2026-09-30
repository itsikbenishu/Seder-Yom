import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ArchivedDay } from "@project/shared";
import type { ConfirmDialogProps } from "../components/ui/ConfirmDialog";
import { useCopyFromArchiveMutation } from "./useCopyFromArchiveMutation";

export interface UseCopyFromArchiveFlowResult {
  pickDay: (day: ArchivedDay) => void;
  /** Props for the danger-confirm dialog, or null while no day is picked. */
  dialog: ConfirmDialogProps | null;
}

/** Pick-a-day -> danger-confirm -> mutate flow for the copy-from-archive picker. */
export function useCopyFromArchiveFlow(dayOfWeek: number, onCopied: () => void): UseCopyFromArchiveFlowResult {
  const { t } = useTranslation();
  const copyMutation = useCopyFromArchiveMutation();
  const [pickedDay, setPickedDay] = useState<ArchivedDay | null>(null);

  function pickDay(day: ArchivedDay) {
    setPickedDay(day);
  }

  function handleConfirm() {
    if (!pickedDay) return;
    copyMutation.mutate(
      { archivedDayId: pickedDay.id, dayOfWeek },
      { onSuccess: () => { setPickedDay(null); onCopied(); } },
    );
  }

  if (!pickedDay) {
    return { pickDay, dialog: null };
  }

  return {
    pickDay,
    dialog: {
      open: true,
      danger: true,
      confirmPending: copyMutation.isPending,
      title: t("day.confirm.copyFromArchiveTitle"),
      body: t("day.confirm.copyFromArchiveBody"),
      confirmLabel: t("day.confirm.copyFromArchiveConfirm"),
      cancelLabel: t("common.cancel"),
      onConfirm: handleConfirm,
      onCancel: () => setPickedDay(null),
    },
  };
}
