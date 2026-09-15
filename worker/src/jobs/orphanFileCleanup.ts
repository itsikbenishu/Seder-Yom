import cron from "node-cron";
import { sql } from "../db/client.js";
import { logger } from "../config/logger.js";
import { removeStorageObjects } from "../integrations/supabaseStorage.js";

// Daily cron-style maintenance job (not event-driven): removes event_files rows that
// were uploaded but never attached to a saved event, once they're old enough that the
// user is unlikely to still be filling out the form (SPEC.md §8's 24h grace window).
export async function runOrphanFileCleanup(): Promise<void> {
  const rows = await sql<{ storage_path: string }[]>`
    DELETE FROM event_files
    WHERE event_id IS NULL AND uploaded_at < NOW() - INTERVAL '24 hours'
    RETURNING storage_path
  `;

  if (rows.length === 0) {
    logger.info("Orphan file cleanup: nothing to remove");
    return;
  }

  await removeStorageObjects(rows.map((row) => row.storage_path));
  logger.info({ count: rows.length }, "Orphan file cleanup: removed files");
}

// Runs once daily at 3am (Asia/Jerusalem, per env.ts's process.env.TZ pin) - low-traffic
// hour, and the exact time isn't spec'd beyond "run daily".
export function startOrphanCleanupJob(): void {
  cron.schedule("0 3 * * *", () => {
    logger.info("Orphan file cleanup: job fired");
    runOrphanFileCleanup()
      .then(() => {
        logger.info("Orphan file cleanup: job finished");
      })
      .catch((error: unknown) => {
        logger.error({ error }, "Orphan file cleanup: job failed");
      });
  });

  logger.info("Orphan file cleanup: scheduled daily at 03:00");
}
