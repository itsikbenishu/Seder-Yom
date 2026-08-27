import { useTranslation } from "react-i18next";
import { SegmentedControl } from "../../ui";
import type { AppLanguage, LanguageSectionProps } from "../../../types/settings";

export function LanguageSection({ language, onChange }: LanguageSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-start gap-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
        {t("settings.language.label")}
      </p>
      <SegmentedControl<AppLanguage>
        options={[
          { value: "he", label: t("settings.language.hebrew") },
          { value: "en", label: t("settings.language.english") },
        ]}
        value={language}
        onChange={onChange}
        aria-label={t("settings.language.label")}
      />
    </div>
  );
}
