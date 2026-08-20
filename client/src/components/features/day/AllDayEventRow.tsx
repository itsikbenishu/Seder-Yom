import { useTranslation } from "react-i18next";
import { Button } from "../../ui";
import { cn } from "../../../utils/cn";
import type { AllDayEventRowProps } from "../../../types/day";

export function AllDayEventRow({ event, onOpenDetail }: AllDayEventRowProps) {
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
        {event.title}
      </span>
      {event.googleCalendarSynced && (
        <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
          {t("day.allDay.googleSynced")}
        </span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0"
        onClick={() => onOpenDetail(event.id)}
        aria-label={t("day.allDay.infoAria")}
      >
        ⓘ
      </Button>
    </div>
  );
}
