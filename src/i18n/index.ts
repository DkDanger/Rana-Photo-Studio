import en from './en';
import hi from './hi';
import type { Language } from '../types';
export const translations = { en, hi };
export type TranslationKey = keyof typeof en;
export function getText(language: Language, key: TranslationKey): string {
  return translations[language][key] ?? translations.en[key];
}