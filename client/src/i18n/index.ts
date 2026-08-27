import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import he from "./he.json";

// Pre-auth fallback (SPEC.md §3): detect the browser's own language, defaulting to
// "he" when undetected or unsupported. Once signed in, `useAppLanguage` syncs this to
// the account's stored `UserPreferences.language` instead — language is no longer
// `localStorage`-only, so there's nothing to persist here pre-auth.
function detectBrowserLanguage(): "he" | "en" {
  return navigator.language?.slice(0, 2) === "en" ? "en" : "he";
}

void i18next.use(initReactI18next).init({
  resources: {
    he: { translation: he },
    en: { translation: en },
  },
  lng: detectBrowserLanguage(),
  fallbackLng: "he",
  interpolation: { escapeValue: false },
});

function syncDocumentDirection(language: string): void {
  document.documentElement.lang = language;
  document.documentElement.dir = i18next.dir(language);
}

syncDocumentDirection(i18next.language);
i18next.on("languageChanged", syncDocumentDirection);

export default i18next;
