import { locales, type Locale } from "../paraglide/runtime.js";

export type AppLocale = Locale;

export const supportedLocales = locales;

export const localeLabels: Record<AppLocale, () => string> = {
  en: () => "English",
  ru: () => "Русский",
  kz: () => "Қазақша",
};

export function isAppLocale(value: string): value is AppLocale {
  return (supportedLocales as readonly string[]).includes(value);
}
