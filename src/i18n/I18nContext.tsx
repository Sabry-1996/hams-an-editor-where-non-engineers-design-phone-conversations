import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { UiLang } from '../types/flow';
import { translate, type MessageKey } from './messages';

interface I18nValue {
  lang: UiLang;
  dir: 'rtl' | 'ltr';
  setLang: (lang: UiLang) => void;
  toggleLang: () => void;
  t: (key: MessageKey, params?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<UiLang>('ar');

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const value = useMemo<I18nValue>(() => ({
    lang,
    dir: lang === 'ar' ? 'rtl' : 'ltr',
    setLang,
    toggleLang: () => setLang(current => (current === 'ar' ? 'en' : 'ar')),
    t: (key, params) => translate(lang, key, params)
  }), [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>');
  return ctx;
}
