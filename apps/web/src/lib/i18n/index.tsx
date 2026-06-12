"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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
import { LanguageChoiceModal } from "@/components/language-choice-modal";
import { browserLocale, detectGeoLocale } from "@/lib/geo";

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

function interpolate(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s;
  for (const [k, v] of Object.entries(vars)) {
    s = s.replace(`%${k}%`, String(v));
  }
  return s;
}

/** Look up a key in a specific locale, falling back to English then the key. */
export function translateIn(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const dict = DICTS[locale] ?? en;
  return interpolate(dict[key] ?? en[key] ?? key, vars);
}

interface I18nValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** Plural helper: picks `<key>.one` when n === 1, else `<key>.other`, and
   *  always provides `%n%`. Pass extra `vars` to interpolate alongside. */
  tn: (key: string, n: number, vars?: Record<string, string | number>) => string;
  testimonials: Testimonial[];
  faq: FaqItem[];
}

const I18nContext = createContext<I18nValue | null>(null);
const STORAGE_KEY = "translify.locale";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  // When set, the IP-vs-browser language popup is shown. `geo` is the locale the
  // visitor's location suggests; `current` is what we auto-applied meanwhile.
  const [choice, setChoice] = useState<{ geo: Locale; current: Locale } | null>(null);
  // True once a locale is committed to storage — stops the geo popup from ever
  // appearing after the visitor has expressed (or we've recorded) a preference.
  const resolved = useRef(false);

  const persist = useCallback((l: Locale) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore (private mode, storage disabled)
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Highest priority: explicit ?lang= query param (search engines arriving
    // via hreflang alternates land here).
    const urlLang = new URLSearchParams(window.location.search).get("lang") as Locale | null;
    if (urlLang && DICTS[urlLang]) {
      resolved.current = true;
      setLocaleState(urlLang);
      persist(urlLang);
      return;
    }

    // A stored choice always wins — geo detection only runs on a truly first
    // visit, so we never re-nag someone who already has a preference.
    const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && DICTS[stored]) {
      resolved.current = true;
      setLocaleState(stored);
      return;
    }

    // First visit: apply the browser language immediately so nothing flashes,
    // then ask the API what the IP suggests. If they disagree, pop the chooser.
    const browser = browserLocale();
    const initial: Locale = browser ?? "en";
    setLocaleState(initial);

    const controller = new AbortController();
    detectGeoLocale(controller.signal).then(({ suggestedLocale }) => {
      if (resolved.current) return; // user already picked via the switcher
      if (suggestedLocale && suggestedLocale !== initial) {
        setChoice({ geo: suggestedLocale, current: initial });
      } else {
        // No conflict — lock in the auto-detected locale so we skip detection
        // (and the /geo call) on every future load.
        resolved.current = true;
        persist(initial);
      }
    });
    return () => controller.abort();
  }, [persist]);

  const dir: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const setLocale = useCallback(
    (l: Locale) => {
      resolved.current = true;
      setLocaleState(l);
      persist(l);
      setChoice(null);
    },
    [persist],
  );

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translateIn(locale, key, vars),
    [locale],
  );

  const tn = useCallback(
    (key: string, n: number, vars?: Record<string, string | number>) =>
      translateIn(locale, `${key}.${n === 1 ? "one" : "other"}`, { n, ...vars }),
    [locale],
  );

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      dir,
      setLocale,
      t,
      tn,
      testimonials: TESTIMONIALS[locale] ?? enTestimonials,
      faq: FAQS[locale] ?? enFaq,
    }),
    [locale, dir, setLocale, t, tn],
  );

  return (
    <I18nContext.Provider value={value}>
      {children}
      {choice && (
        <LanguageChoiceModal
          geo={choice.geo}
          current={choice.current}
          onPick={setLocale}
          onDismiss={() => {
            // Dismissed without choosing — keep what's on screen and stop asking.
            resolved.current = true;
            persist(locale);
            setChoice(null);
          }}
        />
      )}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export type { Testimonial, FaqItem } from "./locales/types";
