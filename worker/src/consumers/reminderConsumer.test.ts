import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Channel, ConsumeMessage } from "amqplib";
import type { ReminderJob } from "@project/shared";

const {
  getRabbitMqChannel,
  findEventReminderState,
  markReminderSent,
  findNotificationChannels,
  sendPushNotification,
  scheduleRetry,
  sendToDeadLetter,
  computeReminderTime,
} = vi.hoisted(() => ({
  getRabbitMqChannel: vi.fn(),
  findEventReminderState: vi.fn(),
  markReminderSent: vi.fn(),
  findNotificationChannels: vi.fn(),
  sendPushNotification: vi.fn(),
  scheduleRetry: vi.fn(),
  sendToDeadLetter: vi.fn(),
  computeReminderTime: vi.fn(),
}));

vi.mock("../services/rabbitmqClient.js", () => ({ getRabbitMqChannel }));
vi.mock("../db/eventsRepository.js", () => ({ findEventReminderState, markReminderSent }));
vi.mock("../db/userPreferencesRepository.js", () => ({ findNotificationChannels }));
vi.mock("../integrations/firebase.js", () => ({ sendPushNotification }));
vi.mock("../config/logger.js", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("@project/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@project/shared")>();
  return { ...actual, computeReminderTime };
});
vi.mock("../services/reminderQueues.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/reminderQueues.js")>();
  return { ...actual, assertReminderQueues: vi.fn(), scheduleRetry, sendToDeadLetter };
});

const { startReminderConsumer } = await import("./reminderConsumer.js");
const { RETRY_BACKOFF_MS } = await import("../services/reminderQueues.js");

const EVENT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

// reminderMode null keeps the due gate on the job's reminderTime (no recompute) -
// individual tests set a mode to exercise the re-derivation path.
function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: EVENT_ID,
    mutedUntilArchive: false,
    reminder: true,
    dayOfWeek: 3,
    start: "09:00:00",
    reminderMode: null,
    reminderTime: null,
    reminderSentFor: null,
    ...overrides,
  };
}

function makeJob(overrides: Partial<ReminderJob> = {}): ReminderJob {
  return {
    eventId: EVENT_ID,
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
  findEventReminderState.mockResolvedValue(makeEvent());
  markReminderSent.mockResolvedValue(undefined);
  findNotificationChannels.mockResolvedValue(["browser"]);
  sendPushNotification.mockResolvedValue({ sent: 1, pruned: 0 });
});

