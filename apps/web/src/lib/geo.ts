/**
 * Client-side helper around the API's `GET /geo` endpoint.
 *
 * The server reads the visitor's IP (proxy-aware), resolves the country, and
 * maps it to one of our supported UI locales. We use that as a *second* signal
 * alongside `navigator.language`: when the two disagree, the I18nProvider shows
 * a one-time "choose your language" popup (see `language-choice-modal.tsx`).
 *
 * Everything here fails soft — any error resolves to `null`, and the provider
 * simply falls back to browser-language detection.
 */
import { type Locale } from "@/lib/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const SUPPORTED: ReadonlySet<string> = new Set([
  "en", "fr", "es", "de", "ja", "zh", "ar", "id", "ms",
]);

export interface GeoResult {
  country: string | null;
  suggestedLocale: Locale | null;
}

/** Resolve `navigator.language` (e.g. "ja-JP") to a supported locale, or null. */
export function browserLocale(): Locale | null {
  if (typeof navigator === "undefined") return null;
  const langs = [navigator.language, ...(navigator.languages ?? [])];
  for (const l of langs) {
    const code = l?.slice(0, 2).toLowerCase();
    if (code && SUPPORTED.has(code)) return code as Locale;
  }
  return null;
}

/**
 * Ask the API which locale the visitor's IP suggests. Resolves to `null` when
 * the country can't be determined (private IP, provider down, ad-blocked, etc.)
 * so callers can quietly fall back to the browser language.
 */
export async function detectGeoLocale(signal?: AbortSignal): Promise<GeoResult> {
  try {
    const res = await fetch(`${API_URL}/geo`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal,
    });
    if (!res.ok) return { country: null, suggestedLocale: null };
    const data = (await res.json()) as {
      country?: string | null;
      suggested_locale?: string | null;
    };
    const loc = data.suggested_locale;
    return {
      country: data.country ?? null,
      suggestedLocale: loc && SUPPORTED.has(loc) ? (loc as Locale) : null,
    };
  } catch {
    return { country: null, suggestedLocale: null };
  }
}
