import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useTranslation } from "react-i18next";
import { useScheduleDnd } from "../../../hooks/useScheduleDnd";
import { isGoogleCalendarEvent } from "../../../types/calendarEvent";
import type { EventListProps } from "../../../types/day";
import { EventRow } from "./EventRow";

export function EventList({
  data,
  expandedEventIds,
  onToggleExpand,
  onMuteToggleEvent,
  isMuteTogglePending,
  onEditEvent,
  onDeleteEvent,
  onReorder,
}: EventListProps) {
  const { t } = useTranslation();
  const { sensors, sortableIds, onDragStart, onDragEnd } = useScheduleDnd(data.timedEvents, onReorder);

  return (
    <>
      {sortableIds.length > 0 && (
        <p className="flex items-center justify-end gap-1 text-xs text-violet-600 dark:text-violet-400">
          {t("day.event.dragHint")}
          <span aria-hidden="true">⌃</span>
        </p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {data.timedEvents.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                isNextUp={event.id === data.nextUpEventId}
                isExpanded={Boolean(expandedEventIds[event.id])}
                isDraggable={!isGoogleCalendarEvent(event) && !event.googleCalendarSynced}
                onToggleExpand={onToggleExpand}
                onMuteToggle={onMuteToggleEvent}
                isMuteTogglePending={isMuteTogglePending(event.id)}
                onEdit={onEditEvent}
                onDelete={onDeleteEvent}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}
