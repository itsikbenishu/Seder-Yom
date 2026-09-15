import { useTranslation } from "react-i18next";
import { Button } from "../../ui";
import type { ArchiveDayHeaderProps } from "../../../types/archiveDay";

function formatArchiveDayDate(year: number, month: number, dayOfMonth: number, dayName: string, language: string): string {
  const locale = language === "he" ? "he-IL" : "en-US";
  const formatter = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" });
  return `${dayName}, ${formatter.format(new Date(year, month, dayOfMonth))}`;
}

export function ArchiveDayHeader({ day, onBackToArchive, onDelete }: ArchiveDayHeaderProps) {
  const { t, i18n } = useTranslation();
  const dayNames = t("week.dayNames", { returnObjects: true }) as string[];

  return (
    <header className="flex items-center gap-1.5 p-4">
      <Button variant="ghost" size="icon" className="text-xl" onClick={onBackToArchive} aria-label={t("archiveDay.backAria")}>
        &lt;
      </Button>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-violet-600 dark:text-violet-400">
          {dayNames[day.dayOfWeek]}
        </p>
        <p className="truncate text-xl font-semibold">
          {formatArchiveDayDate(day.year, day.month, day.dayOfMonth, dayNames[day.dayOfWeek], i18n.language)}
        </p>
      </div>

      <span className="shrink-0 rounded-full border border-slate-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:border-slate-700 dark:text-slate-400">
        {t("archiveDay.archivedTag")}
      </span>

      <Button variant="ghost" size="icon" onClick={onDelete} aria-label={t("archiveDay.deleteAria")}>
        🗑️
      </Button>
    </header>
  );
}
