"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { usePostHog, useFeatureFlagVariantKey } from "posthog-js/react";
import { TranslifyIcon } from "@/components/translify-mark";
import { useI18n } from "@/lib/i18n";

// Paid-social landing page (mostly mobile). Single goal: click → /join
// (anonymous, no-card activation), where the existing funnel + paywall converts
// to a subscription.
//
// A/B EXPERIMENT — flag key `study-hero`, variants: `control` | `tutor`.
//   control : "Study any book. Ace the exam."   (exam-outcome framing)
//   tutor   : "Turn any book into a tutor that quizzes you."
// PostHog attaches the active flag to every later event, so the join-funnel
// events (e.g. `anon_session_started`) are automatically attributed to the
// variant — that activation event is the experiment's goal metric. We also fire
// `study_cta_click` for click-through and `study_viewed` for exposure.
//
// All visible copy is localised via the `study.lp.*` i18n keys; the hero pulls
// its variant copy from `study.lp.hero.<variant>.*`.

const JOIN = "/join?ref=study";

type Variant = "control" | "tutor";

export function StudyClient() {
  const posthog = usePostHog();
  // Reading the flag registers the experiment exposure ($feature_flag_called).
  // Undefined until PostHog loads (or when no key is set) → default to control,
  // so the page never blocks and never shows the wrong default.
  const variantKey = useFeatureFlagVariantKey("study-hero");
  const variant: Variant = variantKey === "tutor" ? "tutor" : "control";

  // Fire a custom exposure marker once, after the flag resolves.
  const viewed = useRef(false);
  useEffect(() => {
    if (viewed.current || variantKey === undefined) return;
    viewed.current = true;
    posthog?.capture("study_viewed", { variant });
  }, [posthog, variant, variantKey]);

  const track = useCallback(
    (placement: string) => {
      posthog?.capture("study_cta_click", { variant, placement });
    },
    [posthog, variant],
  );

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[color:var(--color-paper)] pb-28 lg:pb-0">
      <Blobs />
      <TopBar />

      <div className="relative z-10 mx-auto w-full max-w-xl px-5 sm:px-6">
        <Hero variant={variant} track={track} />
        <RatingStrip />
        <HowItWorks />
        <Workspace />
        <Testimonials />
        <Offer track={track} />
        <Faq />
        <FinalCta track={track} />
        <Footer />
      </div>

      <StickyCta track={track} />
    </main>
  );
}

/* ───────────────────────── chrome ───────────────────────── */

function TopBar() {
  const { t } = useI18n();
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-xl items-center justify-between px-5 pt-5 sm:px-6">
      <Link href="/" aria-label="Translify" className="flex items-center gap-2">
        <TranslifyIcon size={30} />
        <span className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-[color:var(--color-ink)]">
          Translify
        </span>
      </Link>
      <Link
        href="/login"
        className="text-sm font-semibold text-[color:var(--color-ink-soft)] transition-colors hover:text-[color:var(--color-ink)]"
      >
        {t("nav.login")}
      </Link>
    </header>
  );
}

/* ───────────────────────── hero ───────────────────────── */

function Hero({ variant, track }: { variant: Variant; track: (p: string) => void }) {
  const { t } = useI18n();
  return (
    <section className="pt-8 text-center">
      <span className="badge-pill bg-[color:var(--color-paper-3)] text-[color:var(--color-ink-soft)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-saffron)]" />
        {t("study.lp.badge")}
      </span>

      <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.4rem,9vw,3.4rem)] font-semibold leading-[1.04] tracking-tight text-[color:var(--color-ink)]">
        {t(`study.lp.hero.${variant}.line1`)}
        <br />
        <span className="relative inline-block">
          <span className="relative z-10 italic text-[color:var(--color-saffron-deep)]">
            {t(`study.lp.hero.${variant}.line2`)}
          </span>
          <Underline />
        </span>
      </h1>

      <p className="mx-auto mt-4 max-w-md text-[1.02rem] leading-relaxed text-[color:var(--color-ink-soft)]">
        {t(`study.lp.hero.${variant}.sub`)}
      </p>

      <div className="mt-7">
        <PrimaryCta placement="hero" track={track} />
        <p className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[0.78rem] font-medium text-[color:var(--color-ink-soft)]">
          <Tick /> {t("study.lp.tick.card")}
          <Tick /> {t("study.lp.tick.refund")}
          <Tick /> {t("study.lp.tick.langs")}
        </p>
      </div>

      <div className="mt-10">
        <PhoneMock />
      </div>
    </section>
  );
}

