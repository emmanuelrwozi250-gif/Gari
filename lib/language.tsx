'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from '../messages/en.json';
import fr from '../messages/fr.json';
import rw from '../messages/rw.json';

export type Locale = 'en' | 'fr' | 'rw';

const MESSAGES: Record<Locale, Record<string, any>> = { en, fr, rw };

interface LanguageContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (namespace: string, key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (_ns, key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem('gari-locale') as Locale;
    if (saved && ['en', 'fr', 'rw'].includes(saved)) setLocaleState(saved);
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('gari-locale', l);
  };

  const t = useCallback((namespace: string, key: string, vars?: Record<string, string | number>): string => {
    const msg =
      MESSAGES[locale]?.[namespace]?.[key] ??
      MESSAGES.en?.[namespace]?.[key] ??
      key;
    if (!vars) return msg;
    return Object.entries(vars).reduce(
      (s, [k, v]) => s.replace(`{${k}}`, String(v)),
      msg
    );
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
