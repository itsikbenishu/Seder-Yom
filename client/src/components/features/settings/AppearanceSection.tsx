import { useTranslation } from "react-i18next";
import { SegmentedControl } from "../../ui";
import type { AppTheme, AppearanceSectionProps } from "../../../types/settings";

export function AppearanceSection({ theme, onChange }: AppearanceSectionProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-start gap-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
        {t("settings.appearance.label")}
      </p>
      <SegmentedControl<AppTheme>
        options={[
          { value: "light", label: t("settings.appearance.light") },
          { value: "dark", label: t("settings.appearance.dark") },
          { value: "system", label: t("settings.appearance.system") },
        ]}
        value={theme}
        onChange={onChange}
        aria-label={t("settings.appearance.label")}
      />
    </div>
  );
}
