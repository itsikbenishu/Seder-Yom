import admin from "firebase-admin";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { deleteDeviceTokens, findDeviceTokens } from "../db/pushDevicesRepository.js";

// Lazy init: a malformed FIREBASE_SERVICE_ACCOUNT_JSON should surface on first send
// (retryable, logged) rather than crash the whole worker at import time.
let app: admin.app.App | undefined;
function getApp(): admin.app.App {
  app ??= admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON) as admin.ServiceAccount),
  });
  return app;
}

// FCM error codes that mean this specific token is permanently dead — safe to
// delete. Deliberately excludes messaging/invalid-argument: that's a payload
// error, and pruning on it would wipe every token the moment a bad payload ships.
const PRUNE_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

const MULTICAST_LIMIT = 500;

interface SendPushNotificationInput {
  userId: string;
  title: string;
  body?: string;
  channels: string[];
}

export interface SendPushResult {
  sent: number;
  pruned: number;
}

export async function sendPushNotification(input: SendPushNotificationInput): Promise<SendPushResult> {
  const tokens = await findDeviceTokens(input.userId, input.channels);
  if (tokens.length === 0) {
    return { sent: 0, pruned: 0 };
  }

  const messaging = admin.messaging(getApp());
  const notification = { title: input.title, body: input.body };
  // Keep the notification on screen until dismissed — it auto-dismisses after a few seconds by default otherwise.
  const webpush: admin.messaging.WebpushConfig = { notification: { ...notification, requireInteraction: true } };

  let successCount = 0;
  const deadTokens: string[] = [];
  const failures: string[] = [];

  for (let i = 0; i < tokens.length; i += MULTICAST_LIMIT) {
    const batch = tokens.slice(i, i + MULTICAST_LIMIT);
    const res = await messaging.sendEachForMulticast({ tokens: batch, notification, webpush });
    successCount += res.successCount;

    res.responses.forEach((r, idx) => {
      if (r.success) return;
      const code = r.error?.code ?? "";
      if (PRUNE_CODES.has(code)) deadTokens.push(batch[idx]);
      else failures.push(`${code}: ${r.error?.message ?? "unknown"}`);
    });
  }

  if (deadTokens.length > 0) {
    await deleteDeviceTokens(deadTokens);
    logger.info({ userId: input.userId, pruned: deadTokens.length }, "Pruned unregistered device tokens");
  }

  // Surface the real FCM reason (credential/project mismatch, bad payload, etc.) — otherwise a failed send is opaque.
  if (failures.length > 0) {
    logger.warn({ userId: input.userId, failures: [...new Set(failures)] }, "FCM rejected one or more sends");
  }

  // Nothing got through and the failures weren't just dead tokens — let the
  // consumer retry / DLQ. A partial success counts as delivered.
  if (successCount === 0 && failures.length > 0) {
    throw new Error("All push sends failed with a retryable error");
  }

  return { sent: successCount, pruned: deadTokens.length };
}
