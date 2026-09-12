import type { Channel, ConsumeMessage } from "amqplib";
import { computeReminderTime, reminderJobSchema, type ReminderJob } from "@project/shared";
import { logger } from "../config/logger.js";
import { getRabbitMqChannel } from "../services/rabbitmqClient.js";
import {
  REMINDER_QUEUE,
  MAX_SEND_RETRIES,
  RETRY_BACKOFF_MS,
  assertReminderQueues,
  scheduleRetry,
  sendToDeadLetter,
} from "../services/reminderQueues.js";
import { findEventReminderState, markReminderSent } from "../db/eventsRepository.js";
import { findNotificationChannels } from "../db/userPreferencesRepository.js";
import { sendPushNotification } from "../integrations/firebase.js";

// REMINDER_RETRY_QUEUE is reused for two paths: "not yet due" reschedules (x-retry-count unchanged) and send-failure backoff (x-retry-count incremented, then DLQ). Delivery is at-least-once.

// Caps each reschedule hop — classic-queue per-message TTL only expires at the head, so an uncapped multi-day delay would block every shorter-delay message queued behind it.
const NEAR_RESCHEDULE_DELAY_MS = 5 * 60_000;
const FAR_RESCHEDULE_DELAY_MS = 30 * 60_000;
const NEAR_THRESHOLD_MS = 60 * 60_000;

// Tighter cap close to due time (still responsive), looser cap far out (cuts queue churn for multi-day reminders).
function cappedRescheduleDelay(remainingMs: number): number {
  const cap = remainingMs <= NEAR_THRESHOLD_MS ? NEAR_RESCHEDULE_DELAY_MS : FAR_RESCHEDULE_DELAY_MS;
  return Math.min(cap, remainingMs);
}

function getRetryCount(msg: ConsumeMessage): number {
  const raw: unknown = msg.properties.headers?.["x-retry-count"];
  const count = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(count) && count >= 0 ? count : 0;
}

function getCorrelationId(msg: ConsumeMessage): string | undefined {
  const raw: unknown = msg.properties.headers?.["x-correlation-id"];
  return typeof raw === "string" ? raw : undefined;
}

// Re-derived from the live event so a timing edit is honoured; the job's value is only a fallback.
function dueInstantMs(event: Awaited<ReturnType<typeof findEventReminderState>>, jobReminderTime: string): number {
  if (event?.reminderMode) {
    return computeReminderTime({
      dayOfWeek: event.dayOfWeek,
      start: event.start,
      reminderMode: event.reminderMode,
      reminderTime: event.reminderTime ?? undefined,
    }).getTime();
  }
  return new Date(jobReminderTime).getTime();
}

async function handleMessage(channel: Channel, msg: ConsumeMessage): Promise<void> {
  let job: ReminderJob;
  try {
    const rawBody: unknown = JSON.parse(msg.content.toString());
    job = reminderJobSchema.parse(rawBody);
  } catch (err) {
    // Genuinely unparseable — no job to retry, so this one really is poison.
    logger.error({ err }, "Reminder message failed to parse, dropping");
    channel.ack(msg);
    return;
  }

  const retryCount = getRetryCount(msg);
  const logCtx = { eventId: job.eventId, correlationId: getCorrelationId(msg) };

  try {
    const event = await findEventReminderState(job.eventId);
    if (!event) {
      logger.info(logCtx, "Reminder skipped: event no longer exists");
      channel.ack(msg);
      return;
    }
    if (event.mutedUntilArchive) {
      logger.info(logCtx, "Reminder skipped: event muted until archive");
      channel.ack(msg);
      return;
    }
    if (!event.reminder) {
      logger.info(logCtx, "Reminder skipped: reminder disabled on the event");
      channel.ack(msg);
      return;
    }

    const dueAtMs = dueInstantMs(event, job.reminderTime);
    if (dueAtMs > Date.now()) {
      const delayMs = cappedRescheduleDelay(Math.max(0, dueAtMs - Date.now()));
      scheduleRetry(channel, job, delayMs, retryCount);
      logger.info({ ...logCtx, delayMs }, "Reminder not yet due, rescheduled");
      channel.ack(msg);
      return;
    }

    // Stale + fresh job resolve to the same dueAtMs — first delivery stamps it, the rest skip here.
    if (event.reminderSentFor && event.reminderSentFor.getTime() === dueAtMs) {
      logger.info(logCtx, "Reminder skipped: already delivered for this slot");
      channel.ack(msg);
      return;
    }

    try {
      // job.channels is a snapshot from enqueue time; a Settings change since then must win.
      const channels = await findNotificationChannels(job.userId);
      const { sent } = await sendPushNotification({ userId: job.userId, title: job.eventTitle, channels });
      if (sent > 0) {
        await markReminderSent(job.eventId, new Date(dueAtMs));
        logger.info({ ...logCtx, sent }, "Reminder push sent");
      } else {
        logger.info({ ...logCtx, userId: job.userId, channels }, "Reminder skipped: no registered devices");
      }
    } catch (sendErr) {
      if (retryCount < MAX_SEND_RETRIES) {
        const delayMs = RETRY_BACKOFF_MS[retryCount];
        scheduleRetry(channel, job, delayMs, retryCount + 1);
        logger.warn({ ...logCtx, retryCount: retryCount + 1, err: sendErr }, "Reminder send failed, scheduled retry");
      } else {
        sendToDeadLetter(channel, job);
        logger.error({ ...logCtx, retryCount, err: sendErr }, "Reminder send failed, retries exhausted, routed to DLQ");
      }
    }
    channel.ack(msg);
  } catch (err) {
    // job parsed fine, so treat this as transient (DB/network blip) and retry instead of dropping — a real bug still surfaces, just after MAX_SEND_RETRIES instead of immediately.
    if (retryCount < MAX_SEND_RETRIES) {
      const delayMs = RETRY_BACKOFF_MS[retryCount];
      scheduleRetry(channel, job, delayMs, retryCount + 1);
      logger.warn({ ...logCtx, retryCount: retryCount + 1, err }, "Reminder processing failed, scheduled retry");
    } else {
      sendToDeadLetter(channel, job);
      logger.error({ ...logCtx, retryCount, err }, "Reminder processing failed, retries exhausted, routed to DLQ");
    }
    channel.ack(msg);
  }
}

export async function startReminderConsumer(): Promise<void> {
  const channel = await getRabbitMqChannel();
  await assertReminderQueues(channel);
  await channel.prefetch(1);

  await channel.consume(
    REMINDER_QUEUE,
    (msg) => {
      if (!msg) return;
      void handleMessage(channel, msg);
    },
    { noAck: false },
  );

  logger.info("Reminder consumer started");
}
