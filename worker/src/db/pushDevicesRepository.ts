import { sql } from "./client.js";

// Tokens for a user, narrowed to the platforms their chosen notification channel
// maps to. A job normally carries exactly one channel; guard the empty case so a
// stray `channels: []` can't compile to `platform IN ()` and dead-letter the job.
export async function findDeviceTokens(userId: string, platforms: string[]): Promise<string[]> {
  if (platforms.length === 0) return [];
  const rows = await sql<{ token: string }[]>`
    SELECT token FROM push_devices
    WHERE user_id = ${userId} AND platform IN ${sql(platforms)}
  `;
  return rows.map((row) => row.token);
}

// Prune tokens FCM has rejected as permanently invalid.
export async function deleteDeviceTokens(tokens: string[]): Promise<void> {
  if (tokens.length === 0) return;
  await sql`DELETE FROM push_devices WHERE token IN ${sql(tokens)}`;
}
