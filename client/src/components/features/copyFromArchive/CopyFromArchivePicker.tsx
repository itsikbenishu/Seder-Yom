import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog, Modal } from "../../ui";
import { useCopyFromArchiveDays } from "../../../hooks/useCopyFromArchiveDays";
import { useCopyFromArchiveFlow } from "../../../hooks/useCopyFromArchiveFlow";
import { ArchiveListSkeleton } from "../archive/ArchiveListSkeleton";
import { CopyFromArchiveFilters } from "./CopyFromArchiveFilters";
import { CopyFromArchiveList } from "./CopyFromArchiveList";
import type { CopyFromArchivePickerProps } from "../../../types/copyFromArchive";

// Filter state lives here and resets for free on every open, since the parent only mounts this conditionally.
export function CopyFromArchivePicker({ dayOfWeek, onClose }: CopyFromArchivePickerProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const { data, fetchMore } = useCopyFromArchiveDays(search, date);
  const flow = useCopyFromArchiveFlow(dayOfWeek, onClose);

  return (
    <>
      <Modal open onClose={onClose} title={t("day.menu.copyFromArchive")} className="max-w-[460px]">
        <div className="flex h-full min-h-0 flex-col gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("day.copyFromArchive.hint")}</p>
          <CopyFromArchiveFilters search={search} onSearchChange={setSearch} date={date} onDateChange={setDate} />
          {data.isPending ? (
            <ArchiveListSkeleton />
          ) : (
            <CopyFromArchiveList data={data} onSelect={flow.pickDay} onReachEnd={fetchMore} />
          )}
        </div>
      </Modal>

      {flow.dialog && <ConfirmDialog {...flow.dialog} />}
    </>
  );
}
