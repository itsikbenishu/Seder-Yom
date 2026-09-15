import type { NotificationChannel } from "@project/shared";
import { sql } from "./client.js";

// Matches the shared schema's default (userPreferences.schema.ts) for a user who never touched Settings.
const DEFAULT_CHANNELS: NotificationChannel[] = ["browser"];

// Read fresh at send time - a channel switch after enqueue must win over the job's stale snapshot.
export async function findNotificationChannels(userId: string): Promise<NotificationChannel[]> {
  const rows = await sql<{ channels: NotificationChannel[] }[]>`
    SELECT channels FROM user_preferences WHERE user_id = ${userId}
  `;
  return rows[0]?.channels ?? DEFAULT_CHANNELS;
}
