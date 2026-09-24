import { currentWeekRange, dateForDayOfWeek, dayOfWeekForDate } from "@project/shared";
import type { GoogleCalendarEvent } from "@project/shared";
import type { CalendarEvent } from "../types/calendarEvent";
import type { WeekDay, WeekViewData } from "../types/week";

function nearestEventForDay(
  dayEvents: CalendarEvent[],
  dayGoogleEvents: GoogleCalendarEvent[],
): CalendarEvent | GoogleCalendarEvent | null {
  const timedEvents = [...dayEvents.filter((event) => !event.allDay), ...dayGoogleEvents.filter((event) => !event.allDay)];
  if (timedEvents.length === 0) {
    return null;
  }
  return [...timedEvents].sort((a, b) => a.start.localeCompare(b.start))[0];
}

// Local-only: Google events have no mutedUntilArchive.
function isDayMuted(dayEvents: CalendarEvent[]): boolean {
  const timedEvents = dayEvents.filter((event) => !event.allDay);
  return timedEvents.length > 0 && timedEvents.every((event) => event.mutedUntilArchive);
}

export function buildWeekViewData(
  events: CalendarEvent[],
  today: Date = new Date(),
  googleEvents: GoogleCalendarEvent[] = [],
): WeekViewData {
  const todayDayOfWeek = dayOfWeekForDate(today);

  const days: WeekDay[] = Array.from({ length: 7 }, (_, dayOfWeek) => {
    const dayEvents = events.filter((event) => event.dayOfWeek === dayOfWeek);
    const dayGoogleEvents = googleEvents.filter((event) => event.dayOfWeek === dayOfWeek);
    const date = dateForDayOfWeek(dayOfWeek);

    return {
      dayOfWeek,
      date: { yr: date.getFullYear(), month: date.getMonth(), day: date.getDate() },
      isToday: dayOfWeek === todayDayOfWeek,
      isMuted: isDayMuted(dayEvents),
      events: dayEvents,
      nearestEvent: nearestEventForDay(dayEvents, dayGoogleEvents),
    };
  });

  return { weekRange: currentWeekRange(), days };
}
