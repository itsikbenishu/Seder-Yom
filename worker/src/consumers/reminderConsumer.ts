import type { Channel, ConsumeMessage } from "amqplib";
import { reminderJobSchema } from "@project/shared";
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
import { findEventMuteStatus } from "../db/eventsRepository.js";
import { sendPushNotification } from "../integrations/firebase.js";

// REMINDER_RETRY_QUEUE is reused for two paths: "not yet due" reschedules (x-retry-count unchanged) and send-failure backoff (x-retry-count incremented, then DLQ). Delivery is at-least-once.
function getRetryCount(msg: ConsumeMessage): number {
  const raw: unknown = msg.properties.headers?.["x-retry-count"];
  const count = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(count) && count >= 0 ? count : 0;
}

function getCorrelationId(msg: ConsumeMessage): string | undefined {
  const raw: unknown = msg.properties.headers?.["x-correlation-id"];
  return typeof raw === "string" ? raw : undefined;
}

async function handleMessage(channel: Channel, msg: ConsumeMessage): Promise<void> {
  try {
    const rawBody: unknown = JSON.parse(msg.content.toString());
    const job = reminderJobSchema.parse(rawBody);
    // job.status and SPEC §10's "mark sent|failed" aren't persisted — no reminders table exists; sent == ack, failed == DLQ.
    const retryCount = getRetryCount(msg);
    const logCtx = { eventId: job.eventId, correlationId: getCorrelationId(msg) };

    const event = await findEventMuteStatus(job.eventId);
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

    const dueAtMs = new Date(job.reminderTime).getTime();
    const notYetDue = dueAtMs > Date.now();
    if (notYetDue) {
      const delayMs = Math.max(0, dueAtMs - Date.now());
      // A large delayMs sitting at the head can hold back shorter TTLs behind it (RabbitMQ per-message TTL).
      scheduleRetry(channel, job, delayMs, retryCount);
      logger.info({ ...logCtx, delayMs }, "Reminder not yet due, rescheduled");
      channel.ack(msg);
      return;
    }

    try {
      await sendPushNotification({ userId: job.userId, title: job.eventTitle, channels: job.channels });
      logger.info(logCtx, "Reminder push sent");
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
    // Ack-drops any unhandled error: poison payloads, but also transient DB/network blips — in that case the reminder is silently lost. Acceptable for now; the two aren't distinguished.
    logger.error({ err }, "Unexpected error processing reminder message, acking to drop it");
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