describe("reminder consumer", () => {
  it("acks and skips when the event no longer exists", async () => {
    findEventReminderState.mockResolvedValue(null);
    const channel = await deliver(makeJob());
    expect(sendPushNotification).not.toHaveBeenCalled();
    expect(scheduleRetry).not.toHaveBeenCalled();
    expect(channel.ack).toHaveBeenCalledOnce();
  });

  it("acks and skips a muted event", async () => {
    findEventReminderState.mockResolvedValue(makeEvent({ mutedUntilArchive: true }));
    const channel = await deliver(makeJob());
    expect(sendPushNotification).not.toHaveBeenCalled();
    expect(channel.ack).toHaveBeenCalledOnce();
  });

  it("acks and skips when the reminder was disabled on the event after enqueue", async () => {
    findEventReminderState.mockResolvedValue(makeEvent({ reminder: false }));
    const channel = await deliver(makeJob());
    expect(sendPushNotification).not.toHaveBeenCalled();
    expect(scheduleRetry).not.toHaveBeenCalled();
    expect(channel.ack).toHaveBeenCalledOnce();
  });

  it("reschedules a not-yet-due reminder without sending", async () => {
    const job = makeJob({ reminderTime: new Date(Date.now() + 3_600_000).toISOString() });
    const channel = await deliver(job);
    expect(sendPushNotification).not.toHaveBeenCalled();
    expect(scheduleRetry).toHaveBeenCalledWith(channel, job, expect.any(Number), 0);
    expect(vi.mocked(scheduleRetry).mock.calls[0][2]).toBeGreaterThan(0);
  });

  it("uses the event's re-derived due instant, not the job's, when the event has a mode", async () => {
    // Job says far future, but the live event (edited) now resolves to the past → send.
    findEventReminderState.mockResolvedValue(makeEvent({ reminderMode: "time", reminderTime: "08:00:00" }));
    computeReminderTime.mockReturnValue(new Date(Date.now() - 1_000));
    const job = makeJob({ reminderTime: new Date(Date.now() + 3_600_000).toISOString() });
    const channel = await deliver(job);
    expect(computeReminderTime).toHaveBeenCalled();
    expect(sendPushNotification).toHaveBeenCalledOnce();
    expect(scheduleRetry).not.toHaveBeenCalled();
    expect(channel.ack).toHaveBeenCalledOnce();
  });

  it("skips when a push was already delivered for this exact slot", async () => {
    const due = new Date(Date.now() - 1_000);
    findEventReminderState.mockResolvedValue(
      makeEvent({ reminderMode: "time", reminderTime: "08:00:00", reminderSentFor: new Date(due) }),
    );
    computeReminderTime.mockReturnValue(due);
    const channel = await deliver(makeJob());
    expect(sendPushNotification).not.toHaveBeenCalled();
    expect(channel.ack).toHaveBeenCalledOnce();
  });

  it("sends a due reminder using the current notification channels and records the slot", async () => {
    const job = makeJob();
    const channel = await deliver(job);
    expect(sendPushNotification).toHaveBeenCalledWith({
      userId: job.userId,
      title: job.eventTitle,
      channels: ["browser"],
    });
    expect(markReminderSent).toHaveBeenCalledWith(job.eventId, expect.any(Date));
    expect(scheduleRetry).not.toHaveBeenCalled();
    expect(channel.ack).toHaveBeenCalledOnce();
  });

  it("uses the user's current channel preference, not the job's stale snapshot", async () => {
    // Job was enqueued while the channel was "mobile"; the user has since switched back
    // to "browser" - the send must go by the current preference, not the frozen job value.
    findNotificationChannels.mockResolvedValue(["browser"]);
    const job = makeJob({ channels: ["mobile"] });
    await deliver(job);
    expect(sendPushNotification).toHaveBeenCalledWith({
      userId: job.userId,
      title: job.eventTitle,
      channels: ["browser"],
    });
  });

  it("does not record a slot when there were no registered devices", async () => {
    sendPushNotification.mockResolvedValue({ sent: 0, pruned: 0 });
    const channel = await deliver(makeJob());
    expect(markReminderSent).not.toHaveBeenCalled();
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

  it("retries instead of dropping when a transient error (e.g. a DB/network blip) occurs", async () => {
    findEventReminderState.mockRejectedValue(new Error("getaddrinfo ENOTFOUND"));
    const job = makeJob();
    const channel = await deliver(job);
    expect(scheduleRetry).toHaveBeenCalledWith(channel, job, RETRY_BACKOFF_MS[0], 1);
    expect(sendToDeadLetter).not.toHaveBeenCalled();
    expect(channel.ack).toHaveBeenCalledOnce();
  });

  it("dead-letters (not drops) a transient error once retries are exhausted", async () => {
    findEventReminderState.mockRejectedValue(new Error("getaddrinfo ENOTFOUND"));
    const job = makeJob();
    const channel = await deliver(job, { "x-retry-count": RETRY_BACKOFF_MS.length });
    expect(sendToDeadLetter).toHaveBeenCalledWith(channel, job);
    expect(scheduleRetry).not.toHaveBeenCalled();
    expect(channel.ack).toHaveBeenCalledOnce();
  });

  it("drops a genuinely unparseable message without a job to retry", async () => {
    const channel = {
      prefetch: vi.fn().mockResolvedValue(undefined),
      consume: vi.fn(),
      ack: vi.fn(),
      sendToQueue: vi.fn(),
    } as unknown as Channel;
    getRabbitMqChannel.mockResolvedValue(channel);
    await startReminderConsumer();
    const onMessage = vi.mocked(channel.consume).mock.calls[0][1] as (msg: ConsumeMessage) => void;
    onMessage({ content: Buffer.from("not json"), properties: { headers: {} } } as unknown as ConsumeMessage);
    await vi.waitFor(() => expect(channel.ack).toHaveBeenCalled());
    expect(scheduleRetry).not.toHaveBeenCalled();
    expect(sendToDeadLetter).not.toHaveBeenCalled();
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
