import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../ui";
import { cn } from "../../../utils/cn";
import type { DayCardProps } from "../../../types/week";

export function DayCard({ day, onSelect, onMuteDay, onAddEvent, onArchiveDay }: DayCardProps) {
  const { t } = useTranslation();
  const dayNames = t("week.dayNames", { returnObjects: true }) as string[];

  function stopPropagationThen(handler: () => void) {
    return (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      handler();
    };
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(day.dayOfWeek)}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onSelect(day.dayOfWeek);
      }}
      className={cn(
        "rounded-xl border p-3.5 text-start transition-colors cursor-pointer",
        day.isToday
          ? "bg-violet-50 dark:bg-violet-500/10 border-violet-300 dark:border-violet-500/40"
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800",
        day.isMuted && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[15px] font-semibold">{dayNames[day.dayOfWeek]}</span>
          <span className="text-sm text-slate-500 dark:text-slate-400">{day.date.day}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {day.isToday && (
            <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
              {t("week.today")}
            </span>
          )}
          {day.isMuted && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-700">
              {t("week.muted")}
            </span>
          )}
        </div>
      </div>
      <div className="mt-2.5">
        {day.nearestEvent ? (
          <p className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-200">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" aria-hidden="true" />
            {day.nearestEvent.start} · {day.nearestEvent.title}
          </p>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("week.noEvents")}</p>
        )}
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            className="whitespace-nowrap"
            onClick={stopPropagationThen(() => onMuteDay(day.dayOfWeek))}
          >
            {day.isMuted ? "🔕" : "🔔"} {t(day.isMuted ? "week.unmuteDayAria" : "week.muteDayAria")}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={stopPropagationThen(() => onArchiveDay(day.dayOfWeek))}
            aria-label={t("week.archiveDayAria")}
          >
            🗄️
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={stopPropagationThen(() => onAddEvent(day.dayOfWeek))}
          aria-label={t("week.addEventAria")}
        >
          +
        </Button>
      </div>
    </div>
  );
}
