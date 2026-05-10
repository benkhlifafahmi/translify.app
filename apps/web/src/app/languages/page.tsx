import type { Metadata } from "next";
import Link from "next/link";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";

export const metadata: Metadata = {
  title: "All supported languages — 56 reading pairs",
  description:
    "Translify supports 8 languages across 56 source→target reading pairs. Read Spanish books in English, German books in French, Japanese books in Arabic, and 53 other combinations — every one with the original layout preserved.",
  alternates: { canonical: "/languages" },
  openGraph: {
    title: "All supported languages — Translify",
    description:
      "8 languages, 56 reading pairs. Find your source → target combination.",
    url: `${SITE}/languages`,
  },
};

const LANGS = [
  { slug: "english",    label: "English",    native: "English",    flag: "🇬🇧" },
  { slug: "spanish",    label: "Spanish",    native: "Español",    flag: "🇪🇸" },
  { slug: "french",     label: "French",     native: "Français",   flag: "🇫🇷" },
  { slug: "german",     label: "German",     native: "Deutsch",    flag: "🇩🇪" },
  { slug: "japanese",   label: "Japanese",   native: "日本語",       flag: "🇯🇵" },
  { slug: "arabic",     label: "Arabic",     native: "العربية",     flag: "🇸🇦" },
  { slug: "indonesian", label: "Indonesian", native: "Indonesia",  flag: "🇮🇩" },
  { slug: "malay",      label: "Malay",      native: "Melayu",     flag: "🇲🇾" },
] as const;

export default function LanguagesPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <nav className="mb-8 text-sm text-[color:var(--color-ink-soft)]">
        <Link href="/" className="hover:text-[color:var(--color-ink)]">
          ← Back home
        </Link>
      </nav>

      <header className="max-w-3xl">
        <span className="badge-pill bg-[color:var(--color-paper-3)] text-[color:var(--color-ink-soft)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-sage)]" />
          8 languages · 56 reading pairs
        </span>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.2rem,4.5vw,3.4rem)] font-semibold leading-tight tracking-tight">
          Every supported reading pair.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-[color:var(--color-ink-soft)]">
          Pick a source language (the language your book is in) and find your
          target (the language you want to read in). Each page shows what
          Translify does for that specific pair — translation engine, sample
          authors, FAQ.
        </p>
      </header>

      <section className="mt-14 space-y-10">
        {LANGS.map((src) => (
          <div key={src.slug}>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
              <span className="mr-2 text-3xl" aria-hidden>{src.flag}</span>
              Read {src.label} books in…
              <span className="ml-2 text-[color:var(--color-ink-soft)] text-base font-normal italic">
                ({src.native})
              </span>
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {LANGS.filter((t) => t.slug !== src.slug).map((tgt) => (
                <li key={tgt.slug}>
                  <Link
                    href={`/read/${src.slug}/in/${tgt.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[color:var(--color-border)] bg-white/60 px-4 py-2 text-sm font-medium transition-all hover:-translate-y-[1px] hover:border-[color:var(--color-saffron)] hover:bg-[color:var(--color-saffron)]/5"
                  >
                    <span aria-hidden>{tgt.flag}</span>
                    {tgt.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mt-16 rounded-3xl border-[1.5px] border-[color:var(--color-border)] bg-[color:var(--color-paper-2)]/40 p-8 text-center">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
          Your language pair not listed?
        </h2>
        <p className="mt-3 max-w-xl mx-auto text-[color:var(--color-ink-soft)]">
          We're adding new source languages quarterly. Tell us which one you
          need most and we'll prioritize it.
        </p>
        <Link
          href="/onboarding"
          className="mt-6 inline-flex h-12 items-center rounded-full bg-[color:var(--color-saffron)] px-6 font-semibold"
        >
          Start a 14-day trial →
        </Link>
      </section>
    </main>
  );
}
