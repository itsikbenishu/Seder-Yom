import { describe, expect, it } from "vitest";
import { computeReminderTime } from "./reminderTime.js";
import { dateForDayOfWeek } from "./weekDates.js";

function at(dayOfWeek: number, time: string): number {
  const [h, m] = time.split(":").map(Number);
  const d = dateForDayOfWeek(dayOfWeek);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

describe("computeReminderTime — offset modes", () => {
  const base = { dayOfWeek: 3, start: "09:00" as const };

  it.each([
    ["15m", 15],
    ["30m", 30],
    ["1h", 60],
    ["1d", 1440],
  ] as const)("%s fires that many minutes before the start", (reminderMode, minutes) => {
    const result = computeReminderTime({ ...base, reminderMode });
    expect(result.getTime()).toBe(at(3, "09:00") - minutes * 60_000);
  });
});

describe("computeReminderTime — 'time' mode", () => {
  it("fires at the given clock time on the event's day", () => {
    const result = computeReminderTime({ dayOfWeek: 2, start: "00:00", reminderMode: "time", reminderTime: "08:30" });
    expect(result.getTime()).toBe(at(2, "08:30"));
  });

  it("throws when reminderTime is missing", () => {
    expect(() => computeReminderTime({ dayOfWeek: 2, start: "09:00", reminderMode: "time" })).toThrow();
  });
});
