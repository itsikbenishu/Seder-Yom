import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import he from "./he.json";

const LANGUAGE_STORAGE_KEY = "sederyom:language";

const persistedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
const initialLanguage = persistedLanguage === "he" || persistedLanguage === "en" ? persistedLanguage : "he";

void i18next.use(initReactI18next).init({
  resources: {
    he: { translation: he },
    en: { translation: en },
  },
  lng: initialLanguage,
  fallbackLng: "he",
  interpolation: { escapeValue: false },
});

function syncDocumentDirection(language: string): void {
  document.documentElement.lang = language;
  document.documentElement.dir = i18next.dir(language);
}

function persistLanguage(language: string): void {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

syncDocumentDirection(i18next.language);
i18next.on("languageChanged", syncDocumentDirection);
i18next.on("languageChanged", persistLanguage);

export default i18next;
