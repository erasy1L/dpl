import { Globe } from "lucide-react";
import { useLocale } from "../../contexts/LocaleContext";
import { localeLabels, supportedLocales, type AppLocale } from "../../i18n/locale";
import * as m from "../../paraglide/messages.js";

const LanguageSwitcher = () => {
  const { locale, setAppLocale } = useLocale();

  return (
    <label className="flex items-center gap-1.5 text-sm text-gray-600">
      <Globe className="h-4 w-4 shrink-0" aria-hidden />
      <span className="sr-only">{m.language_label()}</span>
      <select
        value={locale}
        onChange={(e) => setAppLocale(e.target.value as AppLocale)}
        className="rounded-lg border border-gray-200 bg-white py-1.5 pl-2 pr-7 text-sm text-gray-800 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
        aria-label={m.language_label()}
      >
        {supportedLocales.map((code) => (
          <option key={code} value={code}>
            {localeLabels[code]()}
          </option>
        ))}
      </select>
    </label>
  );
};

export default LanguageSwitcher;
