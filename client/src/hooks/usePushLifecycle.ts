import { useEffect } from "react";
import { onMessage } from "firebase/messaging";
import { getMessagingIfSupported } from "../services/firebase";
import { syncPushRegistration } from "../services/pushRegistration";
import { useToast } from "./useToast";

// Mounted once, at the app root. Owns the two ambient push concerns so they can't
// be duplicated by a screen that also needs `enable()`: keeping an already-granted
// token current, and turning a foreground message into a toast.
export function usePushLifecycle(): void {
  const { showToast } = useToast();

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
          if (payload.notification?.title) showToast(payload.notification.title);
        });
      })
      .catch(() => undefined);
    return () => unsubscribe?.();
  }, [showToast]);
}
