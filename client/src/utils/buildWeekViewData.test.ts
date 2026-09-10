import { describe, expect, it } from "vitest";
import type { CalendarEvent } from "../types/calendarEvent";
import { buildWeekViewData } from "./buildWeekViewData";

function ev(partial: {
  dayOfWeek: number;
  start?: string;
  allDay?: boolean;
  mutedUntilArchive?: boolean;
}): CalendarEvent {
  return {
    dayOfWeek: partial.dayOfWeek,
    start: partial.start ?? "09:00",
    allDay: partial.allDay ?? false,
    mutedUntilArchive: partial.mutedUntilArchive ?? false,
  } as unknown as CalendarEvent;
}

const MONDAY = new Date(2026, 8, 7); // 2026-09-07 is a Monday (dayOfWeek 1)

describe("buildWeekViewData", () => {
  it("always returns seven days, grouped by dayOfWeek", () => {
    const { days } = buildWeekViewData([ev({ dayOfWeek: 1 }), ev({ dayOfWeek: 1 }), ev({ dayOfWeek: 4 })], MONDAY);
    expect(days).toHaveLength(7);
    expect(days.map((d) => d.events.length)).toEqual([0, 2, 0, 0, 1, 0, 0]);
  });

  it("marks only today's day as today", () => {
    const { days } = buildWeekViewData([], MONDAY);
    expect(days.filter((d) => d.isToday)).toHaveLength(1);
    expect(days[1].isToday).toBe(true);
  });

  it("treats a day as muted only when every timed event is muted", () => {
    const both = buildWeekViewData(
      [ev({ dayOfWeek: 2, mutedUntilArchive: true }), ev({ dayOfWeek: 2, mutedUntilArchive: true })],
      MONDAY,
    );
    expect(both.days[2].isMuted).toBe(true);

    const mixed = buildWeekViewData(
      [ev({ dayOfWeek: 3, mutedUntilArchive: true }), ev({ dayOfWeek: 3, mutedUntilArchive: false })],
      MONDAY,
    );
    expect(mixed.days[3].isMuted).toBe(false);

    const allDayOnly = buildWeekViewData([ev({ dayOfWeek: 4, allDay: true, mutedUntilArchive: true })], MONDAY);
    expect(allDayOnly.days[4].isMuted).toBe(false);
  });

  it("picks the earliest timed event as nearestEvent, ignoring all-day", () => {
    const { days } = buildWeekViewData(
      [
        ev({ dayOfWeek: 5, start: "14:00" }),
        ev({ dayOfWeek: 5, start: "08:30" }),
        ev({ dayOfWeek: 5, allDay: true }),
      ],
      MONDAY,
    );
    expect(days[5].nearestEvent?.start).toBe("08:30");
  });

  it("has no nearestEvent when a day holds only all-day events", () => {
    const { days } = buildWeekViewData([ev({ dayOfWeek: 6, allDay: true })], MONDAY);
    expect(days[6].nearestEvent).toBeNull();
  });
});
