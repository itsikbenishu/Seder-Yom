import { eq } from "drizzle-orm";
import { userPreferencesSchema, type UpdateUserPreferencesInput, type UserPreferences } from "@project/shared";
import { db } from "../db/client.js";
import { userPreferences } from "../db/schema/index.js";

function toApiUserPreferences(row: typeof userPreferences.$inferSelect): UserPreferences {
  return userPreferencesSchema.parse({
    user_id: row.userId,
    language: row.language,
    theme: row.theme,
    reminderEnabled: row.reminderEnabled,
    channels: row.channels,
  });
}

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const [row] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));

  // No row yet (user never touched Settings) — fall back to the schema's own
  // defaults rather than a 404: preferences always "exist" logically.
  if (!row) {
    return userPreferencesSchema.parse({ user_id: userId });
  }

  return toApiUserPreferences(row);
}

export async function upsertUserPreferences(
  userId: string,
  input: UpdateUserPreferencesInput,
): Promise<UserPreferences> {
  // `input` only carries the keys the caller actually sent (SPEC.md §9 "any subset") —
  // spreading it into both `.values()` and `.set()` means an insert falls back to the
  // column defaults for anything omitted, and an update patches only what was provided.
  const [row] = await db
    .insert(userPreferences)
    .values({ userId, ...input })
    .onConflictDoUpdate({ target: userPreferences.userId, set: input })
    .returning();

  return toApiUserPreferences(row);
}
