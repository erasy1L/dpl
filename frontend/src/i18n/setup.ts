import { getLocale } from "../paraglide/runtime.js";

/** Sync `<html lang>` with the active Paraglide locale on startup. */
export function initializeI18n(): void {
  document.documentElement.lang = getLocale();
}
