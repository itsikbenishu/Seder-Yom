import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { AppLanguage } from "@project/shared";
import { useUserPreferences } from "./useUserPreferences";
import { useUpdateUserPreferencesMutation } from "./useUpdateUserPreferencesMutation";

/**
 * Account-level preference — the server is the source of truth once
 * signed in. Before that (or if the fetch fails), `i18n.language` already resolved to
 * the browser's own language via i18next's own detection, so there's nothing to fall
 * back to here beyond just leaving it alone.
 */
export function useAppLanguage(): { language: AppLanguage; setLanguage: (language: AppLanguage) => void } {
  const { i18n } = useTranslation();
  const { data } = useUserPreferences();
  const updateMutation = useUpdateUserPreferencesMutation();

  useEffect(() => {
    if (data?.language && data.language !== i18n.language) {
      void i18n.changeLanguage(data.language);
    }
  }, [data?.language, i18n]);

  return {
    language: (data?.language ?? i18n.language) as AppLanguage,
    setLanguage: (language) => {
      void i18n.changeLanguage(language);
      updateMutation.mutate({ language });
    },
  };
}
