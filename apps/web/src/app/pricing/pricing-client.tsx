"use client";

import Link from "next/link";
import { Pricing } from "@/components/landing/pricing";
import { FAQ } from "@/components/landing/faq";
import { TranslifyIcon } from "@/components/translify-mark";
import { useI18n } from "@/lib/i18n";

export default function PricingClient() {
  const { t } = useI18n();

  return (
    <main className="relative min-h-screen overflow-hidden pb-16">
      {/* Soft brand backdrop, matching the homepage */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-24 h-96 w-96 rounded-full bg-[color:var(--color-saffron)]/12 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-40 h-[24rem] w-[24rem] rounded-full bg-[color:var(--color-sage)]/10 blur-3xl"
      />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-10">
        <Link
          href="/"
          aria-label="Translify"
          className="flex items-center gap-2.5 font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight"
        >
          <TranslifyIcon size={36} />
          Translify
        </Link>
        <Link
          href="/onboarding"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[color:var(--color-ink)] px-4 text-xs font-semibold text-[color:var(--color-paper)]"
        >
          {t("pricing.startTrial")}
        </Link>
      </header>

      <section className="relative z-10 mx-auto max-w-5xl px-6 pt-8 text-center lg:px-10">
        <span className="badge-pill bg-[color:var(--color-saffron)]/15 text-[color:var(--color-saffron-deep)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-saffron)]" />
          {t("pricing.hero.badge")}
        </span>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.4rem,5vw,3.6rem)] font-semibold leading-tight tracking-tight">
          {t("pricing.hero.title.pre")}{" "}
          <em className="text-[color:var(--color-saffron-deep)]">{t("pricing.hero.title.em")}</em>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-[color:var(--color-ink-soft)]">
          {t("pricing.hero.body")}
        </p>
      </section>

      <Pricing />

      {/* Extra context that doesn't fit on the homepage */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 py-12 lg:px-10">
        <h2 className="text-center font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
          {t("pricing.everyPlan")}
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Feature title={t("pricing.f1.title")} body={t("pricing.f1.body")} />
          <Feature title={t("pricing.f2.title")} body={t("pricing.f2.body")} />
          <Feature title={t("pricing.f3.title")} body={t("pricing.f3.body")} />
          <Feature title={t("pricing.f4.title")} body={t("pricing.f4.body")} />
          <Feature title={t("pricing.f5.title")} body={t("pricing.f5.body")} />
          <Feature title={t("pricing.f6.title")} body={t("pricing.f6.body")} />
        </div>
      </section>

      <FAQ />

      <section className="relative z-10 mx-auto mt-8 max-w-2xl px-6 text-center lg:px-10">
        <div className="rounded-3xl border-[1.5px] border-[color:var(--color-saffron)] bg-[color:var(--color-saffron)]/5 p-10">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
            {t("pricing.deciding.title")}
          </h2>
          <p className="mt-3 text-[color:var(--color-ink-soft)]">
            {t("pricing.deciding.body")}
          </p>
          <Link
            href="/onboarding"
            className="mt-6 inline-flex h-12 items-center rounded-full bg-[color:var(--color-saffron)] px-6 font-semibold"
          >
            {t("pricing.deciding.cta")}
          </Link>
        </div>
      </section>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border-[1.5px] border-[color:var(--color-border)] bg-white/60 p-5">
      <h3 className="font-semibold text-[color:var(--color-ink)]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-ink-soft)]">{body}</p>
    </div>
  );
}
