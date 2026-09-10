import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendEachForMulticast, findDeviceTokens, deleteDeviceTokens } = vi.hoisted(() => ({
  sendEachForMulticast: vi.fn(),
  findDeviceTokens: vi.fn(),
  deleteDeviceTokens: vi.fn(),
}));

vi.mock("firebase-admin", () => ({
  default: {
    initializeApp: vi.fn(() => ({})),
    credential: { cert: vi.fn(() => ({})) },
    messaging: vi.fn(() => ({ sendEachForMulticast })),
  },
}));
vi.mock("../db/pushDevicesRepository.js", () => ({ findDeviceTokens, deleteDeviceTokens }));
vi.mock("../config/env.js", () => ({ env: { FIREBASE_SERVICE_ACCOUNT_JSON: "{}" } }));
vi.mock("../config/logger.js", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const { sendPushNotification } = await import("./firebase.js");

const input = { userId: "u1", title: "Standup", channels: ["browser"] };
const ok = { success: true as const };
const fail = (code: string) => ({ success: false as const, error: { code } });

function batchResponse(responses: Array<{ success: boolean }>) {
  return {
    successCount: responses.filter((r) => r.success).length,
    failureCount: responses.filter((r) => !r.success).length,
    responses,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  deleteDeviceTokens.mockResolvedValue(undefined);
});

describe("sendPushNotification", () => {
  it("does nothing when the user has no registered tokens", async () => {
    findDeviceTokens.mockResolvedValue([]);
    await expect(sendPushNotification(input)).resolves.toBeUndefined();
    expect(sendEachForMulticast).not.toHaveBeenCalled();
  });

  it("sends and prunes nothing when every token succeeds", async () => {
    findDeviceTokens.mockResolvedValue(["t1", "t2"]);
    sendEachForMulticast.mockResolvedValue(batchResponse([ok, ok]));
    await expect(sendPushNotification(input)).resolves.toBeUndefined();
    expect(deleteDeviceTokens).not.toHaveBeenCalled();
  });

  it("prunes a token FCM reports as unregistered", async () => {
    findDeviceTokens.mockResolvedValue(["t1", "t2"]);
    sendEachForMulticast.mockResolvedValue(batchResponse([ok, fail("messaging/registration-token-not-registered")]));
    await sendPushNotification(input);
    expect(deleteDeviceTokens).toHaveBeenCalledWith(["t2"]);
  });

  it("does NOT prune on messaging/invalid-argument (payload error, not a dead token)", async () => {
    findDeviceTokens.mockResolvedValue(["t1"]);
    sendEachForMulticast.mockResolvedValue(batchResponse([fail("messaging/invalid-argument")]));
    await expect(sendPushNotification(input)).rejects.toThrow();
    expect(deleteDeviceTokens).not.toHaveBeenCalled();
  });

  it("throws when nothing got through on a transient error", async () => {
    findDeviceTokens.mockResolvedValue(["t1", "t2"]);
    sendEachForMulticast.mockResolvedValue(
      batchResponse([fail("messaging/internal-error"), fail("messaging/internal-error")]),
    );
    await expect(sendPushNotification(input)).rejects.toThrow();
  });

  it("treats a partial success as delivered (no throw)", async () => {
    findDeviceTokens.mockResolvedValue(["t1", "t2"]);
    sendEachForMulticast.mockResolvedValue(batchResponse([ok, fail("messaging/internal-error")]));
    await expect(sendPushNotification(input)).resolves.toBeUndefined();
  });
});
