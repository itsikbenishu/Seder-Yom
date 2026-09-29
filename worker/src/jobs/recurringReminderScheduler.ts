import { randomUUID } from "node:crypto";
import cron from "node-cron";
import { computeReminderTime, type ReminderJob } from "@project/shared";
import { logger } from "../config/logger.js";
import { getRabbitMqChannel } from "../services/rabbitmqClient.js";
import { REMINDER_QUEUE } from "../services/reminderQueues.js";
import { findActiveReminderEvents } from "../db/eventsRepository.js";
import { findNotificationChannels } from "../db/userPreferencesRepository.js";

// Caps how far ahead a recurring event's next occurrence gets enqueued - otherwise an event due a week out would get re-published every day.
const ENQUEUE_WINDOW_MS = 26 * 60 * 60_000;

// "once" events get their one job from events.service.ts at create/update time; a recurring event has no such trigger for its *next* occurrence, so this re-derives and (re-)publishes it daily.
export async function runRecurringReminderScheduler(): Promise<void> {
  const events = await findActiveReminderEvents();
  const channel = await getRabbitMqChannel();

  let published = 0;
  for (const event of events) {
    if (!event.reminderMode) continue; // schema guarantees it whenever reminder=true; defensive only.

    const dueAtMs = computeReminderTime({
      dayOfWeek: event.dayOfWeek,
      start: event.start,
      reminderMode: event.reminderMode,
      reminderTime: event.reminderTime ?? undefined,
    }).getTime();

    // Already delivered for this exact occurrence - matches the consumer's own dedup check.
    if (event.reminderSentFor && event.reminderSentFor.getTime() === dueAtMs) continue;
    // Too far out - a later run of this same daily cron will pick it up closer to due time.
    if (dueAtMs - Date.now() > ENQUEUE_WINDOW_MS) continue;

    const channels = await findNotificationChannels(event.userId);
    const job: ReminderJob = {
      eventId: event.id,
      userId: event.userId,
      eventTitle: event.title,
      reminderTime: new Date(dueAtMs).toISOString(),
      channels,
      status: "pending",
    };

    channel.sendToQueue(REMINDER_QUEUE, Buffer.from(JSON.stringify(job)), {
      persistent: true,
      headers: { "x-correlation-id": randomUUID() },
    });
    published++;
  }

  logger.info({ count: events.length, published }, "Recurring reminder scheduler: run complete");
}

// Runs daily at 3:05am (Asia/Jerusalem), right after the 3:00am orphan file cleanup.
export function startRecurringReminderScheduler(): void {
  cron.schedule("5 3 * * *", () => {
    logger.info("Recurring reminder scheduler: job fired");
    runRecurringReminderScheduler().catch((error: unknown) => {
      logger.error({ error }, "Recurring reminder scheduler: job failed");
    });
  });

  logger.info("Recurring reminder scheduler: scheduled daily at 03:05");
}
