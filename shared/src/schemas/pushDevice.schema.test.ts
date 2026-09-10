import { describe, expect, it } from "vitest";
import { registerPushDeviceSchema, unregisterPushDeviceSchema } from "./pushDevice.schema.js";

describe("registerPushDeviceSchema", () => {
  it("accepts a token with a valid platform", () => {
    expect(registerPushDeviceSchema.safeParse({ token: "fcm-abc", platform: "browser" }).success).toBe(true);
    expect(registerPushDeviceSchema.safeParse({ token: "fcm-abc", platform: "mobile" }).success).toBe(true);
  });

  it("rejects an empty token", () => {
    expect(registerPushDeviceSchema.safeParse({ token: "", platform: "browser" }).success).toBe(false);
  });

  it("rejects an unknown platform", () => {
    expect(registerPushDeviceSchema.safeParse({ token: "fcm-abc", platform: "desktop" }).success).toBe(false);
  });
});

describe("unregisterPushDeviceSchema", () => {
  it("needs only a non-empty token", () => {
    expect(unregisterPushDeviceSchema.safeParse({ token: "fcm-abc" }).success).toBe(true);
    expect(unregisterPushDeviceSchema.safeParse({ token: "" }).success).toBe(false);
  });
});
