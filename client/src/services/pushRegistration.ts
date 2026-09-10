import { getToken } from "firebase/messaging";
import type { DevicePlatform } from "@project/shared";
import { isMobileUserAgent } from "../utils/userAgent";
import { firebaseSwUrl, firebaseVapidKey, getMessagingIfSupported } from "./firebase";
import { PUSH_TOKEN_STORAGE_KEY, registerPushDevice } from "./pushDevices.api";

export type PushPermission = NotificationPermission | "unsupported";

function currentPlatform(): DevicePlatform {
  return isMobileUserAgent() ? "mobile" : "browser";
}

// The full flow: permission -> service worker -> token -> POST /devices. Returns
// the resulting permission so callers can reflect it in the UI. `mayPrompt` gates
// the OS permission dialog to a real user gesture; pass false for a silent refresh.
export async function syncPushRegistration(mayPrompt: boolean): Promise<PushPermission> {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return "unsupported";

  let permission = Notification.permission;
  if (permission === "default" && mayPrompt) permission = await Notification.requestPermission();
  if (permission !== "granted") return permission;

  await navigator.serviceWorker.register(firebaseSwUrl);
  // register() can resolve while the worker is still installing; getToken() then
  // subscribes against an inactive registration and throws. Wait for the active one.
  const serviceWorkerRegistration = await navigator.serviceWorker.ready;

  const token = await getToken(messaging, { vapidKey: firebaseVapidKey, serviceWorkerRegistration });
  if (token && localStorage.getItem(PUSH_TOKEN_STORAGE_KEY) !== token) {
    await registerPushDevice({ token, platform: currentPlatform() });
    localStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
  }
  return "granted";
}
