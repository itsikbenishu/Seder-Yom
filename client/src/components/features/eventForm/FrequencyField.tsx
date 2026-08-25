import { useTranslation } from "react-i18next";
import { allDayEventFrequencySchema, eventFrequencySchema, type EventFrequency } from "@project/shared";
import { SegmentedControl, type SegmentedControlOption } from "../../ui";
import type { FrequencyFieldProps } from "../../../types/eventForm";

const LABEL_KEYS: Record<EventFrequency, string> = {
  once: "eventForm.frequency.once",
  daily: "eventForm.frequency.daily",
  weekly: "eventForm.frequency.weekly",
};

/**
 * Frequency segmented control. Timed events offer once/daily/weekly;
 * all-day events offer daily/weekly only (no "once").
 */
export function FrequencyField({ allDay, value, onChange }: FrequencyFieldProps) {
  const { t } = useTranslation();
  const allowedValues = allDay ? allDayEventFrequencySchema.options : eventFrequencySchema.options;

  const options: SegmentedControlOption<EventFrequency>[] = allowedValues.map((frequency) => ({
    value: frequency,
    label: t(LABEL_KEYS[frequency]),
  }));

  return (
    <SegmentedControl<EventFrequency>
      options={options}
      value={value}
      onChange={onChange}
      aria-label={t("eventForm.frequency.label")}
    />
  );
}
