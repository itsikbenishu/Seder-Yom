import { useState } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { Button, ConfirmDialog } from "../../ui";
import { useWeekEvents } from "../../../hooks/useWeekEvents";
import { useMuteDayMutation } from "../../../hooks/useMuteDayMutation";
import { useUnmuteDayMutation } from "../../../hooks/useUnmuteDayMutation";
import { useMuteEventMutation } from "../../../hooks/useMuteEventMutation";
import { useUpdateEventMutation } from "../../../hooks/useUpdateEventMutation";
import { useDeleteEventMutation } from "../../../hooks/useDeleteEventMutation";
import { useArchiveDayMutation } from "../../../hooks/useArchiveDayMutation";
import { useClearDayMutation } from "../../../hooks/useClearDayMutation";
import { buildDayViewData } from "../../../utils/buildDayViewData";
import { computeRescheduledEnd } from "../../../utils/rescheduleEvent";
import { AllDayEventDetail } from "./AllDayEventDetail";
import { AllDayEventRow } from "./AllDayEventRow";
import { DayHeader } from "./DayHeader";
import { EventList } from "./EventList";
import type { DayConfirmTarget, DayMenuAction, DayScreenProps } from "../../../types/day";

function getConfirmDialogContent(target: DayConfirmTarget, t: TFunction) {
  if (target.kind === "archiveDay") {
    return {
      title: t("day.confirm.archiveDayTitle"),
      body: t("day.confirm.archiveDayBody"),
      confirmLabel: t("day.confirm.archiveDayConfirm"),
    };
  }
  if (target.kind === "clearDay") {
    return {
      title: t("day.confirm.clearDayTitle"),
      body: t("day.confirm.clearDayBody"),
      confirmLabel: t("day.confirm.clearDayConfirm"),
    };
  }
  return {
    title: t("day.confirm.deleteEventTitle"),
    body: t("day.confirm.deleteEventBody"),
    confirmLabel: t("day.confirm.deleteEventConfirm"),
  };
}

export function DayScreen({
  dayOfWeek,
  onBackToWeek,
  onNavigateDay,
  onOpenArchive,
  onAddEvent,
  onEditEvent,
}: DayScreenProps) {
  const { t } = useTranslation();
  const { data: events } = useWeekEvents();
  const data = buildDayViewData(events ?? [], dayOfWeek);

  const [expandedEventIds, setExpandedEventIds] = useState<Record<string, boolean>>({});
  const [openAllDayId, setOpenAllDayId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<DayConfirmTarget | null>(null);

  const muteDayMutation = useMuteDayMutation();
  const unmuteDayMutation = useUnmuteDayMutation();
  const muteEventMutation = useMuteEventMutation();
  const updateEventMutation = useUpdateEventMutation();
  const deleteEventMutation = useDeleteEventMutation();
  const archiveDayMutation = useArchiveDayMutation();
  const clearDayMutation = useClearDayMutation();

  function handleToggleMuteDay() {
    if (data.isMuted) {
      unmuteDayMutation.mutate(dayOfWeek);
      return;
    }
    muteDayMutation.mutate(dayOfWeek);
  }

  function handleMenuAction(action: DayMenuAction) {
    if (action === "toggleMute") return handleToggleMuteDay();
    if (action === "archiveDay") return setConfirmTarget({ kind: "archiveDay" });
    if (action === "clearDay") return setConfirmTarget({ kind: "clearDay" });
    onOpenArchive();
  }

  function handleReorder(eventId: string, newStart: string) {
    const event = data.timedEvents.find((item) => item.id === eventId);
    if (!event) return;
    const newEnd = computeRescheduledEnd(event.start, event.end, newStart);
    updateEventMutation.mutate({ id: eventId, input: { start: newStart, end: newEnd } });
  }

  function handleConfirm() {
    if (!confirmTarget) return;
    if (confirmTarget.kind === "archiveDay") archiveDayMutation.mutate(dayOfWeek);
    if (confirmTarget.kind === "clearDay") clearDayMutation.mutate(dayOfWeek);
    if (confirmTarget.kind === "deleteEvent") deleteEventMutation.mutate(confirmTarget.eventId);
    setConfirmTarget(null);
  }

  const openAllDayEvent = data.allDayEvents.find((event) => event.id === openAllDayId) ?? null;
  const isEmpty = data.timedEvents.length === 0 && data.allDayEvents.length === 0;

  return (
    <div>
      <DayHeader
        dayOfWeek={dayOfWeek}
        date={data.date}
        isMuted={data.isMuted}
        onBackToWeek={onBackToWeek}
        onPrevDay={() => onNavigateDay((dayOfWeek + 6) % 7)}
        onNextDay={() => onNavigateDay((dayOfWeek + 1) % 7)}
        onMenuAction={handleMenuAction}
      />

      <div className="flex flex-col gap-2 p-4">
        {isEmpty && <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">{t("week.noEvents")}</p>}

        {data.allDayEvents.map((event) => (
          <AllDayEventRow key={event.id} event={event} onOpenDetail={setOpenAllDayId} />
        ))}

        <EventList
          data={data}
          expandedEventIds={expandedEventIds}
          onToggleExpand={(eventId) => setExpandedEventIds((prev) => ({ ...prev, [eventId]: !prev[eventId] }))}
          onMuteToggleEvent={(eventId) => {
            const event = data.timedEvents.find((item) => item.id === eventId);
            if (event) muteEventMutation.mutate({ id: eventId, muted: !event.mutedUntilArchive });
          }}
          onEditEvent={onEditEvent}
          onDeleteEvent={(eventId) => setConfirmTarget({ kind: "deleteEvent", eventId })}
          onOpenAllDayDetail={setOpenAllDayId}
          onReorder={handleReorder}
        />
      </div>

      <div className="p-4">
        <Button variant="primary" className="w-full" onClick={() => onAddEvent(dayOfWeek)}>
          {t("day.addEvent")}
        </Button>
      </div>

      {openAllDayEvent && (
        <AllDayEventDetail
          event={openAllDayEvent}
          onClose={() => setOpenAllDayId(null)}
          onEdit={onEditEvent}
          onDelete={(eventId) => setConfirmTarget({ kind: "deleteEvent", eventId })}
        />
      )}

      <ConfirmDialog
        open={confirmTarget !== null}
        cancelLabel={t("common.cancel")}
        danger
        onConfirm={handleConfirm}
        onCancel={() => setConfirmTarget(null)}
        {...(confirmTarget
          ? getConfirmDialogContent(confirmTarget, t)
          : { title: "", body: "", confirmLabel: "" })}
      />
    </div>
  );
}
