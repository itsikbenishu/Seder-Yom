import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { AppLanguage } from "@project/shared";
import { hasNoSession } from "../services/queryClient";
import { useUserPreferences } from "./useUserPreferences";
import { useUpdateUserPreferencesMutation } from "./useUpdateUserPreferencesMutation";

/** Account-level once signed in; falls back to the browser's own detected language before that. */
export function useAppLanguage(): {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  isPending: boolean;
} {
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
      if (hasNoSession()) return; // no account to save it to yet — applied locally only
      updateMutation.mutate({ language });
    },
    isPending: updateMutation.isPending,
  };
}
