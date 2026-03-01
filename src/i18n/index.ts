/**
 * i18n Module - Internationalization System
 * 
 * This module initializes and exports the i18next configuration
 * for the Appel d'Offre Automation application.
 * 
 * Supported Languages:
 * - French (fr) - Default
 * - English (en)
 * 
 * Namespaces:
 * - common: General UI translations
 * - validation: Form validation messages
 * - workflow: Tender workflow specific translations
 */

import i18n from "./config";

// Re-export everything from config
export { resources, defaultNS } from "./config";

// Export the initialized i18n instance
export default i18n;

// Type definitions for translation keys
export type SupportedLanguage = "fr" | "en";
export type TranslationNamespace = "common" | "validation" | "workflow";

// Language utilities
export const supportedLanguages: SupportedLanguage[] = ["fr", "en"];

export const languageNames: Record<SupportedLanguage, string> = {
  fr: "Français",
  en: "English",
};

/**
 * Get the current language
 */
export const getCurrentLanguage = (): SupportedLanguage => {
  return i18n.language as SupportedLanguage;
};

/**
 * Change the current language
 */
export const changeLanguage = async (lang: SupportedLanguage): Promise<void> => {
  await i18n.changeLanguage(lang);
};

/**
 * Check if a language is supported
 */
export const isLanguageSupported = (lang: string): lang is SupportedLanguage => {
  return supportedLanguages.includes(lang as SupportedLanguage);
};
