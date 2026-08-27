import { eq } from "drizzle-orm";
import type { ReminderJob } from "@project/shared";
import { logger } from "../config/logger.js";
import { db } from "../db/client.js";
import { userPreferences } from "../db/schema/index.js";
import { getRabbitMqChannel } from "./rabbitmqClient.js";

const QUEUE_NAME = "notification_reminders";

interface PublishReminderJobInput {
  eventId: string;
  userId: string;
  eventTitle: string;
  reminderTime: Date;
  correlationId: string;
}

export async function publishReminderJob(input: PublishReminderJobInput): Promise<void> {
  const [preferences] = await db
    .select({ channels: userPreferences.channels })
    .from(userPreferences)
    .where(eq(userPreferences.userId, input.userId));

  const job: ReminderJob = {
    eventId: input.eventId,
    userId: input.userId,
    eventTitle: input.eventTitle,
    reminderTime: input.reminderTime.toISOString(),
    channels: preferences?.channels ?? ["browser"],
    status: "pending",
  };

  const channel = await getRabbitMqChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });
  channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(job)), {
    persistent: true,
    headers: { "x-correlation-id": input.correlationId },
  });

  logger.info({ eventId: input.eventId, correlationId: input.correlationId }, "Published reminder job");
}