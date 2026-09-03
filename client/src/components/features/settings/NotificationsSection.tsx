import { useTranslation } from "react-i18next";
import { SegmentedControl } from "../../ui";
import type { NotificationChannel, NotificationsSectionProps } from "../../../types/settings";

export function NotificationsSection({ channel, onChange, isPending }: NotificationsSectionProps) {
  const { t } = useTranslation();
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
      <p className="text-xs text-slate-500 dark:text-slate-400">{t("settings.notifications.note")}</p>
    </div>
  );
}
