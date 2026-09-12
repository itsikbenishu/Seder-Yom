import { useEffect } from "react";
import { onMessage } from "firebase/messaging";
import { getMessagingIfSupported } from "../services/firebase";
import { syncPushRegistration } from "../services/pushRegistration";

// Mounted once, at the app root. Owns the two ambient push concerns so they can't
// be duplicated by a screen that also needs `enable()`: keeping an already-granted
// token current, and showing a foreground message as a real system notification.
export function usePushLifecycle(): void {
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      void syncPushRegistration(false).catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    getMessagingIfSupported()
      .then((messaging) => {
        if (!messaging) return;
        unsubscribe = onMessage(messaging, (payload) => {
          const title = payload.notification?.title;
          if (!title) return;
          // Foreground messages skip the SW's own notification display, so trigger it ourselves (system notification only, no toast, per user preference).
          void navigator.serviceWorker?.ready
            .then((registration) =>
              registration.showNotification(title, { body: payload.notification?.body, requireInteraction: true }),
            )
            .catch(() => undefined);
        });
      })
      .catch(() => undefined);
    return () => unsubscribe?.();
  }, []);
}
