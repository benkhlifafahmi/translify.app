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
          href="/login"
          className="text-sm font-semibold text-[color:var(--color-ink-soft)] transition-colors duration-150 hover:text-[color:var(--color-ink)]"
        >
          {t("pricing.signIn")}
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
        <p className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border-[1.5px] border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)]/70 px-4 py-1.5 text-[0.82rem] font-semibold text-[color:var(--color-ink)]">
          {t("pricing.hero.reverse")}
        </p>
      </section>

      <Pricing />

      {/* Why Translify, not X — short comparison anchor */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pt-14 lg:px-10">
        <h2 className="text-center font-[family-name:var(--font-display)] text-[clamp(1.6rem,3vw,2.2rem)] font-semibold leading-tight tracking-tight">
          {t("pricing.compare.title.pre")}{" "}
          <em className="text-[color:var(--color-saffron-deep)]">{t("pricing.compare.title.em")}</em>
        </h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <CompareCard against={t("pricing.compare.deepl.who")} pitch={t("pricing.compare.deepl.pitch")} />
          <CompareCard against={t("pricing.compare.chatgpt.who")} pitch={t("pricing.compare.chatgpt.pitch")} />
          <CompareCard against={t("pricing.compare.anki.who")} pitch={t("pricing.compare.anki.pitch")} />
        </div>
      </section>

      {/* One short proof line */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 py-14 text-center lg:px-10">
        <figure className="mx-auto max-w-2xl">
          <blockquote className="font-[family-name:var(--font-display)] text-[clamp(1.15rem,2.4vw,1.5rem)] italic leading-snug text-[color:var(--color-ink)]">
            “{t("pricing.proof.quote")}”
          </blockquote>
          <figcaption className="mt-3 text-[0.78rem] uppercase tracking-[0.14em] text-[color:var(--color-ink-soft)]">
            {t("pricing.proof.role")}
          </figcaption>
        </figure>
      </section>

      {/* Extra context that doesn't fit on the homepage — chunked into 3 clusters */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-12 lg:px-10">
        <h2 className="text-center font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
          {t("pricing.everyPlan")}
        </h2>
        <div className="mt-10 space-y-10">
          <FeatureCluster
            heading={t("pricing.cluster1.title")}
            items={[
              { title: t("pricing.f1.title"), body: t("pricing.f1.body") },
              { title: t("pricing.f2.title"), body: t("pricing.f2.body") },
            ]}
          />
          <FeatureCluster
            heading={t("pricing.cluster2.title")}
            items={[
              { title: t("pricing.f3.title"), body: t("pricing.f3.body") },
              { title: t("pricing.f4.title"), body: t("pricing.f4.body") },
            ]}
          />
          <FeatureCluster
            heading={t("pricing.cluster3.title")}
            items={[
              { title: t("pricing.f5.title"), body: t("pricing.f5.body") },
              { title: t("pricing.f6.title"), body: t("pricing.f6.body") },
            ]}
          />
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
            href="/join"
            className="mt-6 inline-flex h-12 items-center rounded-full bg-[color:var(--color-saffron)] px-6 font-semibold"
          >
            {t("pricing.deciding.cta")}
          </Link>
        </div>
      </section>
    </main>
  );
}

function FeatureCluster({
  heading, items,
}: {
  heading: string;
  items: { title: string; body: string }[];
}) {
  return (
    <div>
      <h3 className="font-[family-name:var(--font-display)] text-[1.05rem] font-semibold tracking-tight text-[color:var(--color-ink)]">
        {heading}
      </h3>
      <div className="mt-4 grid gap-x-10 gap-y-5 sm:grid-cols-2">
        {items.map((it) => (
          <div key={it.title}>
            <p className="text-[0.95rem] font-semibold text-[color:var(--color-ink)]">{it.title}</p>
            <p className="mt-1 text-[0.88rem] leading-relaxed text-[color:var(--color-ink-soft)]">{it.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompareCard({ against, pitch }: { against: string; pitch: string }) {
  return (
    <div className="rounded-2xl border-[1.5px] border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-5 shadow-[var(--shadow-paper)]">
      <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--color-ink-soft)]">
        {against}
      </p>
      <p className="mt-3 font-[family-name:var(--font-display)] text-[0.98rem] leading-snug text-[color:var(--color-ink)]">
        {pitch}
      </p>
    </div>
  );
}
