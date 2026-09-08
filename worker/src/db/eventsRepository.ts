import { sql } from "./client.js";

export interface EventMuteStatus {
  id: string;
  mutedUntilArchive: boolean;
}

interface EventRow {
  id: string;
  muted_until_archive: boolean;
}

// Raw SQL against the real (snake_case) `events` table — worker has no
// Drizzle schema access (separate workspace from server).
export async function findEventMuteStatus(eventId: string): Promise<EventMuteStatus | null> {
  const rows = await sql<EventRow[]>`SELECT id, muted_until_archive FROM events WHERE id = ${eventId}`;
  const row = rows[0];
  if (!row) return null;

  return { id: row.id, mutedUntilArchive: row.muted_until_archive };
}
