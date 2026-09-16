import { useState } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { Button, ConfirmDialog } from "../../ui";
import { useWeekEvents } from "../../../hooks/useWeekEvents";
import { useRequireSession } from "../../../hooks/useRequireSession";
import { useMuteDayMutation } from "../../../hooks/useMuteDayMutation";
import { useUnmuteDayMutation } from "../../../hooks/useUnmuteDayMutation";
import { useMuteEventMutation } from "../../../hooks/useMuteEventMutation";
import { useUpdateEventMutation } from "../../../hooks/useUpdateEventMutation";
import { useDeleteEventMutation } from "../../../hooks/useDeleteEventMutation";
import { useArchiveDayFlow } from "../../../hooks/useArchiveDayFlow";
import { useClearDayMutation } from "../../../hooks/useClearDayMutation";
import { buildDayViewData } from "../../../utils/buildDayViewData";
import { computeRescheduledEnd } from "../../../utils/rescheduleEvent";
import { EventFormDialog } from "../eventForm";
import type { EventFormMode } from "../../../types/eventForm";
import { AllDayEventDetail } from "./AllDayEventDetail";
import { AllDayEventRow } from "./AllDayEventRow";
import { DayHeader } from "./DayHeader";
import { EventList } from "./EventList";
import type { DayConfirmTarget, DayMenuAction, DayScreenProps } from "../../../types/day";

