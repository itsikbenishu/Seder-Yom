import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArchiveIcon, Button } from "../../ui";
import { WeekGrid } from "./WeekGrid";
import { useWeekEvents } from "../../../hooks/useWeekEvents";
import { useMuteDayMutation } from "../../../hooks/useMuteDayMutation";
import { useRequireSession } from "../../../hooks/useRequireSession";
import { buildWeekViewData } from "../../../utils/buildWeekViewData";
import { EventFormDialog } from "../eventForm";
import type { EventFormMode } from "../../../types/eventForm";

function formatWeekRange(start: Date, end: Date, language: string): string {
  const locale = language === "he" ? "he-IL" : "en-US";
  const formatter = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

export interface WeekScreenProps {
  onSelectDay: (dayOfWeek: number) => void;
  onOpenArchive: () => void;
  onOpenSettings: () => void;
}

export function WeekScreen({ onSelectDay, onOpenArchive, onOpenSettings }: WeekScreenProps) {
  const { t, i18n } = useTranslation();
  const { data: events } = useWeekEvents();
  const muteDayMutation = useMuteDayMutation();
  const requireSession = useRequireSession();
  const [formTarget, setFormTarget] = useState<EventFormMode | null>(null);

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
          <Button variant="ghost" size="icon" onClick={onOpenSettings} aria-label={t("week.settingsAria")}>
            ⚙️
          </Button>
          <Button variant="ghost" size="icon" onClick={onOpenArchive} aria-label={t("week.archiveAria")}>
            <ArchiveIcon className="h-5 w-5" />
          </Button>
        </div>
      </header>
      <WeekGrid
        days={weekViewData.days}
        onSelectDay={onSelectDay}
        onMuteDay={(dayOfWeek) => muteDayMutation.mutate(dayOfWeek)}
        onAddEvent={(dayOfWeek) => requireSession(() => setFormTarget({ kind: "create", dayOfWeek, allDay: false }))}
        onArchiveDay={() => {}}
      />

      {formTarget && (
        <EventFormDialog mode={formTarget} onClose={() => setFormTarget(null)} onSaved={() => setFormTarget(null)} />
      )}
    </div>
  );
}
