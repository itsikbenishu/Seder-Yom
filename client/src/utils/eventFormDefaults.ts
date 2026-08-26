import type { EventFormValues } from "../types/eventForm";
import type { CalendarEvent } from "../types/calendarEvent";

/** Blank form defaults for a new event on the given day. */
export function createDefaultEventFormValues(dayOfWeek: number, allDay: boolean): EventFormValues {
  const shared = {
    dayOfWeek,
    title: "",
    description: undefined,
    note: undefined,
    start: "09:00",
    end: "10:00",
    reminder: false,
    mutedUntilArchive: false,
    fileIds: [],
  };

  if (allDay) {
    return { ...shared, allDay: true, frequency: "daily", reminderMode: "time", reminderTime: undefined };
  }

  return { ...shared, allDay: false, frequency: "once", reminderMode: undefined, reminderTime: undefined };
}

/** Maps an existing event (read model) onto the form's write-shape for editing. */
export function eventToFormValues(event: CalendarEvent): EventFormValues {
  const shared = {
    dayOfWeek: event.dayOfWeek,
    title: event.title,
    description: event.description,
    note: event.note,
    start: event.start,
    end: event.end,
    reminder: event.reminder,
    reminderTime: event.reminderTime,
    mutedUntilArchive: event.mutedUntilArchive,
    fileIds: event.files.map((file) => file.id),
  };

  if (event.allDay) {
    return { ...shared, allDay: true, frequency: event.frequency, reminderMode: "time" };
  }

  return { ...shared, allDay: false, frequency: event.frequency, reminderMode: event.reminderMode };
}
