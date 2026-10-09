import { useState } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button, ConfirmDialog } from "../../ui";
import { useWeekEvents } from "../../../hooks/useWeekEvents";
import { useGoogleCalendarWeekEvents } from "../../../hooks/useGoogleCalendarWeekEvents";
import { useRequireSession } from "../../../hooks/useRequireSession";
import { useMuteDayMutation } from "../../../hooks/useMuteDayMutation";
import { useUnmuteDayMutation } from "../../../hooks/useUnmuteDayMutation";
import { useMuteEventMutation } from "../../../hooks/useMuteEventMutation";
import { useUpdateEventMutation } from "../../../hooks/useUpdateEventMutation";
import { useDeleteEventMutation } from "../../../hooks/useDeleteEventMutation";
import { useArchiveDayFlow } from "../../../hooks/useArchiveDayFlow";
import { useClearDayMutation } from "../../../hooks/useClearDayMutation";
import { useAllDayReminderDnd } from "../../../hooks/useAllDayReminderDnd";
import { CopyFromArchivePicker } from "../copyFromArchive/CopyFromArchivePicker";
import { buildDayViewData } from "../../../utils/buildDayViewData";
import { isGoogleCalendarEvent } from "../../../types/calendarEvent";
import { EventFormDialog } from "../eventForm";
import type { EventFormMode } from "../../../types/eventForm";
import { AllDayEventDetail } from "./AllDayEventDetail";
import { AllDayEventRow } from "./AllDayEventRow";
import { DayHeader } from "./DayHeader";
import { EventList } from "./EventList";
import { hasAllDayReminder, type DayConfirmTarget, type DayMenuAction, type DayScreenProps } from "../../../types/day";

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

export function DayScreen({ dayOfWeek, onBackToWeek, onNavigateDay, onOpenArchive, onOpenSettings }: DayScreenProps) {
  const { t } = useTranslation();
  const { data: events } = useWeekEvents();
  const { data: googleEvents } = useGoogleCalendarWeekEvents();
  const data = buildDayViewData(events ?? [], dayOfWeek, new Date(), googleEvents ?? []);

  const [expandedEventIds, setExpandedEventIds] = useState<Record<string, boolean>>({});
  const [openAllDayId, setOpenAllDayId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<DayConfirmTarget | null>(null);
  const [formTarget, setFormTarget] = useState<EventFormMode | null>(null);
  const [isCopyFromArchiveOpen, setIsCopyFromArchiveOpen] = useState(false);
  // Tracked locally since muteEventMutation.variables only reflects the single most recent call.
  const [pendingMuteEventIds, setPendingMuteEventIds] = useState<Set<string>>(new Set());
  const requireSession = useRequireSession();

  const muteDayMutation = useMuteDayMutation();
  const unmuteDayMutation = useUnmuteDayMutation();
  const muteEventMutation = useMuteEventMutation();
  const updateEventMutation = useUpdateEventMutation();
  const deleteEventMutation = useDeleteEventMutation();
  const archiveDayFlow = useArchiveDayFlow();
  const clearDayMutation = useClearDayMutation();
  const allDayDnd = useAllDayReminderDnd(data.allDayEvents, handleSwapAllDayReminders);

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
    if (action === "openArchive") return onOpenArchive();
    if (action === "copyFromArchive") return requireSession(() => setIsCopyFromArchiveOpen(true));
    onOpenSettings();
  }

  function handleEditEvent(eventId: string) {
    const event = data.timedEvents.find((item) => item.id === eventId) ?? data.allDayEvents.find((item) => item.id === eventId);
    if (event && !isGoogleCalendarEvent(event)) requireSession(() => setFormTarget({ kind: "edit", event }));
  }

  function handleSwapTimedEvents(
    firstId: string,
    firstStart: string,
    firstEnd: string,
    secondId: string,
    secondStart: string,
    secondEnd: string,
  ) {
    const first = data.timedEvents.find((item) => item.id === firstId);
    const second = data.timedEvents.find((item) => item.id === secondId);
    if (!first || !second || isGoogleCalendarEvent(first) || isGoogleCalendarEvent(second)) return;
    updateEventMutation.mutate({ id: firstId, input: { start: firstStart, end: firstEnd }, files: first.files });
    updateEventMutation.mutate({ id: secondId, input: { start: secondStart, end: secondEnd }, files: second.files });
  }

  function handleSwapAllDayReminders(firstId: string, firstTime: string, secondId: string, secondTime: string) {
    const first = data.allDayEvents.find((item) => item.id === firstId);
    const second = data.allDayEvents.find((item) => item.id === secondId);
    if (!first || !second || isGoogleCalendarEvent(first) || isGoogleCalendarEvent(second)) return;
    updateEventMutation.mutate({ id: firstId, input: { reminderTime: firstTime }, files: first.files });
    updateEventMutation.mutate({ id: secondId, input: { reminderTime: secondTime }, files: second.files });
  }

  function handleConfirm() {
    if (!confirmTarget) return;
    // Captured by reference so a stale success can't clear a newer, unrelated confirm dialog.
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
            className="gap-1.5 border border-dashed border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400"
            onClick={() => requireSession(() => setFormTarget({ kind: "create", dayOfWeek, allDay: true }))}
            aria-label={t("day.addAllDayEventAria")}
          >
            + {t("day.addAllDayEvent")}
          </Button>
        </div>

        <DndContext
          sensors={allDayDnd.sensors}
          collisionDetection={closestCenter}
          onDragStart={allDayDnd.onDragStart}
          onDragEnd={allDayDnd.onDragEnd}
        >
          <SortableContext items={allDayDnd.sortableIds} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {data.allDayEvents.map((event) => (
                <AllDayEventRow
                  key={event.id}
                  id={event.id}
                  title={event.title}
                  isSynced={isGoogleCalendarEvent(event) || event.googleCalendarSynced}
                  isDraggable={hasAllDayReminder(event)}
                  onOpenDetail={() => setOpenAllDayId(event.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <EventList
          data={data}
          expandedEventIds={expandedEventIds}
          onToggleExpand={(eventId) => setExpandedEventIds((prev) => ({ ...prev, [eventId]: !prev[eventId] }))}
          onMuteToggleEvent={(eventId) => {
            const event = data.timedEvents.find((item) => item.id === eventId);
            if (!event || isGoogleCalendarEvent(event)) return;
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
          onSwap={handleSwapTimedEvents}
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

      {isCopyFromArchiveOpen && (
        <CopyFromArchivePicker dayOfWeek={dayOfWeek} onClose={() => setIsCopyFromArchiveOpen(false)} />
      )}
    </div>
  );
}
