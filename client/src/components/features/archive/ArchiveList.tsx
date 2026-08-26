import type { UIEvent } from "react";
import { useTranslation } from "react-i18next";
import type { ArchiveListProps } from "../../../types/archive";
import { ArchiveRow } from "./ArchiveRow";

const REACH_END_THRESHOLD_PX = 160;

export function ArchiveList({ data, onSelect, onReachEnd }: ArchiveListProps) {
  const { t } = useTranslation();

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    if (!data.hasMore) return;

    const element = event.currentTarget;
    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    if (distanceFromBottom <= REACH_END_THRESHOLD_PX) {
      onReachEnd();
    }
  }

  const isEmpty = data.days.length === 0 && !data.isLoadingMore;

  return (
    <div className="flex-1 overflow-y-auto" onScroll={handleScroll}>
      {isEmpty ? (
        <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
          {t("archive.emptyState")}
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {data.days.map((day) => (
            <li key={`${day.dayOfWeek}-${day.year}-${day.month}-${day.dayOfMonth}`}>
              <ArchiveRow day={day} onSelect={onSelect} />
            </li>
          ))}
        </ul>
      )}

      {data.isLoadingMore && (
        <div className="flex items-center justify-center gap-2 py-4">
          <div
            className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-violet-600"
            aria-hidden="true"
          />
          <span className="text-sm text-slate-500 dark:text-slate-400">{t("archive.loadingMore")}</span>
        </div>
      )}
    </div>
  );
}
