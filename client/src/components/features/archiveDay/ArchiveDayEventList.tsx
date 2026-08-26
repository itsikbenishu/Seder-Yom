import type { ArchiveDayEventListProps } from "../../../types/archiveDay";
import { ArchiveDayEventRow } from "./ArchiveDayEventRow";

export function ArchiveDayEventList({ data, expandedEventIds, onToggleExpand }: ArchiveDayEventListProps) {
  return (
    <div className="flex flex-col gap-2">
      {data.timedEvents.map((event) => (
        <ArchiveDayEventRow
          key={event.id}
          event={event}
          isExpanded={Boolean(expandedEventIds[event.id])}
          onToggleExpand={onToggleExpand}
        />
      ))}
    </div>
  );
}
