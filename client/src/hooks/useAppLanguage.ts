import { useTranslation } from "react-i18next";
import type { AppLanguage } from "../types/settings";

export function useAppLanguage(): { language: AppLanguage; setLanguage: (language: AppLanguage) => void } {
  const { i18n } = useTranslation();

  return {
    language: i18n.language as AppLanguage,
    setLanguage: (language) => {
      void i18n.changeLanguage(language);
    },
  };
}