function getConfirmDialogContent(target: DayConfirmTarget, t: TFunction) {
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

export function DayScreen({ dayOfWeek, onBackToWeek, onNavigateDay, onOpenArchive }: DayScreenProps) {
  const { t } = useTranslation();
  const { data: events } = useWeekEvents();
  const data = buildDayViewData(events ?? [], dayOfWeek);

  const [expandedEventIds, setExpandedEventIds] = useState<Record<string, boolean>>({});
  const [openAllDayId, setOpenAllDayId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<DayConfirmTarget | null>(null);
  const [formTarget, setFormTarget] = useState<EventFormMode | null>(null);
  // Tracked locally rather than read off muteEventMutation.variables - a shared mutation's
  // .variables only reflects the single most recent call, which misreports pending state
  // if the user toggles mute on more than one event before the first request settles.
  const [pendingMuteEventIds, setPendingMuteEventIds] = useState<Set<string>>(new Set());
  const requireSession = useRequireSession();

  const muteDayMutation = useMuteDayMutation();
  const unmuteDayMutation = useUnmuteDayMutation();
  const muteEventMutation = useMuteEventMutation();
  const updateEventMutation = useUpdateEventMutation();
  const deleteEventMutation = useDeleteEventMutation();
  const archiveDayFlow = useArchiveDayFlow();
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
    if (action === "archiveDay") return requireSession(() => archiveDayFlow.requestArchiveDay(dayOfWeek));
    if (action === "clearDay") return requireSession(() => setConfirmTarget({ kind: "clearDay" }));
    onOpenArchive();
  }

  function handleEditEvent(eventId: string) {
    const event = data.timedEvents.find((item) => item.id === eventId) ?? data.allDayEvents.find((item) => item.id === eventId);
    if (event) requireSession(() => setFormTarget({ kind: "edit", event }));
  }

  function handleReorder(eventId: string, newStart: string) {
    const event = data.timedEvents.find((item) => item.id === eventId);
    if (!event) return;
    const newEnd = computeRescheduledEnd(event.start, event.end, newStart);
    updateEventMutation.mutate({ id: eventId, input: { start: newStart, end: newEnd }, files: event.files });
  }

  function handleConfirm() {
    if (!confirmTarget) return;
    // Captured by reference so a stale success (from a target the user already dismissed
    // and replaced) can't clear a newer, unrelated confirm dialog.
    const target = confirmTarget;
    const close = () => setConfirmTarget((current) => (current === target ? null : current));
    if (target.kind === "clearDay") clearDayMutation.mutate(dayOfWeek, { onSuccess: close });
    if (target.kind === "deleteEvent") deleteEventMutation.mutate(target.eventId, { onSuccess: close });
  }

  const pendingByKind: Record<DayConfirmTarget["kind"], boolean> = {
    clearDay: clearDayMutation.isPending,
    deleteEvent: deleteEventMutation.isPending,
  };
  const confirmPending = confirmTarget ? pendingByKind[confirmTarget.kind] : false;

  const openAllDayEvent = data.allDayEvents.find((event) => event.id === openAllDayId) ?? null;
  const isEmpty = data.timedEvents.length === 0 && data.allDayEvents.length === 0;

  return (
    <div className="flex h-svh flex-col">
      <DayHeader
        dayOfWeek={dayOfWeek}
        date={data.date}
        isMuted={data.isMuted}
        onBackToWeek={onBackToWeek}
        onPrevDay={() => onNavigateDay((dayOfWeek + 6) % 7)}
        onNextDay={() => onNavigateDay((dayOfWeek + 1) % 7)}
        onMenuAction={handleMenuAction}
      />

      <div className="sy-scroll flex flex-1 flex-col gap-2 overflow-y-auto p-4">
        {isEmpty && <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">{t("week.noEvents")}</p>}

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => requireSession(() => setFormTarget({ kind: "create", dayOfWeek, allDay: true }))}
            aria-label={t("day.addAllDayEventAria")}
          >
            +
          </Button>
        </div>

        {data.allDayEvents.map((event) => (
          <AllDayEventRow
            key={event.id}
            title={event.title}
            isSynced={event.googleCalendarSynced}
            onOpenDetail={() => setOpenAllDayId(event.id)}
          />
        ))}

        <EventList
          data={data}
          expandedEventIds={expandedEventIds}
          onToggleExpand={(eventId) => setExpandedEventIds((prev) => ({ ...prev, [eventId]: !prev[eventId] }))}
          onMuteToggleEvent={(eventId) => {
            const event = data.timedEvents.find((item) => item.id === eventId);
            if (!event) return;
            setPendingMuteEventIds((current) => new Set(current).add(eventId));
            muteEventMutation.mutate(
              { id: eventId, muted: !event.mutedUntilArchive },
              {
                onSettled: () => {
                  setPendingMuteEventIds((current) => {
                    const next = new Set(current);
                    next.delete(eventId);
                    return next;
                  });
                },
              },
            );
          }}
          isMuteTogglePending={(eventId) => pendingMuteEventIds.has(eventId)}
          onEditEvent={handleEditEvent}
          onDeleteEvent={(eventId) => requireSession(() => setConfirmTarget({ kind: "deleteEvent", eventId }))}
          onReorder={handleReorder}
        />
      </div>

      <div className="p-4">
        <Button
          variant="primary"
          className="w-full"
          onClick={() => requireSession(() => setFormTarget({ kind: "create", dayOfWeek, allDay: false }))}
        >
          {t("day.addEvent")}
        </Button>
      </div>

      {openAllDayEvent && (
        <AllDayEventDetail
          event={openAllDayEvent}
          onClose={() => setOpenAllDayId(null)}
          onEdit={handleEditEvent}
          onDelete={(eventId) => requireSession(() => setConfirmTarget({ kind: "deleteEvent", eventId }))}
        />
      )}

      {formTarget && (
        <EventFormDialog mode={formTarget} onClose={() => setFormTarget(null)} onSaved={() => setFormTarget(null)} />
      )}

      <ConfirmDialog
        open={confirmTarget !== null}
        cancelLabel={t("common.cancel")}
        danger
        confirmPending={confirmPending}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmTarget(null)}
        {...(confirmTarget
          ? getConfirmDialogContent(confirmTarget, t)
          : { title: "", body: "", confirmLabel: "" })}
      />

      {archiveDayFlow.dialog && <ConfirmDialog {...archiveDayFlow.dialog} />}
    </div>
  );
}
