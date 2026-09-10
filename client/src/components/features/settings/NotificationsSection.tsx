import { useTranslation } from "react-i18next";
import { SegmentedControl } from "../../ui";
import { isMobileUserAgent } from "../../../utils/userAgent";
import type { NotificationChannel, NotificationsSectionProps } from "../../../types/settings";

export function NotificationsSection({ channel, onChange, permission, isPending }: NotificationsSectionProps) {
  const { t } = useTranslation();

  // Only one of these hints shows: blocked/unsupported permission wins, then a
  // channel that can't reach the current device (see SPEC.md §3, PushDevice).
  let hintKey = "settings.notifications.note";
  if (permission === "denied") hintKey = "settings.notifications.blocked";
  else if (permission === "unsupported") hintKey = "settings.notifications.unsupported";
  else if ((channel === "mobile") !== isMobileUserAgent()) hintKey = "settings.notifications.deviceMismatch";

  return (
    <div className="flex flex-col items-start gap-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
        {t("settings.notifications.label")}
      </p>
      <SegmentedControl<NotificationChannel>
        options={[
          { value: "browser", label: `🌐 ${t("settings.notifications.browser")}` },
          { value: "mobile", label: `📱 ${t("settings.notifications.mobile")}` },
        ]}
        value={channel}
        onChange={onChange}
        disabled={isPending}
        aria-label={t("settings.notifications.label")}
      />
      <p className="text-xs text-slate-500 dark:text-slate-400">{t(hintKey)}</p>
    </div>
  );
}
