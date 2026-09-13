import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

// Dynamic import so worker's env.ts (requires FIREBASE_SERVICE_ACCOUNT_JSON) only parses when actually used.
async function startInlineWorker(): Promise<void> {
  const { startReminderConsumer } = await import("worker/src/consumers/reminderConsumer.js");
  const { startOrphanCleanupJob } = await import("worker/src/jobs/orphanFileCleanup.js");
  await startReminderConsumer();
  startOrphanCleanupJob();
  logger.info("Inline worker started");
}

app.listen(env.PORT, () => {
  logger.info(`Server listening on port ${env.PORT}`);
});

if (env.RUN_WORKER_INLINE) {
  // Non-fatal: a worker startup failure shouldn't take the API down with it.
  startInlineWorker().catch((err: unknown) => {
    logger.error({ err }, "Inline worker failed to start");
  });
}
