import type { UIEvent } from "react";
import { useTranslation } from "react-i18next";
import { Spinner } from "../../ui";
import { ArchiveRow } from "../archive/ArchiveRow";
import type { CopyFromArchiveListProps } from "../../../types/copyFromArchive";

const REACH_END_THRESHOLD_PX = 160;

// Mirrors ArchiveList's scroll-to-fetch idiom, reusing ArchiveRow as-is since its contract already fits.
export function CopyFromArchiveList({ data, onSelect, onReachEnd }: CopyFromArchiveListProps) {
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
    <div className="sy-scroll min-h-0 flex-1 overflow-y-auto" onScroll={handleScroll}>
      {isEmpty ? (
        <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
          {t("archive.emptyState")}
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {data.days.map((day) => (
            <li key={day.id}>
              <ArchiveRow day={day} onSelect={onSelect} />
            </li>
          ))}
        </ul>
      )}

      {data.isLoadingMore && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Spinner />
          <span className="text-sm text-slate-500 dark:text-slate-400">{t("archive.loadingMore")}</span>
        </div>
      )}
    </div>
  );
}
