import type { Channel } from "amqplib";
import type { ReminderJob } from "@project/shared";

export const REMINDER_QUEUE = "notification_reminders";
export const REMINDER_RETRY_QUEUE = "notification_reminders.retry";
export const REMINDER_DLQ = "notification_reminders.dlq";

// Send-failure backoff schedule, indexed by attempt number (0 = first retry).
export const RETRY_BACKOFF_MS = [30_000, 120_000, 600_000] as const;
export const MAX_SEND_RETRIES = RETRY_BACKOFF_MS.length;

// Declares the full queue topology this consumer owns. The main queue's args
// must match the existing publisher's assertQueue exactly ({ durable: true },
// nothing else) or RabbitMQ raises a 406 PRECONDITION_FAILED channel error.
export async function assertReminderQueues(channel: Channel): Promise<void> {
  await channel.assertQueue(REMINDER_QUEUE, { durable: true });
  await channel.assertQueue(REMINDER_RETRY_QUEUE, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": REMINDER_QUEUE,
    },
  });
  await channel.assertQueue(REMINDER_DLQ, { durable: true });
}

// Republishes the job onto the delay queue; it dead-letters back onto the
// main queue once `delayMs` elapses. Used both for "not due yet" reschedules
// (retryCount left unchanged) and send-failure backoff (retryCount incremented).
export function scheduleRetry(channel: Channel, job: ReminderJob, delayMs: number, retryCount: number): void {
  channel.sendToQueue(REMINDER_RETRY_QUEUE, Buffer.from(JSON.stringify(job)), {
    persistent: true,
    expiration: String(delayMs),
    headers: { "x-retry-count": retryCount },
  });
}

export function sendToDeadLetter(channel: Channel, job: ReminderJob): void {
  channel.sendToQueue(REMINDER_DLQ, Buffer.from(JSON.stringify(job)), {
    persistent: true,
  });
}
