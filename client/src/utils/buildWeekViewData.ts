import { currentWeekRange, dateForDayOfWeek, dayOfWeekForDate } from "@project/shared";
import type { CalendarEvent } from "../types/calendarEvent";
import type { WeekDay, WeekViewData } from "../types/week";

function nearestEventForDay(dayEvents: CalendarEvent[]): CalendarEvent | null {
  const timedEvents = dayEvents.filter((event) => !event.allDay);
  if (timedEvents.length === 0) {
    return null;
  }
  return [...timedEvents].sort((a, b) => a.start.localeCompare(b.start))[0];
}

function isDayMuted(dayEvents: CalendarEvent[]): boolean {
  const timedEvents = dayEvents.filter((event) => !event.allDay);
  return timedEvents.length > 0 && timedEvents.every((event) => event.mutedUntilArchive);
}

export function buildWeekViewData(events: CalendarEvent[], today: Date = new Date()): WeekViewData {
  const todayDayOfWeek = dayOfWeekForDate(today);

  const days: WeekDay[] = Array.from({ length: 7 }, (_, dayOfWeek) => {
    const dayEvents = events.filter((event) => event.dayOfWeek === dayOfWeek);
    const date = dateForDayOfWeek(dayOfWeek);

    return {
      dayOfWeek,
      date: { yr: date.getFullYear(), month: date.getMonth(), day: date.getDate() },
      isToday: dayOfWeek === todayDayOfWeek,
      isMuted: isDayMuted(dayEvents),
      events: dayEvents,
      nearestEvent: nearestEventForDay(dayEvents),
    };
  });

  return { weekRange: currentWeekRange(), days };
}
