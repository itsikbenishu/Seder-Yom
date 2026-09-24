import { describe, expect, it } from "vitest";
import type { GoogleCalendarEvent } from "@project/shared";
import type { CalendarEvent } from "../types/calendarEvent";
import { buildDayViewData } from "./buildDayViewData";

function ev(partial: {
  dayOfWeek: number;
  start?: string;
  allDay?: boolean;
  mutedUntilArchive?: boolean;
}): CalendarEvent {
  return {
    dayOfWeek: partial.dayOfWeek,
    start: partial.start ?? "09:00",
    end: partial.start ?? "10:00",
    allDay: partial.allDay ?? false,
    mutedUntilArchive: partial.mutedUntilArchive ?? false,
  } as unknown as CalendarEvent;
}

function gev(partial: { dayOfWeek: number; start?: string; allDay?: boolean }): GoogleCalendarEvent {
  return {
    id: `gcal_${Math.random()}`,
    dayOfWeek: partial.dayOfWeek,
    title: "Google event",
    start: partial.start ?? "09:00",
    end: "10:00",
    allDay: partial.allDay ?? false,
    gcal: true,
  };
}

const NOW = new Date(2026, 8, 7, 12, 0); // 2026-09-07 12:00

describe("buildDayViewData", () => {
  it("filters both local and google events down to the requested dayOfWeek", () => {
    const data = buildDayViewData([ev({ dayOfWeek: 1 }), ev({ dayOfWeek: 2 })], 1, NOW, [
      gev({ dayOfWeek: 1 }),
      gev({ dayOfWeek: 2 }),
    ]);
    expect(data.timedEvents).toHaveLength(2);
  });

  it("merges and sorts local and google timed events by start", () => {
    const data = buildDayViewData([ev({ dayOfWeek: 1, start: "14:00" })], 1, NOW, [gev({ dayOfWeek: 1, start: "08:30" })]);
    expect(data.timedEvents.map((e) => e.start)).toEqual(["08:30", "14:00"]);
  });

  it("merges all-day events from both sources", () => {
    const data = buildDayViewData([ev({ dayOfWeek: 1, allDay: true })], 1, NOW, [gev({ dayOfWeek: 1, allDay: true })]);
    expect(data.allDayEvents).toHaveLength(2);
  });

  it("ignores google events for isMuted - a google-only day is never muted", () => {
    const data = buildDayViewData([], 1, NOW, [gev({ dayOfWeek: 1 }), gev({ dayOfWeek: 1 })]);
    expect(data.isMuted).toBe(false);
  });

  it("treats the day as muted only when every local timed event is muted", () => {
    const data = buildDayViewData(
      [ev({ dayOfWeek: 1, mutedUntilArchive: true }), ev({ dayOfWeek: 1, mutedUntilArchive: true })],
      1,
      NOW,
      [gev({ dayOfWeek: 1 })],
    );
    expect(data.isMuted).toBe(true);
  });

  it("picks nextUpEventId across local and google events by start time", () => {
    const data = buildDayViewData([ev({ dayOfWeek: 1, start: "08:00" })], 1, NOW, [gev({ dayOfWeek: 1, start: "13:00" })]);
    expect(data.nextUpEventId).toBe(data.timedEvents.find((e) => e.start === "13:00")?.id);
  });
});
