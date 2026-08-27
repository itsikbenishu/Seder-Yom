import { useTranslation } from "react-i18next";
import { Button, DropdownMenu, type DropdownMenuItem } from "../../ui";
import type { DayDate, DayHeaderProps, DayMenuAction } from "../../../types/day";

function formatDayDate(date: DayDate, dayName: string, language: string): string {
  const locale = language === "he" ? "he-IL" : "en-US";
  const formatter = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long" });
  return `${dayName}, ${formatter.format(new Date(date.yr, date.month, date.day))}`;
}

function GridIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function DayHeader({
  dayOfWeek,
  date,
  isMuted,
  onBackToWeek,
  onPrevDay,
  onNextDay,
  onMenuAction,
}: DayHeaderProps) {
  const { t, i18n } = useTranslation();
  const dayNames = t("week.dayNames", { returnObjects: true }) as string[];

  const menuItems: DropdownMenuItem<DayMenuAction>[] = [
    {
      value: "toggleMute",
      label: `${isMuted ? "🔕" : "🔔"} ${t(isMuted ? "day.menu.unmute" : "day.menu.mute")}`,
    },
    { value: "openArchive", label: `🗄️ ${t("day.menu.openArchive")}` },
    { value: "archiveDay", label: `🗄️ ${t("day.menu.archiveDay")}` },
    { value: "clearDay", label: `🗑️ ${t("day.menu.clearDay")}`, danger: true },
  ];

  return (
    <header className="flex items-center justify-between gap-1.5 p-4">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onBackToWeek} aria-label={t("day.header.backAria")}>
          <GridIcon />
        </Button>
        <Button variant="ghost" size="icon" className="text-2xl" onClick={onPrevDay} aria-label={t("day.header.prevDayAria")}>
          &lt;
        </Button>
      </div>

      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-violet-600 dark:text-violet-400">
          {dayNames[dayOfWeek]}
        </p>
        <p className="text-xl font-semibold">{formatDayDate(date, dayNames[dayOfWeek], i18n.language)}</p>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="text-2xl" onClick={onNextDay} aria-label={t("day.header.nextDayAria")}>
          &gt;
        </Button>
        <DropdownMenu<DayMenuAction>
          items={menuItems}
          onSelect={onMenuAction}
          align="end"
          aria-label={t("day.header.menuAria")}
          trigger={
            <Button variant="ghost" size="icon" aria-label={t("day.header.menuAria")}>
              ⋯
            </Button>
          }
        />
      </div>
    </header>
  );
}
