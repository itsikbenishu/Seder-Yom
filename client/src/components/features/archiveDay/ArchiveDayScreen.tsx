import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useArchiveDayGoogleEvents } from "../../../hooks/useArchiveDayGoogleEvents";
import { useDeleteArchivedDayMutation } from "../../../hooks/useDeleteArchivedDayMutation";
import { buildArchiveDayViewData } from "../../../utils/buildArchiveDayViewData";
import { isGoogleCalendarEvent, type ArchiveDayAllDayEvent, type ArchiveDayScreenProps } from "../../../types/archiveDay";
import { ConfirmDialog } from "../../ui";
import { AllDayEventRow } from "../day";
import { ArchiveDayAllDayEventDetail } from "./ArchiveDayAllDayEventDetail";
import { ArchiveDayEventList } from "./ArchiveDayEventList";
import { ArchiveDayHeader } from "./ArchiveDayHeader";

export function ArchiveDayScreen({ day, onBackToArchive }: ArchiveDayScreenProps) {
  const { t } = useTranslation();
  const { data: googleEvents } = useArchiveDayGoogleEvents(day);
  const data = buildArchiveDayViewData(day, googleEvents ?? []);
  const deleteArchivedDayMutation = useDeleteArchivedDayMutation();

  const [expandedEventIds, setExpandedEventIds] = useState<Record<string, boolean>>({});
  const [openAllDayId, setOpenAllDayId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const openAllDayEvent: ArchiveDayAllDayEvent | null =
    data.allDayEvents.find((event) => event.id === openAllDayId) ?? null;

  function handleConfirmDelete() {
    deleteArchivedDayMutation.mutate(day.id, { onSuccess: onBackToArchive });
  }

  return (
    <div className="flex h-svh flex-col">
      <ArchiveDayHeader day={day} onBackToArchive={onBackToArchive} onDelete={() => setConfirmDelete(true)} />

      <div className="sy-scroll flex flex-1 flex-col gap-2 overflow-y-auto p-4">
        {data.allDayEvents.map((event) => (
          <AllDayEventRow
            key={event.id}
            title={event.title}
            isSynced={isGoogleCalendarEvent(event) || event.googleCalendarSynced}
            onOpenDetail={() => setOpenAllDayId(event.id)}
          />
        ))}

        <ArchiveDayEventList
          data={data}
          expandedEventIds={expandedEventIds}
          onToggleExpand={(eventId) => setExpandedEventIds((prev) => ({ ...prev, [eventId]: !prev[eventId] }))}
        />
      </div>

      {openAllDayEvent && (
        <ArchiveDayAllDayEventDetail event={openAllDayEvent} onClose={() => setOpenAllDayId(null)} />
      )}

      <ConfirmDialog
        open={confirmDelete}
        title={t("archiveDay.confirm.deleteDayTitle")}
        body={t("archiveDay.confirm.deleteDayBody")}
        confirmLabel={t("archiveDay.confirm.deleteDayConfirm")}
        cancelLabel={t("common.cancel")}
        danger
        confirmPending={deleteArchivedDayMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
