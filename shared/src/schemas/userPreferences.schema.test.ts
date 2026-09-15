import { describe, expect, it } from "vitest";
import { updateUserPreferencesSchema, userPreferencesSchema } from "./userPreferences.schema.js";

const USER_ID = "11111111-1111-4111-8111-111111111111";

describe("userPreferencesSchema - read shape", () => {
  it("fills every default from just a user_id", () => {
    expect(userPreferencesSchema.parse({ user_id: USER_ID })).toEqual({
      user_id: USER_ID,
      language: "he",
      theme: "system",
      reminderEnabled: true,
      channels: ["browser"],
    });
  });
});

describe("updateUserPreferencesSchema - write shape", () => {
  it("keeps omitted keys absent (not a .partial() with defaults)", () => {
    expect(updateUserPreferencesSchema.parse({ language: "en" })).toEqual({ language: "en" });
    expect(updateUserPreferencesSchema.parse({})).toEqual({});
  });

  it("requires exactly one channel", () => {
    expect(updateUserPreferencesSchema.safeParse({ channels: [] }).success).toBe(false);
    expect(updateUserPreferencesSchema.safeParse({ channels: ["browser", "mobile"] }).success).toBe(false);
    expect(updateUserPreferencesSchema.safeParse({ channels: ["mobile"] }).success).toBe(true);
  });

  it("rejects unknown enum values", () => {
    expect(updateUserPreferencesSchema.safeParse({ theme: "sepia" }).success).toBe(false);
    expect(updateUserPreferencesSchema.safeParse({ channels: ["desktop"] }).success).toBe(false);
  });
});
