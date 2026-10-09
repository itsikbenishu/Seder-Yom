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
  onSwap,
}: EventListProps) {
  const { t } = useTranslation();
  const { sensors, sortableIds, onDragStart, onDragEnd } = useScheduleDnd(data.timedEvents, onSwap);

  return (
    <>
      {sortableIds.length > 0 && (
        <p className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400">
          {t("day.event.dragHint")}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
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
