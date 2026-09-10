import { describe, expect, it } from "vitest";
import { createEventSchema, updateEventSchema } from "./event.schema.js";

const timed = {
  dayOfWeek: 1,
  title: "Standup",
  start: "09:00",
  end: "10:00",
  allDay: false as const,
  frequency: "once" as const,
};

const allDay = {
  dayOfWeek: 1,
  title: "Fast day",
  start: "00:00",
  end: "23:59",
  allDay: true as const,
  frequency: "daily" as const,
};

function firstError(result: { success: false; error: { issues: { message: string }[] } }): string {
  return result.error.issues[0]?.message ?? "";
}

describe("createEventSchema — discriminated union on allDay", () => {
  it("accepts a minimal timed event and defaults reminder/muted/fileIds", () => {
    const parsed = createEventSchema.parse(timed);
    expect(parsed).toMatchObject({ allDay: false, reminder: false, mutedUntilArchive: false, fileIds: [] });
  });

  it("accepts an all-day event and forces reminderMode to 'time'", () => {
    const parsed = createEventSchema.parse(allDay);
    expect(parsed).toMatchObject({ allDay: true, reminderMode: "time" });
  });

  it("rejects frequency 'once' for an all-day event", () => {
    const result = createEventSchema.safeParse({ ...allDay, frequency: "once" });
    expect(result.success).toBe(false);
  });

  it("accepts frequency once/daily/weekly for a timed event", () => {
    for (const frequency of ["once", "daily", "weekly"] as const) {
      expect(createEventSchema.safeParse({ ...timed, frequency }).success).toBe(true);
    }
  });
});

describe("createEventSchema — business rules", () => {
  it("rejects a timed event whose end is not after start", () => {
    const result = createEventSchema.safeParse({ ...timed, start: "10:00", end: "10:00" });
    expect(result.success).toBe(false);
    if (!result.success) expect(firstError(result)).toBe("validation.time.endBeforeStart");
  });

  it("requires reminderMode when reminder is on", () => {
    const result = createEventSchema.safeParse({ ...timed, reminder: true });
    expect(result.success).toBe(false);
    if (!result.success) expect(firstError(result)).toBe("validation.reminder.modeRequired");
  });

  it("requires reminderTime when reminderMode is 'time'", () => {
    const result = createEventSchema.safeParse({ ...timed, reminder: true, reminderMode: "time" });
    expect(result.success).toBe(false);
    if (!result.success) expect(firstError(result)).toBe("validation.reminder.timeRequired");
  });

  it("accepts an offset reminderMode without a reminderTime", () => {
    expect(createEventSchema.safeParse({ ...timed, reminder: true, reminderMode: "1h" }).success).toBe(true);
  });
});

describe("createEventSchema — title bounds", () => {
  it("rejects an empty title", () => {
    const result = createEventSchema.safeParse({ ...timed, title: "" });
    expect(result.success).toBe(false);
    if (!result.success) expect(firstError(result)).toBe("validation.title.required");
  });

  it("rejects a title over 80 chars", () => {
    const result = createEventSchema.safeParse({ ...timed, title: "x".repeat(81) });
    expect(result.success).toBe(false);
    if (!result.success) expect(firstError(result)).toBe("validation.title.maxLength");
  });
});

describe("updateEventSchema — partial patch", () => {
  it("accepts a single-field patch", () => {
    expect(updateEventSchema.safeParse({ title: "Renamed" }).success).toBe(true);
  });

  it("still applies the reminder cross-rule to a partial payload", () => {
    expect(updateEventSchema.safeParse({ reminder: true }).success).toBe(false);
    expect(updateEventSchema.safeParse({ reminder: true, reminderMode: "1h" }).success).toBe(true);
  });
});
