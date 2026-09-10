import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Channel, ConsumeMessage } from "amqplib";
import type { ReminderJob } from "@project/shared";

const { getRabbitMqChannel, findEventMuteStatus, sendPushNotification, scheduleRetry, sendToDeadLetter } = vi.hoisted(
  () => ({
    getRabbitMqChannel: vi.fn(),
    findEventMuteStatus: vi.fn(),
    sendPushNotification: vi.fn(),
    scheduleRetry: vi.fn(),
    sendToDeadLetter: vi.fn(),
  }),
);

vi.mock("../services/rabbitmqClient.js", () => ({ getRabbitMqChannel }));
vi.mock("../db/eventsRepository.js", () => ({ findEventMuteStatus }));
vi.mock("../integrations/firebase.js", () => ({ sendPushNotification }));
vi.mock("../config/logger.js", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("../services/reminderQueues.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/reminderQueues.js")>();
  return { ...actual, assertReminderQueues: vi.fn(), scheduleRetry, sendToDeadLetter };
});

const { startReminderConsumer } = await import("./reminderConsumer.js");
const { RETRY_BACKOFF_MS } = await import("../services/reminderQueues.js");

function makeJob(overrides: Partial<ReminderJob> = {}): ReminderJob {
  return {
    eventId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    userId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    eventTitle: "Standup",
    reminderTime: new Date(Date.now() - 60_000).toISOString(),
    channels: ["browser"],
    status: "pending",
    ...overrides,
  };
}

// Drives one message through the consumer's real consume() callback.
async function deliver(job: ReminderJob, headers: Record<string, unknown> = {}) {
  const channel = {
    prefetch: vi.fn().mockResolvedValue(undefined),
    consume: vi.fn(),
    ack: vi.fn(),
    sendToQueue: vi.fn(),
  } as unknown as Channel;
  getRabbitMqChannel.mockResolvedValue(channel);

  await startReminderConsumer();
  const onMessage = vi.mocked(channel.consume).mock.calls[0][1] as (msg: ConsumeMessage) => void;

  onMessage({ content: Buffer.from(JSON.stringify(job)), properties: { headers } } as unknown as ConsumeMessage);
  await vi.waitFor(() => expect(channel.ack).toHaveBeenCalled());
  return channel;
}

beforeEach(() => {
  vi.clearAllMocks();
  findEventMuteStatus.mockResolvedValue({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", mutedUntilArchive: false });
  sendPushNotification.mockResolvedValue(undefined);
});

describe("reminder consumer", () => {
  it("acks and skips when the event no longer exists", async () => {
    findEventMuteStatus.mockResolvedValue(null);
    const channel = await deliver(makeJob());
    expect(sendPushNotification).not.toHaveBeenCalled();
    expect(scheduleRetry).not.toHaveBeenCalled();
    expect(channel.ack).toHaveBeenCalledOnce();
  });

  it("acks and skips a muted event", async () => {
    findEventMuteStatus.mockResolvedValue({ id: "x", mutedUntilArchive: true });
    const channel = await deliver(makeJob());
    expect(sendPushNotification).not.toHaveBeenCalled();
    expect(channel.ack).toHaveBeenCalledOnce();
  });

  it("reschedules a not-yet-due reminder without sending", async () => {
    const job = makeJob({ reminderTime: new Date(Date.now() + 3_600_000).toISOString() });
    const channel = await deliver(job);
    expect(sendPushNotification).not.toHaveBeenCalled();
    expect(scheduleRetry).toHaveBeenCalledWith(channel, job, expect.any(Number), 0);
    expect(vi.mocked(scheduleRetry).mock.calls[0][2]).toBeGreaterThan(0);
  });

  it("sends a due reminder with the job's channels", async () => {
    const job = makeJob();
    const channel = await deliver(job);
    expect(sendPushNotification).toHaveBeenCalledWith({
      userId: job.userId,
      title: job.eventTitle,
      channels: job.channels,
    });
    expect(scheduleRetry).not.toHaveBeenCalled();
    expect(channel.ack).toHaveBeenCalledOnce();
  });

  it("schedules a backoff retry when the send fails under the retry cap", async () => {
    sendPushNotification.mockRejectedValue(new Error("FCM down"));
    const job = makeJob();
    const channel = await deliver(job);
    expect(scheduleRetry).toHaveBeenCalledWith(channel, job, RETRY_BACKOFF_MS[0], 1);
    expect(sendToDeadLetter).not.toHaveBeenCalled();
    expect(channel.ack).toHaveBeenCalledOnce();
  });

  it("dead-letters when the send fails and retries are exhausted", async () => {
    sendPushNotification.mockRejectedValue(new Error("FCM down"));
    const job = makeJob();
    const channel = await deliver(job, { "x-retry-count": RETRY_BACKOFF_MS.length });
    expect(sendToDeadLetter).toHaveBeenCalledWith(channel, job);
    expect(scheduleRetry).not.toHaveBeenCalled();
    expect(channel.ack).toHaveBeenCalledOnce();
  });
});
