import { beforeEach, describe, expect, it, vi } from "vitest";

const { sql } = vi.hoisted(() => ({ sql: vi.fn() }));
vi.mock("./client.js", () => ({ sql }));

const { deleteDeviceTokens, findDeviceTokens } = await import("./pushDevicesRepository.js");

beforeEach(() => vi.clearAllMocks());

describe("findDeviceTokens", () => {
  it("returns [] and never builds a query for an empty platform list", async () => {
    // Guards against `platform IN ()` — a stray `channels: []` on a job would
    // otherwise crash the query and dead-letter the reminder.
    await expect(findDeviceTokens("u1", [])).resolves.toEqual([]);
    expect(sql).not.toHaveBeenCalled();
  });
});

describe("deleteDeviceTokens", () => {
  it("is a no-op for an empty token list", async () => {
    await expect(deleteDeviceTokens([])).resolves.toBeUndefined();
    expect(sql).not.toHaveBeenCalled();
  });
});
