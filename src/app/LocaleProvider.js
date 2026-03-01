'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { IntlProvider } from 'react-intl';

import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

export const LocaleContext = createContext({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
});

export function useLocale() {
  return useContext(LocaleContext);
}

const LOCALE_STORAGE_KEY = 'pop-locale';

async function loadMessages(locale) {
  if (locale === 'fr') {
    const mod = await import('@/i18n/locale/fr.json');
    return mod.default ?? mod;
  }
  // English catalog — defaultMessage in code is source of truth, but load for completeness
  const mod = await import('@/i18n/locale/en.json');
  return mod.default ?? mod;
}

export default function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);
  const [messages, setMessages] = useState({});
  const [ready, setReady] = useState(false);

  // Initialise from localStorage on first render
  useEffect(() => {
    const stored = typeof window !== 'undefined' && localStorage.getItem(LOCALE_STORAGE_KEY);
    const initial = stored || DEFAULT_LOCALE;
    loadMessages(initial).then((msgs) => {
      setLocaleState(initial);
      setMessages(msgs);
      setReady(true);
    });
  }, []);

  const setLocale = (newLocale) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    }
    loadMessages(newLocale).then((msgs) => {
      setLocaleState(newLocale);
      setMessages(msgs);
    });
  };

  // Keep <html lang="..."> in sync
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
