import { useCallback, useEffect, useState } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { useTranslation } from "react-i18next";
import type { DevicePlatform } from "@project/shared";
import { firebaseSwUrl, firebaseVapidKey, getMessagingIfSupported } from "../services/firebase";
import { PUSH_TOKEN_STORAGE_KEY, registerPushDevice } from "../services/pushDevices.api";
import { useToast } from "./useToast";

export type PushPermission = NotificationPermission | "unsupported";

function currentPlatform(): DevicePlatform {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "mobile" : "browser";
}

// Encapsulates the whole FCM registration dance: permission -> service worker ->
// token -> POST /devices. `enable()` is for a user gesture (it may prompt);
// mounting the hook also silently refreshes an already-granted token.
export function usePushRegistration(): { permission: PushPermission; enable: () => void } {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [permission, setPermission] = useState<PushPermission>(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission,
  );

  const register = useCallback(async (mayPrompt: boolean): Promise<void> => {
    const messaging = await getMessagingIfSupported();
    if (!messaging) {
      setPermission("unsupported");
      return;
    }

    let perm = Notification.permission;
    if (perm === "default" && mayPrompt) perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== "granted") return;

    const serviceWorkerRegistration = await navigator.serviceWorker.register(firebaseSwUrl);
    const token = await getToken(messaging, { vapidKey: firebaseVapidKey, serviceWorkerRegistration });
    if (!token || localStorage.getItem(PUSH_TOKEN_STORAGE_KEY) === token) return;

    await registerPushDevice({ token, platform: currentPlatform() });
    localStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
  }, []);

  const enable = useCallback(() => {
    register(true).catch(() => showToast(t("settings.notifications.enableError"), "error"));
  }, [register, showToast, t]);

  // Not data fetching — a side effect that keeps the stored token current when
  // permission is already granted (new device, reinstalled SW, rotated token).
  // Wrapped in an async task so any setState lands after an await, not during
  // the effect's synchronous pass.
  useEffect(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    void (async () => {
      await register(false).catch(() => undefined);
    })();
  }, [register]);

  // Foreground messages don't raise an OS notification — surface them as a toast.
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    getMessagingIfSupported()
      .then((messaging) => {
        if (!messaging) return;
        unsubscribe = onMessage(messaging, (payload) => {
          if (payload.notification?.title) showToast(payload.notification.title);
        });
      })
      .catch(() => undefined);
    return () => unsubscribe?.();
  }, [showToast]);

  return { permission, enable };
}
