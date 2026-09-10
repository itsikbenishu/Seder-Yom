import { describe, expect, it } from "vitest";
import { reminderJobSchema } from "./reminderJob.schema.js";

const job = {
  eventId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  userId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  eventTitle: "Standup",
  reminderTime: "2026-09-10T09:00:00.000Z",
  channels: ["browser"],
  status: "pending",
};

describe("reminderJobSchema", () => {
  it("round-trips a valid job", () => {
    expect(reminderJobSchema.parse(job)).toEqual(job);
  });

  it("rejects a non-ISO reminderTime", () => {
    expect(reminderJobSchema.safeParse({ ...job, reminderTime: "soon" }).success).toBe(false);
  });

  it("rejects an unknown status", () => {
    expect(reminderJobSchema.safeParse({ ...job, status: "queued" }).success).toBe(false);
  });

  it("accepts an empty channels array — the worker, not the schema, guards this", () => {
    // Documents why worker/src/db/pushDevicesRepository.ts needs its own length check.
    expect(reminderJobSchema.safeParse({ ...job, channels: [] }).success).toBe(true);
  });
});
