import admin from "firebase-admin";
import { env } from "../config/env.js";

const app = admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON) as admin.ServiceAccount),
});

interface SendPushNotificationInput {
  userId: string;
  title: string;
  body?: string;
}

// KNOWN GAP: there is no client-side FCM device-token registration anywhere in
// this codebase yet (no "subscribe this device" endpoint, no client FCM SDK
// setup). Sending to a per-user topic (`user-${userId}`) is still the
// correct, working FCM mechanism on the send side, and makes this consumer
// fully functional today — but a client would need to separately obtain an
// FCM token and call admin.messaging().subscribeToTopic(token, `user-${userId}`)
// (server-side, via a new endpoint) to actually start receiving these. That
// registration flow — and any per-platform (`channels`) routing, which would
// need per-token storage to target — is a separate, unbuilt piece of work,
// out of scope here.
export async function sendPushNotification(input: SendPushNotificationInput): Promise<void> {
  await admin.messaging(app).send({
    topic: `user-${input.userId}`,
    notification: { title: input.title, body: input.body },
  });
}
