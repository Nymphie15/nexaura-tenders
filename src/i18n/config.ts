import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import des traductions
import frCommon from "./locales/fr/common.json";
import frValidation from "./locales/fr/validation.json";
import frWorkflow from "./locales/fr/workflow.json";
import enCommon from "./locales/en/common.json";
import enValidation from "./locales/en/validation.json";
import enWorkflow from "./locales/en/workflow.json";

export const defaultNS = "common";
export const resources = {
  fr: {
    common: frCommon,
    validation: frValidation,
    workflow: frWorkflow,
  },
  en: {
    common: enCommon,
    validation: enValidation,
    workflow: enWorkflow,
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS,
    fallbackLng: "fr",
    supportedLngs: ["fr", "en"],
    
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },
    
    interpolation: {
      escapeValue: false, // React already escapes
    },
    
    react: {
      useSuspense: true,
    },
  });

export default i18n;
