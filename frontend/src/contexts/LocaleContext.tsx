import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getLocale,
  setLocale,
  type Locale,
} from "../paraglide/runtime.js";

type LocaleContextValue = {
  locale: Locale;
  setAppLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getLocale());

  const setAppLocale = useCallback((next: Locale) => {
    setLocale(next, { reload: false });
    document.documentElement.lang = next;
    setLocaleState(next);
  }, []);

  const value = useMemo(
    () => ({ locale, setAppLocale }),
    [locale, setAppLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
