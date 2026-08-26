import { useTranslation } from "react-i18next";
import type { ArchivedDay } from "@project/shared";
import { cn } from "../../../utils/cn";
import type { ArchiveRowProps } from "../../../types/archive";

function formatArchiveDate(day: ArchivedDay, language: string): string {
  const locale = language === "he" ? "he-IL" : "en-US";
  const formatter = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" });
  return formatter.format(new Date(day.year, day.month, day.dayOfMonth));
}

export function ArchiveRow({ day, onSelect }: ArchiveRowProps) {
  const { t, i18n } = useTranslation();
  const dayNames = t("week.dayNames", { returnObjects: true }) as string[];

  return (
    <button
      type="button"
      onClick={() => onSelect(day)}
      className={cn(
        "flex w-full items-start justify-between gap-3 rounded-lg px-4 py-3 text-start transition-colors",
        "hover:bg-slate-100 dark:hover:bg-slate-800",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-violet-600 dark:text-violet-400">
          {dayNames[day.dayOfWeek]}
        </p>
        <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
          {formatArchiveDate(day, i18n.language)}
        </p>
        <p className="mt-0.5 truncate text-sm text-slate-600 dark:text-slate-400">{day.summary}</p>
      </div>
      <span className="shrink-0 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
        {t("archive.countLabel", { count: day.count })}
      </span>
    </button>
  );
}
