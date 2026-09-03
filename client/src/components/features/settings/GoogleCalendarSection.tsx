import { useTranslation } from "react-i18next";
import { Button, SegmentedControl } from "../../ui";
import type { GoogleCalendarSectionProps } from "../../../types/settings";

type ConnectedState = "on" | "off";

export function GoogleCalendarSection({ status, onToggleConnected, onReconnect, isPending }: GoogleCalendarSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-start gap-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
        {t("settings.googleCalendar.label")}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl<ConnectedState>
          options={[
            { value: "off", label: t("settings.googleCalendar.off") },
            { value: "on", label: t("settings.googleCalendar.on") },
          ]}
          value={status.connected ? "on" : "off"}
          onChange={(value) => onToggleConnected(value === "on")}
          disabled={isPending}
          aria-label={t("settings.googleCalendar.label")}
        />
        <Button variant="secondary" onClick={onReconnect} disabled={isPending}>
          <span aria-hidden="true">🔄</span>
          {t("settings.googleCalendar.reconnect")}
        </Button>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{t("settings.googleCalendar.note")}</p>
    </div>
  );
}
