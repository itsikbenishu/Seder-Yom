import { initializeApp, type FirebaseApp } from "firebase/app";
import { getMessaging, isSupported, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseVapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

// The service worker reads its config from these query params (see the file in
// public/) so the values live only in .env, not duplicated in the worker script.
export const firebaseSwUrl = `/firebase-messaging-sw.js?${new URLSearchParams({
  apiKey: firebaseConfig.apiKey ?? "",
  projectId: firebaseConfig.projectId ?? "",
  messagingSenderId: firebaseConfig.messagingSenderId ?? "",
  appId: firebaseConfig.appId ?? "",
}).toString()}`;

let app: FirebaseApp | undefined;
let messaging: Messaging | null | undefined;

// Resolves to null where the browser can't do web push (old Safari, no SW support)
// or Firebase config is missing — callers treat that as "notifications unavailable".
export async function getMessagingIfSupported(): Promise<Messaging | null> {
  if (messaging !== undefined) return messaging;

  if (!firebaseConfig.appId || !firebaseVapidKey || !(await isSupported())) {
    messaging = null;
    return messaging;
  }

  app ??= initializeApp(firebaseConfig);
  messaging = getMessaging(app);
  return messaging;
}
