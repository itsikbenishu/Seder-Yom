import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import he from "./he.json";

void i18next.use(initReactI18next).init({
  resources: {
    he: { translation: he },
    en: { translation: en },
  },
  lng: "he",
  fallbackLng: "he",
  interpolation: { escapeValue: false },
});

export default i18next;
