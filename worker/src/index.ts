import { logger } from "./config/logger.js";
import { startReminderConsumer } from "./consumers/reminderConsumer.js";
import { startOrphanCleanupJob } from "./jobs/orphanFileCleanup.js";

async function main(): Promise<void> {
  await startReminderConsumer();
  startOrphanCleanupJob();
  logger.info("Worker started");
}

main().catch((err: unknown) => {
  logger.error({ err }, "Worker failed to start");
  process.exit(1);
});