function PrimaryCta({
  placement,
  track,
  label,
}: {
  placement: string;
  track: (p: string) => void;
  label?: string;
}) {
  const { t } = useI18n();
  return (
    <Link
      href={JOIN}
      onClick={() => track(placement)}
      className="group inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-full bg-[color:var(--color-saffron)] px-7 py-3.5 text-base font-semibold text-[color:var(--color-accent-foreground)] shadow-[0_2px_0_rgba(140,90,30,0.5),0_14px_28px_-10px_rgba(200,137,62,0.65)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-[2px] active:scale-[0.98] active:translate-y-0"
    >
      {label ?? t("study.lp.cta.primary")}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-1">
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </Link>
  );
}

/* ───────────────────────── rating ───────────────────────── */

function RatingStrip() {
  const { t } = useI18n();
  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-paper-2)]/50 px-5 py-3 text-center">
        <Stars />
        <p className="text-sm text-[color:var(--color-ink-soft)]">
          <span className="font-semibold text-[color:var(--color-ink)]">{t("study.lp.rating.score")}</span>{" "}
          {t("study.lp.rating.text")}
        </p>
      </div>
    </section>
  );
}

function Stars() {
  return (
    <span className="inline-flex items-center gap-0.5 text-[color:var(--color-saffron)]" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2 14.85 8.2 21.5 9 16.5 13.6 17.8 20.3 12 16.9 6.2 20.3 7.5 13.6 2.5 9 9.15 8.2z" />
        </svg>
      ))}
    </span>
  );
}

/* ───────────────────────── how it works ───────────────────────── */

function HowItWorks() {
  const { t } = useI18n();
  const steps = [
    { n: "01", tone: "saffron", k: "step1" },
    { n: "02", tone: "sage", k: "step2" },
    { n: "03", tone: "coral", k: "step3" },
  ] as const;
  return (
    <section className="mt-16">
      <h2 className="text-center font-[family-name:var(--font-display)] text-[clamp(1.7rem,6vw,2.2rem)] font-semibold leading-tight tracking-tight">
        {t("study.lp.how.titlePre")}{" "}
        <em className="text-[color:var(--color-saffron-deep)]">{t("study.lp.how.titleEm")}</em>.
      </h2>
      <div className="mt-7 flex flex-col gap-3">
        {steps.map((s) => (
          <Step key={s.n} n={s.n} tone={s.tone} title={t(`study.lp.${s.k}.title`)} body={t(`study.lp.${s.k}.body`)} />
        ))}
      </div>
    </section>
  );
}

const TONE: Record<string, { bg: string; text: string }> = {
  saffron: { bg: "bg-[color:var(--color-saffron)]/15", text: "text-[color:var(--color-saffron-deep)]" },
  sage: { bg: "bg-[color:var(--color-sage)]/18", text: "text-[color:var(--color-sage-deep)]" },
  coral: { bg: "bg-[color:var(--color-coral)]/15", text: "text-[color:var(--color-coral-deep)]" },
  plum: { bg: "bg-[color:var(--color-plum)]/12", text: "text-[color:var(--color-plum)]" },
};

function Step({ n, tone, title, body }: { n: string; tone: string; title: string; body: string }) {
  const c = TONE[tone];
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-4 shadow-[var(--shadow-paper)]">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${c.bg} ${c.text} font-[family-name:var(--font-display)] text-sm font-semibold`}>
        {n}
      </span>
      <div>
        <h3 className="font-[family-name:var(--font-display)] text-[1.15rem] font-semibold leading-tight tracking-tight text-[color:var(--color-ink)]">
          {title}
        </h3>
        <p className="mt-1 text-[0.9rem] leading-relaxed text-[color:var(--color-ink-soft)]">{body}</p>
      </div>
    </div>
  );
}

