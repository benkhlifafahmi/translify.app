"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { Lumi } from "@/components/lumi/lumi";
import { TranslifyIcon } from "@/components/translify-mark";

interface Props {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthShell({ eyebrow, title, subtitle, children }: Props) {
  const { t } = useI18n();
  return (
    <main className="relative grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_minmax(420px,540px)]">
      {/* Left: warm brand panel — hidden on mobile */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#FFF7E2] via-[#F8E9C5] to-[#EFD8A6] p-12 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-[color:var(--color-coral)]/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-10 left-10 h-80 w-80 rounded-full bg-[color:var(--color-sage)]/12 blur-3xl"
        />

        <Link
          href="/"
          aria-label="Translify"
          className="relative z-10 flex items-center gap-2.5 font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-[color:var(--color-ink)]"
        >
          <TranslifyIcon size={36} />
          Translify
        </Link>

        <div className="relative z-10 max-w-md">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[color:var(--color-ink-soft)] shadow-sm backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-sage)]" />
            {t("auth.shell.badge")}
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-[2.6rem] font-semibold leading-[1.05] tracking-tight text-[color:var(--color-ink)]">
            {t("auth.shell.quote.1")}{" "}
            <em className="text-[color:var(--color-saffron-deep)]">{t("auth.shell.quote.2")}</em>
            {" "}{t("auth.shell.quote.3")}
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-[color:var(--color-ink-soft)]">
            {t("auth.shell.body")}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 text-xs text-[color:var(--color-ink-soft)]">
          <span className="flex -space-x-1.5">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[color:var(--color-saffron)] text-white ring-2 ring-[#F8E9C5]">📚</span>
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[color:var(--color-sage)] text-white ring-2 ring-[#F8E9C5]">💬</span>
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[color:var(--color-coral)] text-white ring-2 ring-[#F8E9C5]">★</span>
          </span>
          <span>{t("auth.shell.foot")}</span>
        </div>

        {/* Lumi peeks from the bottom-right corner of the brand panel */}
        <div className="pointer-events-none absolute bottom-4 right-4 z-10">
          <Lumi state="waving" size={110} animate />
        </div>
      </section>

      {/* Right: form */}
      <section className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md animate-float-in">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)] lg:hidden"
          >
            ← Translify
          </Link>

          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-saffron-deep)]">
            {eyebrow}
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-[2.4rem] font-semibold leading-[1.1] tracking-tight">
            {title}
          </h1>
          <p className="mb-8 mt-3 text-[0.95rem] leading-relaxed text-[color:var(--color-ink-soft)]">
            {subtitle}
          </p>

          {children}
        </div>
      </section>
    </main>
  );
}
