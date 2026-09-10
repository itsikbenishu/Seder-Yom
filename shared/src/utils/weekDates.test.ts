import { describe, expect, it } from "vitest";
import { currentWeekRange, dateForDayOfWeek, dayOfWeekForDate } from "./weekDates.js";

describe("dayOfWeekForDate", () => {
  it("uses JS Date.getDay() (0 = Sunday)", () => {
    expect(dayOfWeekForDate(new Date(2026, 8, 6))).toBe(0); // 2026-09-06 is a Sunday
    expect(dayOfWeekForDate(new Date(2026, 8, 10))).toBe(4); // Thursday
  });
});

describe("dateForDayOfWeek", () => {
  it("returns a date in the current week whose weekday matches", () => {
    for (let d = 0; d <= 6; d++) {
      expect(dateForDayOfWeek(d).getDay()).toBe(d);
    }
  });

  it("lands within 6 days of today", () => {
    const today = new Date();
    for (let d = 0; d <= 6; d++) {
      const diffDays = Math.abs(dateForDayOfWeek(d).getTime() - today.getTime()) / 86_400_000;
      expect(diffDays).toBeLessThan(7);
    }
  });
});

describe("currentWeekRange", () => {
  it("spans Sunday 00:00:00.000 to Saturday 23:59:59.999", () => {
    const { start, end } = currentWeekRange();
    expect(start.getDay()).toBe(0);
    expect([start.getHours(), start.getMinutes(), start.getSeconds(), start.getMilliseconds()]).toEqual([0, 0, 0, 0]);
    expect(end.getDay()).toBe(6);
    expect([end.getHours(), end.getMinutes(), end.getSeconds(), end.getMilliseconds()]).toEqual([23, 59, 59, 999]);
    expect(start.getTime()).toBeLessThan(end.getTime());
  });
});
