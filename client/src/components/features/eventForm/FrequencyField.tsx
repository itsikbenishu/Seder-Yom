import { useTranslation } from "react-i18next";
import { allDayEventFrequencySchema, eventFrequencySchema, type EventFrequency } from "@project/shared";
import { SegmentedControl, type SegmentedControlOption } from "../../ui";
import type { FrequencyFieldProps } from "../../../types/eventForm";

const LABEL_KEYS: Record<EventFrequency, string> = {
  once: "eventForm.frequency.once",
  daily: "eventForm.frequency.daily",
  weekly: "eventForm.frequency.weekly",
};

/** Frequency segmented control - both timed and all-day events offer once/daily/weekly. */
export function FrequencyField({ allDay, value, onChange }: FrequencyFieldProps) {
  const { t } = useTranslation();
  const allowedValues = allDay ? allDayEventFrequencySchema.options : eventFrequencySchema.options;

  const options: SegmentedControlOption<EventFrequency>[] = allowedValues.map((frequency) => ({
    value: frequency,
    label: t(LABEL_KEYS[frequency]),
  }));

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{t("eventForm.frequency.label")}</p>
      <SegmentedControl<EventFrequency>
        options={options}
        value={value}
        onChange={onChange}
        aria-label={t("eventForm.frequency.label")}
      />
    </div>
  );
}
