import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { syncPushRegistration, type PushPermission } from "../services/pushRegistration";
import { useToast } from "./useToast";

export type { PushPermission };

// Settings-screen view of push registration: the current permission and an
// `enable()` for the segmented-control gesture (it may prompt). The ambient
// concerns — silent refresh, foreground listener — live in usePushLifecycle.
export function usePushRegistration(): { permission: PushPermission; enable: () => void } {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [permission, setPermission] = useState<PushPermission>(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission,
  );

  const enable = useCallback(() => {
    syncPushRegistration(true)
      .then(setPermission)
      .catch(() => showToast(t("settings.notifications.enableError"), "error"));
  }, [showToast, t]);

  return { permission, enable };
}
