import { useTranslation } from "react-i18next";
import type { ReminderMode } from "@project/shared";
import { Button, DropdownMenu, Input, SegmentedControl, type DropdownMenuItem } from "../../ui";
import type { ReminderFieldProps } from "../../../types/eventForm";

/** Fallback used only to keep the dropdown's label defined before the user has picked a mode. */
const DEFAULT_MODE: ReminderMode = "15m";

type ReminderEnabled = "off" | "on";

/**
 * Reminder on/off + mode control. Timed events pick an offset (dropdown, since a 5-way
 * segmented control doesn't fit next to Frequency) or a fixed clock-time ("time");
 * all-day events are always effectively "time" - only the clock-time input is shown.
 * Mirrors FrequencyField's visible-label-above-control pattern, not a self-labeling toggle.
 */
export function ReminderField({
  allDay,
  reminder,
  reminderMode,
  reminderTime,
  onReminderChange,
  onReminderModeChange,
  onReminderTimeChange,
}: ReminderFieldProps) {
  const { t } = useTranslation();

  const modeLabels: Record<ReminderMode, string> = {
    "15m": t("eventForm.reminder.lead15m"),
    "30m": t("eventForm.reminder.lead30m"),
    "1h": t("eventForm.reminder.lead1h"),
    "1d": t("eventForm.reminder.lead1d"),
    time: t("eventForm.reminder.leadTime"),
  };

  const modeItems: DropdownMenuItem<ReminderMode>[] = (["15m", "30m", "1h", "1d", "time"] as const).map((mode) => ({
    value: mode,
    label: modeLabels[mode],
  }));

  const showTimeInput = reminder && (allDay || reminderMode === "time");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{t("eventForm.reminder.toggleLabel")}</p>
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <SegmentedControl<ReminderEnabled>
            options={[
              { value: "off", label: t("eventForm.reminder.off") },
              { value: "on", label: t("eventForm.reminder.on") },
            ]}
            value={reminder ? "on" : "off"}
            onChange={(value) => onReminderChange(value === "on")}
            aria-label={t("eventForm.reminder.toggleLabel")}
          />

          {reminder && !allDay && (
            <DropdownMenu<ReminderMode>
              items={modeItems}
              onSelect={onReminderModeChange}
              align="start"
              aria-label={t("eventForm.reminder.leadLabel")}
              trigger={
                <Button variant="secondary" className="justify-between gap-2 whitespace-nowrap">
                  {modeLabels[reminderMode ?? DEFAULT_MODE]}
                  <span aria-hidden="true">⌄</span>
                </Button>
              }
            />
          )}
        </div>
      </div>

      {showTimeInput && (
        <Input
          type="time"
          label={t("eventForm.reminder.timeLabel")}
          value={reminderTime ?? ""}
          onChange={(event) => onReminderTimeChange(event.target.value)}
        />
      )}
    </div>
  );
}
