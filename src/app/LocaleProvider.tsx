'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

import { IntlProvider } from 'react-intl';

import { DEFAULT_LOCALE, type Locale } from '@/frontend/helpers/locales';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
});

export function useLocale() {
  return useContext(LocaleContext);
}

const LOCALE_STORAGE_KEY = 'pop-locale';

async function loadMessages(locale: Locale): Promise<Record<string, string>> {
  if (locale === 'fr') {
    const mod = await import('@/frontend/i18n/locale/fr.json');
    return (mod.default ?? mod) as Record<string, string>;
  }
  const mod = await import('@/frontend/i18n/locale/en.json');
  return (mod.default ?? mod) as Record<string, string>;
}

export default function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = typeof window !== 'undefined' && localStorage.getItem(LOCALE_STORAGE_KEY);
    const initial = (stored || DEFAULT_LOCALE) as Locale;
    loadMessages(initial).then((msgs) => {
      setLocaleState(initial);
      setMessages(msgs);
      setReady(true);
    });
  }, []);

  const setLocale = (newLocale: Locale) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    }
    loadMessages(newLocale).then((msgs) => {
      setLocaleState(newLocale);
      setMessages(msgs);
    });
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  if (!ready) return null;

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <IntlProvider locale={locale} messages={messages} defaultLocale={DEFAULT_LOCALE}>
        {children}
      </IntlProvider>
    </LocaleContext.Provider>
  );
}
