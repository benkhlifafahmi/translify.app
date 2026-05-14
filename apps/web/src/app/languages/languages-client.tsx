"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const LANGS = [
  { slug: "english",    native: "English",    flag: "🇬🇧" },
  { slug: "spanish",    native: "Español",    flag: "🇪🇸" },
  { slug: "french",     native: "Français",   flag: "🇫🇷" },
  { slug: "german",     native: "Deutsch",    flag: "🇩🇪" },
  { slug: "japanese",   native: "日本語",       flag: "🇯🇵" },
  { slug: "arabic",     native: "العربية",     flag: "🇸🇦" },
  { slug: "indonesian", native: "Indonesia",  flag: "🇮🇩" },
  { slug: "malay",      native: "Melayu",     flag: "🇲🇾" },
] as const;

export default function LanguagesClient() {
  const { t } = useI18n();
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <nav className="mb-8 text-sm text-[color:var(--color-ink-soft)]">
        <Link href="/" className="hover:text-[color:var(--color-ink)]">
          {t("lang.back")}
        </Link>
      </nav>

      <header className="max-w-3xl">
        <span className="badge-pill bg-[color:var(--color-paper-3)] text-[color:var(--color-ink-soft)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-sage)]" />
          {t("lang.badge")}
        </span>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.2rem,4.5vw,3.4rem)] font-semibold leading-tight tracking-tight">
          {t("lang.title")}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-[color:var(--color-ink-soft)]">
          {t("lang.subtitle")}
        </p>
      </header>

      <section className="mt-14 space-y-10">
        {LANGS.map((src) => (
          <div key={src.slug}>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
              <span className="mr-2 text-3xl" aria-hidden>{src.flag}</span>
              {t("lang.readingIn", { src: src.native })}
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {LANGS.filter((tgt) => tgt.slug !== src.slug).map((tgt) => (
                <li key={tgt.slug}>
                  <Link
                    href={`/read/${src.slug}/in/${tgt.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[color:var(--color-border)] bg-white/60 px-4 py-2 text-sm font-medium transition-all hover:-translate-y-[1px] hover:border-[color:var(--color-saffron)] hover:bg-[color:var(--color-saffron)]/5"
                  >
                    <span aria-hidden>{tgt.flag}</span>
                    {tgt.native}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mt-16 rounded-3xl border-[1.5px] border-[color:var(--color-border)] bg-[color:var(--color-paper-2)]/40 p-8 text-center">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
          {t("lang.notListed.title")}
        </h2>
        <p className="mt-3 max-w-xl mx-auto text-[color:var(--color-ink-soft)]">
          {t("lang.notListed.body")}
        </p>
        <Link
          href="/onboarding"
          className="mt-6 inline-flex h-12 items-center rounded-full bg-[color:var(--color-saffron)] px-6 font-semibold"
        >
          {t("lang.cta")}
        </Link>
      </section>
    </main>
  );
}
