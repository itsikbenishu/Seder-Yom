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
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { hasAllDayReminder, type DayAllDayEvent } from "../types/day";

export interface UseAllDayReminderDndResult {
  sensors: SensorDescriptor<SensorOptions>[];
  activeId: string | null;
  /** ids of the draggable (local, reminder-having) all-day events, in current order. */
  sortableIds: string[];
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

/**
 * Encapsulates all @dnd-kit state for the Day all-day-event list. Dropping a reminder-having
 * event onto another swaps their reminderTime values directly - the list's own sort (by
 * reminderTime) resettles both into their correct position after the mutation refetches.
 */
export function useAllDayReminderDnd(
  events: DayAllDayEvent[],
  onSwap: (firstId: string, firstTime: string, secondId: string, secondTime: string) => void,
): UseAllDayReminderDndResult {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const draggableEvents = events.filter(hasAllDayReminder);
  const sortableIds = draggableEvents.map((event) => event.id);

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const dragged = draggableEvents.find((item) => item.id === active.id);
    const target = draggableEvents.find((item) => item.id === over.id);
    if (!dragged || !target) return;

    onSwap(dragged.id, target.reminderTime, target.id, dragged.reminderTime);
  }

  return { sensors, activeId, sortableIds, onDragStart, onDragEnd };
}
