import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { IntlProvider } from 'use-intl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import en from '@kropi/i18n/en.json';
import hi from '@kropi/i18n/hi.json';

export const LOCALES = ['en', 'hi'] as const;
export type Locale = (typeof LOCALES)[number];

const MESSAGES: Record<Locale, Record<string, unknown>> = { en, hi };
const STORAGE_KEY = 'kropigo.locale';

const isLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale);

/** Falls back to English for any device language we don't ship. */
const deviceLocale = (): Locale => {
  const code = getLocales()[0]?.languageCode;
  return isLocale(code) ? code : 'en';
};

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<Locale>(deviceLocale);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (isLocale(stored)) setLocaleState(stored);
    });
  }, []);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale: (next) => {
      setLocaleState(next);
      void AsyncStorage.setItem(STORAGE_KEY, next);
    },
  }), [locale]);

  return (
    <LocaleContext.Provider value={value}>
      <IntlProvider
        locale={locale}
        messages={MESSAGES[locale]}
        timeZone="Asia/Kolkata"
        // A missing key should show the key, not crash a farmer's screen.
        onError={() => undefined}
        getMessageFallback={({ key }) => key.split('.').pop() ?? key}
      >
        {children}
      </IntlProvider>
    </LocaleContext.Provider>
  );
}

export function useLocalePreference() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocalePreference must be used within LocaleProvider');
  return ctx;
}
