import { useTranslation } from "react-i18next";
import { Button, DropdownMenu, type DropdownMenuItem } from "../../ui";
import type { DayDate, DayHeaderProps, DayMenuAction } from "../../../types/day";

function formatDayDate(date: DayDate): string {
  return `${date.day}.${date.month + 1}`;
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
  const chevronStyle = i18n.dir() === "rtl" ? { transform: "scaleX(-1)" } : undefined;

  const menuItems: DropdownMenuItem<DayMenuAction>[] = [
    {
      value: "toggleMute",
      label: `${isMuted ? "🔕" : "🔔"} ${t(isMuted ? "day.menu.unmute" : "day.menu.mute")}`,
    },
    { value: "archiveDay", label: t("day.menu.archiveDay") },
    { value: "clearDay", label: t("day.menu.clearDay"), danger: true },
    { value: "openArchive", label: t("day.menu.openArchive") },
  ];

  return (
    <header className="flex items-center justify-between gap-1.5 p-4">
      <Button variant="ghost" size="icon" onClick={onBackToWeek} aria-label={t("day.header.backAria")}>
        🗓️
      </Button>
      <div className="flex flex-1 items-center justify-center gap-1">
        <Button variant="ghost" size="icon" onClick={onPrevDay} aria-label={t("day.header.prevDayAria")}>
          <span style={chevronStyle}>‹</span>
        </Button>
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-violet-600 dark:text-violet-400">
            {dayNames[dayOfWeek]}
          </p>
          <p className="text-xl font-semibold">{formatDayDate(date)}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onNextDay} aria-label={t("day.header.nextDayAria")}>
          <span style={chevronStyle}>›</span>
        </Button>
      </div>
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
    </header>
  );
}