/* ───────────────────────── workspace value ───────────────────────── */

function Workspace() {
  const { t } = useI18n();
  const items = [
    { tone: "sage", k: "ws1" },
    { tone: "coral", k: "ws2" },
    { tone: "plum", k: "ws3" },
    { tone: "saffron", k: "ws4" },
  ] as const;
  return (
    <section className="mt-16">
      <h2 className="text-center font-[family-name:var(--font-display)] text-[clamp(1.7rem,6vw,2.2rem)] font-semibold leading-tight tracking-tight">
        {t("study.lp.workspace.titlePre")}{" "}
        <em className="text-[color:var(--color-saffron-deep)]">{t("study.lp.workspace.titleEm")}</em>.
      </h2>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {items.map((it) => (
          <div key={it.k} className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-4 shadow-[var(--shadow-paper)]">
            <span className={`inline-grid h-9 w-9 place-items-center rounded-xl ${TONE[it.tone].bg} ${TONE[it.tone].text}`}>
              <Dot />
            </span>
            <h3 className="mt-3 text-[1rem] font-semibold text-[color:var(--color-ink)]">{t(`study.lp.${it.k}.title`)}</h3>
            <p className="mt-1 text-[0.86rem] leading-relaxed text-[color:var(--color-ink-soft)]">{t(`study.lp.${it.k}.body`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── testimonials ───────────────────────── */

function Testimonials() {
  const { t } = useI18n();
  const quotes = ["quote1", "quote2", "quote3"] as const;
  return (
    <section className="mt-16">
      <div className="flex flex-col gap-3">
        {quotes.map((q) => (
          <figure key={q} className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-paper-2)]/50 p-5">
            <Stars />
            <blockquote className="mt-2 font-[family-name:var(--font-display)] text-[1.05rem] leading-snug text-[color:var(--color-ink)]">
              {t(`study.lp.${q}.q`)}
            </blockquote>
            <figcaption className="mt-2 text-[0.74rem] uppercase tracking-[0.12em] text-[color:var(--color-ink-soft)]">
              {t(`study.lp.${q}.r`)}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── offer / money model ───────────────────────── */

function Offer({ track }: { track: (p: string) => void }) {
  const { t } = useI18n();
  // The monthly price is bolded inline — split the localised sentence on the
  // %price% token so translators keep the surrounding copy in their language.
  const body = t("study.lp.offer.body", { price: "@@PRICE@@" });
  const [bodyBefore, bodyAfter] = body.split("@@PRICE@@");
  const compares = ["cmp1", "cmp2", "cmp3"] as const;
  return (
    <section className="mt-16">
      <div className="relative overflow-hidden rounded-[1.6rem] border border-[color:var(--color-border-strong)] bg-gradient-to-br from-[#FFFBF0] via-[#FBE9C2] to-[#F2D292] p-7 shadow-[var(--shadow-paper-lg)]">
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[color:var(--color-saffron)]/30 blur-3xl" />
        <div className="relative text-center">
          <span className="badge-pill bg-[color:var(--color-paper)] text-[color:var(--color-ink)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-sage)]" />
            {t("study.lp.offer.badge")}
          </span>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(1.8rem,6vw,2.4rem)] font-semibold leading-tight tracking-tight text-[color:var(--color-ink)]">
            {t("study.lp.offer.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-[0.95rem] leading-relaxed text-[color:var(--color-ink-soft)]">
            {bodyBefore}
            <span className="font-semibold text-[color:var(--color-ink)]">{t("study.lp.offer.price")}</span>
            {bodyAfter}
          </p>

          <div className="mt-5 flex justify-center">
            <PrimaryCta placement="offer" track={track} />
          </div>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[color:var(--color-paper)]/70 px-4 py-1.5 text-[0.8rem] font-semibold text-[color:var(--color-sage-deep)]">
            <Shield /> {t("study.lp.offer.guarantee")}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {compares.map((c) => (
          <Compare key={c} who={t(`study.lp.${c}.who`)} pitch={t(`study.lp.${c}.pitch`)} />
        ))}
      </div>
      <p className="mt-4 text-center text-[0.82rem] text-[color:var(--color-ink-soft)]">
        {t("study.lp.offer.more")}{" "}
        <Link href="/pricing" className="font-semibold text-[color:var(--color-ink)] underline decoration-[color:var(--color-saffron)] underline-offset-2">
          {t("study.lp.offer.moreLink")}
        </Link>
      </p>
    </section>
  );
}

function Compare({ who, pitch }: { who: string; pitch: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-4">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-saffron-deep)]">{who}</p>
      <p className="mt-1 text-[0.9rem] leading-relaxed text-[color:var(--color-ink)]">{pitch}</p>
    </div>
  );
}

/* ───────────────────────── faq ───────────────────────── */

function Faq() {
  const { t } = useI18n();
  const items = ["faq1", "faq2", "faq3", "faq4"] as const;
  return (
    <section className="mt-16">
      <h2 className="text-center font-[family-name:var(--font-display)] text-[clamp(1.6rem,5.5vw,2rem)] font-semibold tracking-tight">
        {t("study.lp.faq.heading")}
      </h2>
      <div className="mt-6 flex flex-col gap-2.5">
        {items.map((it) => (
          <details key={it} className="group rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-4 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[0.95rem] font-semibold text-[color:var(--color-ink)]">
              {t(`study.lp.${it}.q`)}
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[color:var(--color-paper-3)] text-[color:var(--color-ink-soft)] transition-transform duration-200 group-open:rotate-45">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              </span>
            </summary>
            <p className="mt-2.5 text-[0.88rem] leading-relaxed text-[color:var(--color-ink-soft)]">{t(`study.lp.${it}.a`)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── final CTA + footer ───────────────────────── */

function FinalCta({ track }: { track: (p: string) => void }) {
  const { t } = useI18n();
  return (
    <section className="mt-16 text-center">
      <h2 className="font-[family-name:var(--font-display)] text-[clamp(2rem,7vw,2.8rem)] font-semibold leading-[1.05] tracking-tight text-[color:var(--color-ink)]">
        {t("study.lp.final.title")}
        <br />
        <em className="text-[color:var(--color-saffron-deep)]">{t("study.lp.final.titleEm")}</em>
      </h2>
      <div className="mt-6 flex justify-center">
        <PrimaryCta placement="final" track={track} />
      </div>
      <p className="mt-3 text-[0.78rem] text-[color:var(--color-ink-soft)]">
        {t("study.lp.final.note")}
      </p>
    </section>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-16 border-t border-dashed border-[color:var(--color-border)] py-8 text-center text-[0.78rem] text-[color:var(--color-ink-soft)]">
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <Link href="/pricing" className="hover:text-[color:var(--color-ink)]">{t("study.lp.foot.pricing")}</Link>
        <Link href="/" className="hover:text-[color:var(--color-ink)]">{t("study.lp.foot.home")}</Link>
        <Link href="/privacy" className="hover:text-[color:var(--color-ink)]">{t("study.lp.foot.privacy")}</Link>
        <Link href="/terms" className="hover:text-[color:var(--color-ink)]">{t("study.lp.foot.terms")}</Link>
      </div>
      <p className="mt-4">© {new Date().getFullYear()} Translify</p>
    </footer>
  );
}

/* ───────────────────────── sticky mobile CTA ───────────────────────── */

function StickyCta({ track }: { track: (p: string) => void }) {
  const { t } = useI18n();
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--color-border)] bg-[color:var(--color-paper)]/90 px-4 pt-3 backdrop-blur lg:hidden"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}
    >
      <Link
        href={JOIN}
        onClick={() => track("sticky")}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[color:var(--color-saffron)] font-semibold text-[color:var(--color-accent-foreground)] shadow-[0_2px_0_rgba(140,90,30,0.5)] active:scale-[0.98]"
      >
        {t("study.lp.cta.primary")}
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

/* ───────────────────────── phone mock ───────────────────────── */

function PhoneMock() {
  const { t } = useI18n();
  return (
    <div className="relative mx-auto w-[270px]">
      <div className="rounded-[2.4rem] border-[6px] border-[color:var(--color-ink)] bg-[color:var(--color-ink)] shadow-[0_30px_60px_-20px_rgba(20,16,8,0.5)]">
        <div className="overflow-hidden rounded-[1.9rem] bg-[color:var(--color-paper)]">
          <div className="flex items-center justify-between px-5 pt-3 pb-1 text-[0.6rem] font-semibold text-[color:var(--color-ink-soft)]">
            <span>9:41</span>
            <span className="h-3.5 w-12 rounded-full bg-[color:var(--color-paper-3)]" />
          </div>
          <div className="flex items-center gap-2 border-b border-[color:var(--color-border)] px-4 py-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[color:var(--color-saffron)]/20 text-[color:var(--color-saffron-deep)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
            </span>
            <div className="min-w-0">
              <p className="truncate text-[0.72rem] font-semibold text-[color:var(--color-ink)]">{t("study.lp.mock.book")}</p>
              <p className="text-[0.58rem] text-[color:var(--color-ink-soft)]">{t("study.lp.mock.loc")}</p>
            </div>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[color:var(--color-saffron)]/15 px-2 py-0.5 text-[0.56rem] font-semibold text-[color:var(--color-saffron-deep)]">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /><path d="M9 2h6" /></svg>
              18:24
            </span>
          </div>
          <div className="flex flex-col gap-2.5 p-3">
            <p className="text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-ink-soft)]">
              {t("study.lp.mock.desk")}
            </p>
            <div className="rounded-xl border-[1.5px] border-[color:var(--color-border-strong)] bg-[#FFFCF3] p-3">
              <span className="text-[0.5rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-ink-soft)]">{t("study.lp.mock.prompt")}</span>
              <p className="mt-1 text-[0.74rem] leading-snug text-[color:var(--color-ink)]">
                {t("study.lp.mock.q")}
              </p>
              <div className="mt-2.5 flex gap-1.5">
                <span className="flex-1 rounded-lg border-[1.5px] border-[color:var(--color-border)] bg-white/60 py-1 text-center text-[0.6rem] font-semibold text-[color:var(--color-ink-soft)]">{t("study.lp.mock.again")}</span>
                <span className="flex-1 rounded-lg bg-[color:var(--color-sage)] py-1 text-center text-[0.6rem] font-semibold text-white">{t("study.lp.mock.gotit")}</span>
              </div>
            </div>
            <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-paper-2)] p-2.5">
              <p className="text-[0.66rem] leading-snug text-[color:var(--color-ink)]">
                {t("study.lp.mock.a")}
                <span className="ml-1 inline-flex translate-y-[1px] items-center rounded-full bg-[color:var(--color-saffron)]/25 px-1.5 text-[0.52rem] font-bold text-[color:var(--color-saffron-deep)]">p. 143</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[color:var(--color-paper-3)]">
                <div className="h-full rounded-full bg-[color:var(--color-saffron)]" style={{ width: "64%" }} />
              </div>
              <span className="text-[0.56rem] font-semibold tabular-nums text-[color:var(--color-ink-soft)]">32 / 50 min</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── bits ───────────────────────── */

function Underline() {
  return (
    <svg aria-hidden viewBox="0 0 220 14" preserveAspectRatio="none" className="absolute -bottom-1 left-0 h-3 w-full text-[color:var(--color-saffron)]/55">
      <path d="M2 8 C 50 1, 100 13, 218 5" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function Tick() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="grid h-4 w-4 place-items-center rounded-full bg-[color:var(--color-sage)]/20 text-[color:var(--color-sage-deep)]">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
      </span>
    </span>
  );
}

function Dot() {
  return <span className="h-2 w-2 rounded-full bg-current" />;
}

function Shield() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function Blobs() {
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-20 h-72 w-72 rounded-full bg-[color:var(--color-saffron)]/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-24 top-72 h-80 w-80 rounded-full bg-[color:var(--color-sage)]/12 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-40 left-1/4 h-72 w-72 rounded-full bg-[color:var(--color-coral)]/10 blur-3xl" />
    </>
  );
}
