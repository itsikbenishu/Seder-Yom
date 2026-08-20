import { useTranslation } from "react-i18next";
import { Button } from "../../ui";
import { WeekGrid } from "./WeekGrid";
import { useWeekEvents } from "../../../hooks/useWeekEvents";
import { useMuteDayMutation } from "../../../hooks/useMuteDayMutation";
import { buildWeekViewData } from "../../../utils/buildWeekViewData";

function formatWeekRange(start: Date, end: Date, language: string): string {
  const locale = language === "he" ? "he-IL" : "en-US";
  const formatter = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

export interface WeekScreenProps {
  onSelectDay: (dayOfWeek: number) => void;
}

export function WeekScreen({ onSelectDay }: WeekScreenProps) {
  const { t, i18n } = useTranslation();
  const { data: events } = useWeekEvents();
  const muteDayMutation = useMuteDayMutation();

  const weekViewData = buildWeekViewData(events ?? [], new Date());

  return (
    <div className="p-4">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-violet-600 dark:text-violet-400">
            {t("week.kicker")}
          </p>
          <p className="text-2xl font-semibold">
            {formatWeekRange(weekViewData.weekRange.start, weekViewData.weekRange.end, i18n.language)}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" aria-label={t("week.settingsAria")}>
            ⚙️
          </Button>
          <Button variant="ghost" size="icon" aria-label={t("week.archiveAria")}>
            🗄️
          </Button>
        </div>
      </header>
      <WeekGrid
        days={weekViewData.days}
        onSelectDay={onSelectDay}
        onMuteDay={(dayOfWeek) => muteDayMutation.mutate(dayOfWeek)}
        onAddEvent={() => {}}
        onArchiveDay={() => {}}
      />
    </div>
  );
}
