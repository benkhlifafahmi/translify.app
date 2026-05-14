"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Dict, Testimonial, FaqItem } from "./locales/types";
import { en, enTestimonials, enFaq } from "./locales/en";
import { fr, frTestimonials, frFaq } from "./locales/fr";
import { es, esTestimonials, esFaq } from "./locales/es";
import { de, deTestimonials, deFaq } from "./locales/de";
import { ja, jaTestimonials, jaFaq } from "./locales/ja";
import { ar, arTestimonials, arFaq } from "./locales/ar";
import { id as idDict, idTestimonials, idFaq } from "./locales/id";
import { ms, msTestimonials, msFaq } from "./locales/ms";
import { zh, zhTestimonials, zhFaq } from "./locales/zh";

export type Locale = "en" | "fr" | "es" | "de" | "ja" | "ar" | "id" | "ms" | "zh";

export const LOCALES: { code: Locale; label: string; flag: string; dir: "ltr" | "rtl" }[] = [
  { code: "en", label: "English",           flag: "🇬🇧", dir: "ltr" },
  { code: "fr", label: "Français",          flag: "🇫🇷", dir: "ltr" },
  { code: "es", label: "Español",           flag: "🇪🇸", dir: "ltr" },
  { code: "de", label: "Deutsch",           flag: "🇩🇪", dir: "ltr" },
  { code: "ja", label: "日本語",              flag: "🇯🇵", dir: "ltr" },
  { code: "zh", label: "中文",                flag: "🇨🇳", dir: "ltr" },
  { code: "ar", label: "العربية",            flag: "🇸🇦", dir: "rtl" },
  { code: "id", label: "Bahasa Indonesia",  flag: "🇮🇩", dir: "ltr" },
  { code: "ms", label: "Bahasa Malaysia",   flag: "🇲🇾", dir: "ltr" },
];

const DICTS: Record<Locale, Dict> = {
  en, fr, es, de, ja, ar, id: idDict, ms, zh,
};

const TESTIMONIALS: Record<Locale, Testimonial[]> = {
  en: enTestimonials,
  fr: frTestimonials,
  es: esTestimonials,
  de: deTestimonials,
  ja: jaTestimonials,
  ar: arTestimonials,
  id: idTestimonials,
  ms: msTestimonials,
  zh: zhTestimonials,
};

const FAQS: Record<Locale, FaqItem[]> = {
  en: enFaq,
  fr: frFaq,
  es: esFaq,
  de: deFaq,
  ja: jaFaq,
  ar: arFaq,
  id: idFaq,
  ms: msFaq,
  zh: zhFaq,
};

interface I18nValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  testimonials: Testimonial[];
  faq: FaqItem[];
}

const I18nContext = createContext<I18nValue | null>(null);
const STORAGE_KEY = "translify.locale";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Highest priority: explicit ?lang= query param (search engines arriving
    // via hreflang alternates land here).
    const urlLang = new URLSearchParams(window.location.search).get("lang") as Locale | null;
    if (urlLang && DICTS[urlLang]) {
      setLocaleState(urlLang);
      try {
        window.localStorage.setItem(STORAGE_KEY, urlLang);
      } catch {
        // ignore
      }
      return;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && DICTS[stored]) {
      setLocaleState(stored);
      return;
    }
    if (typeof navigator !== "undefined") {
      const nav = navigator.language.slice(0, 2) as Locale;
      if (DICTS[nav]) setLocaleState(nav);
    }
  }, []);

  const dir: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = DICTS[locale] ?? en;
      let s = dict[key] ?? en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.replace(`%${k}%`, String(v));
        }
      }
      return s;
    },
    [locale],
  );

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      dir,
      setLocale,
      t,
      testimonials: TESTIMONIALS[locale] ?? enTestimonials,
      faq: FAQS[locale] ?? enFaq,
    }),
    [locale, dir, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export type { Testimonial, FaqItem } from "./locales/types";
