import { useTranslation } from "react-i18next";
import { Button, GoogleSyncedBadge } from "../../ui";
import { cn } from "../../../utils/cn";
import type { AllDayEventRowProps } from "../../../types/day";

export function AllDayEventRow({ title, isSynced, onOpenDetail }: AllDayEventRowProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2",
        "dark:border-slate-800 dark:bg-slate-900",
      )}
    >
      <span className="shrink-0 text-base" aria-hidden="true">
        📅
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
        {title}
      </span>
      {isSynced && <GoogleSyncedBadge />}
      <Button variant="ghost" size="icon" className="shrink-0" onClick={onOpenDetail} aria-label={t("day.allDay.infoAria")}>
        ⓘ
      </Button>
    </div>
  );
}
