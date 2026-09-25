import { describe, expect, it } from "vitest";
import { mapToGoogleCalendarEvent } from "./googleCalendarEvents.service.js";

describe("mapToGoogleCalendarEvent", () => {
  it("maps an all-day date-only event", () => {
    const mapped = mapToGoogleCalendarEvent(
      {
        id: "abc123",
        summary: "Yom Kippur",
        start: { date: "2026-09-21" },
        end: { date: "2026-09-22" },
      },
      "en.jewish#holiday@group.v.calendar.google.com",
    );

    expect(mapped).toMatchObject({
      id: "gcal_en.jewish#holiday@group.v.calendar.google.com_abc123",
      dayOfWeek: 1,
      title: "Yom Kippur",
      start: "00:00",
      end: "23:59",
      allDay: true,
      gcal: true,
    });
  });

  it("maps a timed dateTime event, prefixing the id with the calendar id", () => {
    const mapped = mapToGoogleCalendarEvent(
      {
        id: "xyz789",
        summary: "1:1",
        start: { dateTime: "2026-09-21T16:00:00+03:00" },
        end: { dateTime: "2026-09-21T17:00:00+03:00" },
      },
      "primary",
    );

    expect(mapped).toMatchObject({
      id: "gcal_primary_xyz789",
      title: "1:1",
      allDay: false,
    });
    expect(mapped.start).toMatch(/^\d{2}:\d{2}$/);
    expect(mapped.end).toMatch(/^\d{2}:\d{2}$/);
  });

  it("defaults a missing summary to an empty title", () => {
    const mapped = mapToGoogleCalendarEvent(
      { id: "no-title", start: { date: "2026-09-21" }, end: { date: "2026-09-22" } },
      "primary",
    );

    expect(mapped.title).toBe("");
  });
});
