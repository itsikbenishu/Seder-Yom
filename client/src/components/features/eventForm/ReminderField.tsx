import { useTranslation } from "react-i18next";
import type { ReminderMode } from "@project/shared";
import { Button, Input, SegmentedControl, type SegmentedControlOption } from "../../ui";
import type { ReminderFieldProps } from "../../../types/eventForm";

/** Fallback used only to keep the segmented control's `value` prop defined before the user has picked a mode. */
const DEFAULT_MODE: ReminderMode = "15m";

/**
 * Reminder on/off + mode control. Timed events choose an offset
 * (15m/30m/1h/1d) or a fixed clock-time ("time"); all-day events are always
 * effectively "time" — only the clock-time input is shown, no offset picker.
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

  const modeOptions: SegmentedControlOption<ReminderMode>[] = [
    { value: "15m", label: t("eventForm.reminder.lead15m") },
    { value: "30m", label: t("eventForm.reminder.lead30m") },
    { value: "1h", label: t("eventForm.reminder.lead1h") },
    { value: "1d", label: t("eventForm.reminder.lead1d") },
    { value: "time", label: t("eventForm.reminder.leadTime") },
  ];

  const showTimeInput = reminder && (allDay || reminderMode === "time");

  return (
    <div className="flex flex-col gap-3">
      <Button
        variant={reminder ? "primary" : "secondary"}
        aria-pressed={reminder}
        onClick={() => onReminderChange(!reminder)}
      >
        {t("eventForm.reminder.toggleLabel")}
      </Button>

      {reminder && (
        <div className="flex flex-col gap-2">
          {!allDay && (
            <SegmentedControl
              aria-label={t("eventForm.reminder.leadLabel")}
              options={modeOptions}
              value={reminderMode ?? DEFAULT_MODE}
              onChange={onReminderModeChange}
            />
          )}

          {showTimeInput && (
            <Input
              type="time"
              label={t("eventForm.reminder.timeLabel")}
              value={reminderTime ?? ""}
              onChange={(event) => onReminderTimeChange(event.target.value)}
            />
          )}
        </div>
      )}
    </div>
  );
}
