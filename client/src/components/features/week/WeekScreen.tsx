import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArchiveIcon, Button, ConfirmDialog } from "../../ui";
import { WeekGrid } from "./WeekGrid";
import { WeekGridSkeleton } from "./WeekGridSkeleton";
import { useWeekEvents } from "../../../hooks/useWeekEvents";
import { useGoogleCalendarWeekEvents } from "../../../hooks/useGoogleCalendarWeekEvents";
import { useMuteDayMutation } from "../../../hooks/useMuteDayMutation";
import { useUnmuteDayMutation } from "../../../hooks/useUnmuteDayMutation";
import { useArchiveDayFlow } from "../../../hooks/useArchiveDayFlow";
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
  const { data: events, isPending: isEventsPending } = useWeekEvents();
  const { data: googleEvents } = useGoogleCalendarWeekEvents();
  const muteDayMutation = useMuteDayMutation();
  const unmuteDayMutation = useUnmuteDayMutation();
  const archiveDayFlow = useArchiveDayFlow();
  const requireSession = useRequireSession();
  const [formTarget, setFormTarget] = useState<EventFormMode | null>(null);
  const [pendingMuteDayIds, setPendingMuteDayIds] = useState<Set<number>>(new Set());

  const weekViewData = buildWeekViewData(events ?? [], new Date(), googleEvents ?? []);

  function handleToggleMuteDay(dayOfWeek: number) {
    const day = weekViewData.days.find((item) => item.dayOfWeek === dayOfWeek);
    const mutation = day?.isMuted ? unmuteDayMutation : muteDayMutation;

    setPendingMuteDayIds((current) => new Set(current).add(dayOfWeek));
    mutation.mutate(dayOfWeek, {
      onSettled: () => {
        setPendingMuteDayIds((current) => {
          const next = new Set(current);
          next.delete(dayOfWeek);
          return next;
        });
      },
    });
  }

  function isMutePending(dayOfWeek: number): boolean {
    return pendingMuteDayIds.has(dayOfWeek);
  }

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
      {isEventsPending ? (
        <WeekGridSkeleton />
      ) : (
        <WeekGrid
          days={weekViewData.days}
          onSelectDay={onSelectDay}
          onMuteDay={handleToggleMuteDay}
          onAddEvent={(dayOfWeek) => requireSession(() => setFormTarget({ kind: "create", dayOfWeek, allDay: true }))}
          onArchiveDay={(dayOfWeek) => requireSession(() => archiveDayFlow.requestArchiveDay(dayOfWeek))}
          isMutePending={isMutePending}
        />
      )}

      {formTarget && (
        <EventFormDialog mode={formTarget} onClose={() => setFormTarget(null)} onSaved={() => setFormTarget(null)} />
      )}

      {archiveDayFlow.dialog && <ConfirmDialog {...archiveDayFlow.dialog} />}
    </div>
  );
}
