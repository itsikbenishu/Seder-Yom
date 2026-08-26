import { useState } from "react";
import { useArchiveDayGoogleEvents } from "../../../hooks/useArchiveDayGoogleEvents";
import { buildArchiveDayViewData } from "../../../utils/buildArchiveDayViewData";
import { isGoogleCalendarEvent, type ArchiveDayAllDayEvent, type ArchiveDayScreenProps } from "../../../types/archiveDay";
import { AllDayEventRow } from "../day";
import { ArchiveDayAllDayEventDetail } from "./ArchiveDayAllDayEventDetail";
import { ArchiveDayEventList } from "./ArchiveDayEventList";
import { ArchiveDayHeader } from "./ArchiveDayHeader";

export function ArchiveDayScreen({ day, onBackToArchive }: ArchiveDayScreenProps) {
  const { data: googleEvents } = useArchiveDayGoogleEvents(day);
  const data = buildArchiveDayViewData(day, googleEvents ?? []);

  const [expandedEventIds, setExpandedEventIds] = useState<Record<string, boolean>>({});
  const [openAllDayId, setOpenAllDayId] = useState<string | null>(null);

  const openAllDayEvent: ArchiveDayAllDayEvent | null =
    data.allDayEvents.find((event) => event.id === openAllDayId) ?? null;

  return (
    <div className="flex h-svh flex-col">
      <ArchiveDayHeader day={day} onBackToArchive={onBackToArchive} />

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
    </div>
  );
}
