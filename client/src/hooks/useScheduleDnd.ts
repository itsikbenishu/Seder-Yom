import { useState } from "react";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type SensorDescriptor,
  type SensorOptions,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { TimedCalendarEvent } from "../types/calendarEvent";

/** Fixed increment (minutes) new start times snap to when there's no exact neighbor to align with. */
const SNAP_MINUTES = 15;

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function toTimeString(totalMinutes: number): string {
  const clamped = Math.min(23 * 60 + 59, Math.max(0, totalMinutes));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function snapToIncrement(minutes: number): number {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

/**
 * Derives a sensible new `start` time for the event that landed at `movedIndex` within
 * `orderedEvents` (already reordered via arrayMove): fits it between its new neighbors'
 * end/start, or snaps by a fixed increment off the single neighbor at a list edge.
 */
function computeNewStart(orderedEvents: TimedCalendarEvent[], movedIndex: number): string {
  const moved = orderedEvents[movedIndex];
  const prev = orderedEvents[movedIndex - 1];
  const next = orderedEvents[movedIndex + 1];

  if (!prev && !next) return moved.start;
  if (!prev) return toTimeString(snapToIncrement(Math.max(0, toMinutes(next.start) - SNAP_MINUTES)));
  if (!next) return toTimeString(snapToIncrement(toMinutes(prev.end) + SNAP_MINUTES));

  const prevEnd = toMinutes(prev.end);
  const nextStart = toMinutes(next.start);
  const midpoint = snapToIncrement((prevEnd + nextStart) / 2);
  return toTimeString(Math.min(Math.max(midpoint, prevEnd), nextStart));
}

export interface UseScheduleDndResult {
  sensors: SensorDescriptor<SensorOptions>[];
  /** id of the event currently being dragged, if any. */
  activeId: string | null;
  /** ids of the draggable (local, non-gcal) events, in current order - feed to SortableContext. */
  sortableIds: string[];
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

/**
 * Encapsulates all @dnd-kit state and reordering math for the Day timed-event list.
 * Dropping a local event onto another row's position reassigns it a new `start` that fits
 * between its new neighbors (or snaps by SNAP_MINUTES off the single neighbor at an edge),
 * preserving the caller's job of shifting `end` by the same delta to keep duration constant.
 */
export function useScheduleDnd(
  events: TimedCalendarEvent[],
  onReorder: (eventId: string, newStart: string) => void,
): UseScheduleDndResult {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Google-synced events are never drag sources - only local events participate
  // in the sortable list, so reorder math only ever considers positions among each other.
  const draggableEvents = events.filter((event) => !event.googleCalendarSynced);
  const sortableIds = draggableEvents.map((event) => event.id);

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = draggableEvents.findIndex((item) => item.id === active.id);
    const newIndex = draggableEvents.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(draggableEvents, oldIndex, newIndex);
    const newStart = computeNewStart(reordered, newIndex);
    onReorder(String(active.id), newStart);
  }

  return { sensors, activeId, sortableIds, onDragStart, onDragEnd };
}
