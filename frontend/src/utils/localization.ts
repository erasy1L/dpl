import { LocalizedString } from "../types/attraction.types";

/**
 * Get localized text from a LocalizedString object
 * Falls back to first available language if preferred locale is not found
 */
export function getLocalizedText(
  localizedString: LocalizedString | undefined,
  preferredLocale: string = "en",
): string {
  if (!localizedString || typeof localizedString !== "object") {
    return "";
  }

  // Try preferred locale
  if (localizedString[preferredLocale]) {
    return localizedString[preferredLocale];
  }

  // Try fallback locales in order: en, ru, kz
  const fallbackLocales = ["en", "ru", "kz"];
  for (const locale of fallbackLocales) {
    if (localizedString[locale]) {
      return localizedString[locale];
    }
  }

  // Return first available value
  const values = Object.values(localizedString);
  return values.length > 0 ? values[0] : "";
}

/**
 * Get current locale from browser or default to 'en'
 */
export function getCurrentLocale(): string {
  // You can extend this to read from localStorage, context, or browser settings
  const browserLang = navigator.language.split("-")[0];
  const supportedLocales = ["en", "ru", "kz"];
  return supportedLocales.includes(browserLang) ? browserLang : "en";
}
