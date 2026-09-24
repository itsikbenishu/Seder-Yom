import { useTranslation } from "react-i18next";

export function GoogleSyncedBadge() {
  const { t } = useTranslation();
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-300 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-slate-600 dark:text-slate-300">
      {t("day.event.googleSynced")}
      <span aria-hidden="true">🔒</span>
    </span>
  );
}
