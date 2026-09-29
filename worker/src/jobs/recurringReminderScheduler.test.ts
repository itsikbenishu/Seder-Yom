import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Channel } from "amqplib";
import type { ReminderJob } from "@project/shared";

const { getRabbitMqChannel, findActiveReminderEvents, findNotificationChannels, computeReminderTime } = vi.hoisted(() => ({
  getRabbitMqChannel: vi.fn(),
  findActiveReminderEvents: vi.fn(),
  findNotificationChannels: vi.fn(),
  computeReminderTime: vi.fn(),
}));

vi.mock("../services/rabbitmqClient.js", () => ({ getRabbitMqChannel }));
vi.mock("../db/eventsRepository.js", () => ({ findActiveReminderEvents }));
vi.mock("../db/userPreferencesRepository.js", () => ({ findNotificationChannels }));
vi.mock("../config/logger.js", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("@project/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@project/shared")>();
  return { ...actual, computeReminderTime };
});

const { runRecurringReminderScheduler } = await import("./recurringReminderScheduler.js");

const EVENT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: EVENT_ID,
    userId: USER_ID,
    title: "Standup",
    dayOfWeek: 3,
    start: "09:00:00",
    reminderMode: "15m",
    reminderTime: null,
    reminderSentFor: null,
    ...overrides,
  };
}

function makeChannel(): Channel {
  return { sendToQueue: vi.fn() } as unknown as Channel;
}

beforeEach(() => {
  vi.clearAllMocks();
  findNotificationChannels.mockResolvedValue(["browser"]);
});

describe("runRecurringReminderScheduler", () => {
  it("skips a candidate already delivered for its exact computed instant", async () => {
    const due = new Date(Date.now() + 60_000);
    findActiveReminderEvents.mockResolvedValue([makeEvent({ reminderSentFor: due })]);
    computeReminderTime.mockReturnValue(due);
    const channel = makeChannel();
    getRabbitMqChannel.mockResolvedValue(channel);

    await runRecurringReminderScheduler();

    expect(channel.sendToQueue).not.toHaveBeenCalled();
  });

  it("skips a candidate whose due instant is beyond the enqueue window", async () => {
    const due = new Date(Date.now() + 48 * 60 * 60_000); // 48h out, past the 26h window
    findActiveReminderEvents.mockResolvedValue([makeEvent()]);
    computeReminderTime.mockReturnValue(due);
    const channel = makeChannel();
    getRabbitMqChannel.mockResolvedValue(channel);

    await runRecurringReminderScheduler();

    expect(channel.sendToQueue).not.toHaveBeenCalled();
  });

  it("publishes a candidate due soon, using freshly-looked-up notification channels", async () => {
    const due = new Date(Date.now() + 60_000);
    findActiveReminderEvents.mockResolvedValue([makeEvent()]);
    computeReminderTime.mockReturnValue(due);
    findNotificationChannels.mockResolvedValue(["mobile"]);
    const channel = makeChannel();
    getRabbitMqChannel.mockResolvedValue(channel);

    await runRecurringReminderScheduler();

    expect(findNotificationChannels).toHaveBeenCalledWith(USER_ID);
    expect(channel.sendToQueue).toHaveBeenCalledOnce();
    const [queueName, payload] = vi.mocked(channel.sendToQueue).mock.calls[0];
    expect(queueName).toBe("notification_reminders");
    const job = JSON.parse(payload.toString()) as ReminderJob;
    expect(job).toMatchObject({
      eventId: EVENT_ID,
      userId: USER_ID,
      eventTitle: "Standup",
      channels: ["mobile"],
      status: "pending",
    });
  });

  it("publishes a candidate that's already past due", async () => {
    const due = new Date(Date.now() - 60_000);
    findActiveReminderEvents.mockResolvedValue([makeEvent()]);
    computeReminderTime.mockReturnValue(due);
    const channel = makeChannel();
    getRabbitMqChannel.mockResolvedValue(channel);

    await runRecurringReminderScheduler();

    expect(channel.sendToQueue).toHaveBeenCalledOnce();
  });
});
