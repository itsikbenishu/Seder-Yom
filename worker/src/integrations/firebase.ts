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

// FCM error codes that mean the token is permanently dead — safe to delete.
const PRUNE_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
]);

const MULTICAST_LIMIT = 500;

interface SendPushNotificationInput {
  userId: string;
  title: string;
  body?: string;
  channels: string[];
}

export async function sendPushNotification(input: SendPushNotificationInput): Promise<void> {
  const tokens = await findDeviceTokens(input.userId, input.channels);
  if (tokens.length === 0) {
    logger.info({ userId: input.userId, channels: input.channels }, "Push skipped: no registered devices");
    return;
  }

  const messaging = admin.messaging(getApp());
  const notification = { title: input.title, body: input.body };

  let successCount = 0;
  const deadTokens: string[] = [];
  let transientFailure = false;

  for (let i = 0; i < tokens.length; i += MULTICAST_LIMIT) {
    const batch = tokens.slice(i, i + MULTICAST_LIMIT);
    const res = await messaging.sendEachForMulticast({ tokens: batch, notification });
    successCount += res.successCount;

    res.responses.forEach((r, idx) => {
      if (r.success) return;
      const code = r.error?.code ?? "";
      if (PRUNE_CODES.has(code)) deadTokens.push(batch[idx]);
      else transientFailure = true;
    });
  }

  if (deadTokens.length > 0) {
    await deleteDeviceTokens(deadTokens);
    logger.info({ userId: input.userId, pruned: deadTokens.length }, "Pruned unregistered device tokens");
  }

  // Nothing got through and the failures weren't just dead tokens — let the
  // consumer retry / DLQ. A partial success counts as delivered.
  if (successCount === 0 && transientFailure) {
    throw new Error("All push sends failed with a retryable error");
  }
}
