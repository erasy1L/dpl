import { LocalizedString, Category } from "../types/attraction.types";
import { getLocale } from "../paraglide/runtime.js";

/**
 * Get localized category name from API fields.
 */
export function getCategoryName(category: Category, preferredLocale?: string): string {
  const locale = preferredLocale ?? getCurrentLocale();
  if (locale === "ru" && category.name_ru) return category.name_ru;
  return category.name_en;
}

/**
 * Get localized text from a LocalizedString object (API content).
 * Falls back to first available language if preferred locale is not found.
 */
export function getLocalizedText(
  localizedString: LocalizedString | undefined,
  preferredLocale?: string,
): string {
  if (!localizedString || typeof localizedString !== "object") {
    return "";
  }

  const locale = preferredLocale ?? getCurrentLocale();

  // Try preferred locale
  if (localizedString[locale]) {
    return localizedString[locale];
  }

  // Try fallback locales in order: en, ru, kz
  const fallbackLocales = ["en", "ru", "kz"];
  for (const fallback of fallbackLocales) {
    if (localizedString[fallback]) {
      return localizedString[fallback];
    }
  }

  // Return first available value
  const values = Object.values(localizedString);
  return values.length > 0 ? values[0] : "";
}

/**
 * Get current UI locale from Paraglide (localStorage → browser → en).
 */
export function getCurrentLocale(): string {
  try {
    return getLocale();
  } catch {
    return "en";
  }
}
