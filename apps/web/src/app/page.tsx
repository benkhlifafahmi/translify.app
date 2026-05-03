"use client";

import Link from "next/link";
import { FAQ } from "@/components/landing/faq";
import { LiveDemo } from "@/components/landing/live-demo";
import { Pricing } from "@/components/landing/pricing";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/lib/i18n";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <DecorBackdrop />

      <SiteNav />
      <Hero />
      <TrustStrip />
      <LiveDemo />
      <HowItWorks />
      <FeatureShowcase />
      <ForEveryone />
      <LanguagesStrip />
      <Testimonials />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <SiteFooter />
    </main>
  );
}

/* ───────────────────────────── NAV ───────────────────────────── */

function SiteNav() {
  const { t } = useI18n();
  return (
    <nav className="relative z-20 flex items-center justify-between px-8 py-6 lg:px-14">
      <Logo />
      <div className="hidden items-center gap-7 text-sm font-medium text-[color:var(--color-ink-soft)] md:flex">
        <a href="#how" className="transition-colors hover:text-[color:var(--color-ink)]">{t("nav.how")}</a>
        <a href="#features" className="transition-colors hover:text-[color:var(--color-ink)]">{t("nav.features")}</a>
        <a href="#pricing" className="transition-colors hover:text-[color:var(--color-ink)]">{t("nav.pricing")}</a>
        <a href="#faq" className="transition-colors hover:text-[color:var(--color-ink)]">{t("nav.faq")}</a>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <LanguageSwitcher />
        <Link
          href="/login"
          className="rounded-full px-4 py-2 font-medium text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]"
        >
          {t("nav.login")}
        </Link>
        <Link
          href="/onboarding"
          className="rounded-full bg-[color:var(--color-ink)] px-5 py-2 font-semibold text-[color:var(--color-primary-foreground)] shadow-[0_2px_0_rgba(20,16,8,0.4),0_8px_18px_-8px_rgba(20,16,8,0.5)] transition-transform hover:-translate-y-[1px]"
        >
          {t("nav.cta")}
        </Link>
      </div>
    </nav>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[color:var(--color-ink)]">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color:var(--color-ink)] text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4)]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
      </span>
      Translify
    </Link>
  );
}

/* ───────────────────────────── HERO ───────────────────────────── */

function Hero() {
  const { t } = useI18n();
  return (
    <section className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-8 pb-16 pt-10 lg:grid-cols-12 lg:gap-10 lg:px-14 lg:pt-20">
      <div className="lg:col-span-7 stagger">
        <span className="badge-pill bg-[color:var(--color-paper-3)] text-[color:var(--color-ink-soft)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-sage)]" />
          {t("hero.badge")}
        </span>

        <h1 className="mt-5 font-[family-name:var(--font-display)] text-[clamp(2.6rem,6vw,4.8rem)] font-semibold leading-[1.02] tracking-tight">
          {t("hero.title.1")}
          <br />
          <span className="relative inline-block">
            <span className="relative z-10 italic text-[color:var(--color-saffron-deep)]">
              {t("hero.title.2")}
            </span>
            <Underline />
          </span>
          .
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-[color:var(--color-ink-soft)]">
          {t("hero.subtitle")}
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/onboarding"
            className="group inline-flex h-12 items-center gap-2 rounded-full bg-[color:var(--color-saffron)] px-6 font-semibold text-[color:var(--color-accent-foreground)] shadow-[0_2px_0_rgba(140,90,30,0.5),0_10px_22px_-8px_rgba(200,137,62,0.6)] transition-transform hover:-translate-y-[2px]"
          >
            {t("hero.cta.primary")}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1 rtl:rotate-180">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
          <a
            href="#pricing"
            className="inline-flex h-12 items-center rounded-full border-[1.5px] border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)]/60 px-6 font-semibold text-[color:var(--color-ink)] hover:bg-[color:var(--color-paper-2)]"
          >
            {t("hero.cta.secondary")}
          </a>
        </div>

        <ul className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[color:var(--color-ink-soft)]">
          <li className="flex items-center gap-2"><Tick /> {t("hero.bullet.1")}</li>
          <li className="flex items-center gap-2"><Tick /> {t("hero.bullet.2")}</li>
          <li className="flex items-center gap-2"><Tick /> {t("hero.bullet.3")}</li>
        </ul>
      </div>

      <div className="lg:col-span-5">
        <BookStack />
      </div>
    </section>
  );
}

/* ───────────────────────── TRUST STRIP ───────────────────────── */

function TrustStrip() {
  return (
    <section className="relative z-10 border-y border-dashed border-[color:var(--color-border)] bg-[color:var(--color-paper-2)]/40 py-7">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-around gap-y-5 px-8 lg:px-14">
        <Stat number="42,000+" label="books translated" />
        <Divider />
        <Stat number="14" label="languages, every script" />
        <Divider />
        <Stat number="9.4 / 10" label="reader satisfaction" />
        <Divider />
        <Stat number="30 days" label="money-back, always" />
      </div>
    </section>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <p className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[color:var(--color-ink)] md:text-[1.7rem]">
        {number}
      </p>
      <p className="mt-0.5 text-[0.78rem] uppercase tracking-[0.18em] text-[color:var(--color-ink-soft)]">
        {label}
      </p>
    </div>
  );
}

function Divider() {
  return <span aria-hidden className="hidden h-10 w-px bg-[color:var(--color-border)] md:block" />;
}

/* ───────────────────────── HOW IT WORKS ───────────────────────── */

function HowItWorks() {
  return (
    <section id="how" className="relative z-10 mx-auto max-w-6xl px-8 pb-24 pt-20 lg:px-14">
      <div className="grid items-end gap-6 md:grid-cols-2 md:gap-10">
        <div>
          <span className="badge-pill bg-[color:var(--color-paper-3)] text-[color:var(--color-ink-soft)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-saffron)]" />
            Three steps, ten minutes
          </span>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2rem,4vw,3rem)] font-semibold leading-tight tracking-tight">
            From PDF to <em className="text-[color:var(--color-saffron-deep)]">a book you understand</em>.
          </h2>
        </div>
        <p className="max-w-md text-[1.02rem] leading-relaxed text-[color:var(--color-ink-soft)]">
          No setup. No fiddling with translation tools. No copy-pasting paragraphs into another tab.
          Drop, wait a coffee&apos;s worth of time, read.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        <Step
          n="01"
          tone="saffron"
          title="Drop your book"
          body="PDF or EPUB, up to 200 MB. We accept textbooks, novels, papers, kids' books — anything readable."
          mock={<MockUpload />}
        />
        <Step
          n="02"
          tone="sage"
          title="Pick a language"
          body="Choose from 14 languages. We rebuild every page in your target language, keeping the original layout intact."
          mock={<MockTranslate />}
        />
        <Step
          n="03"
          tone="coral"
          title="Read, chat, quiz"
          body="Open the book, ask questions in plain language, and let surprise quizzes seal what you learned."
          mock={<MockChat />}
        />
      </div>
    </section>
  );
}

function Step({
  n, tone, title, body, mock,
}: {
  n: string;
  tone: "saffron" | "sage" | "coral";
  title: string;
  body: string;
  mock: React.ReactNode;
}) {
  const tones: Record<typeof tone, { numBg: string; numText: string; ring: string }> = {
    saffron: { numBg: "bg-[color:var(--color-saffron)]/15", numText: "text-[color:var(--color-saffron-deep)]", ring: "ring-[color:var(--color-saffron)]/30" },
    sage:    { numBg: "bg-[color:var(--color-sage)]/18",    numText: "text-[color:var(--color-sage-deep)]",    ring: "ring-[color:var(--color-sage)]/30" },
    coral:   { numBg: "bg-[color:var(--color-coral)]/15",   numText: "text-[color:var(--color-coral-deep)]",   ring: "ring-[color:var(--color-coral)]/30" },
  };
  const t = tones[tone];
  return (
    <div className="card-paper-lifted relative overflow-hidden p-6">
      <div className={`mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl ${t.numBg} ${t.numText} ring-1 ${t.ring} font-[family-name:var(--font-display)] text-sm font-semibold`}>
        {n}
      </div>
      <h3 className="font-[family-name:var(--font-display)] text-[1.5rem] font-semibold leading-tight tracking-tight">
        {title}
      </h3>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-[color:var(--color-ink-soft)]">
        {body}
      </p>
      <div className="mt-6">{mock}</div>
    </div>
  );
}

function MockUpload() {
  return (
    <div className="rounded-xl border border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)]/70 p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-[color:var(--color-saffron)]/20 text-[color:var(--color-saffron-deep)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[color:var(--color-ink)]">les-misérables.pdf</p>
          <p className="text-[0.7rem] text-[color:var(--color-ink-soft)]">2.4 MB · 487 pages</p>
        </div>
        <span className="rounded-full bg-[color:var(--color-sage)]/20 px-2 py-1 text-[0.65rem] font-semibold text-[color:var(--color-sage-deep)]">100%</span>
      </div>
    </div>
  );
}

function MockTranslate() {
  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-3">
      <p className="mb-2 text-[0.65rem] uppercase tracking-[0.18em] text-[color:var(--color-ink-soft)]">
        Original → Target
      </p>
      <div className="space-y-1.5">
        {[
          { code: "FR", name: "Français", pct: 100, ready: true },
          { code: "JA", name: "日本語", pct: 64, ready: false },
          { code: "AR", name: "العربية", pct: 38, ready: false },
        ].map((l) => (
          <div key={l.code} className="flex items-center gap-3">
            <span className="w-6 rounded-md bg-[color:var(--color-paper-3)] px-1.5 py-0.5 text-center text-[0.6rem] font-bold text-[color:var(--color-ink-soft)]">
              {l.code}
            </span>
            <span className="flex-1 text-[0.8rem] text-[color:var(--color-ink)]">{l.name}</span>
            {l.ready ? (
              <span className="rounded-full bg-[color:var(--color-sage)]/20 px-2 py-0.5 text-[0.62rem] font-bold text-[color:var(--color-sage-deep)]">READY</span>
            ) : (
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[color:var(--color-paper-3)]">
                <div className="h-full bg-gradient-to-r from-[color:var(--color-saffron)] to-[color:var(--color-coral)]" style={{ width: `${l.pct}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MockChat() {
  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-3">
      <div className="space-y-2">
        <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-[color:var(--color-ink)] px-3 py-1.5 text-[0.78rem] text-[color:var(--color-paper)]">
          Why does Jean Valjean steal bread?
        </div>
        <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-sm bg-[color:var(--color-paper-2)] px-3 py-1.5 text-[0.78rem] text-[color:var(--color-ink)]">
          To feed his sister&apos;s seven children, who were starving.{" "}
          <span className="inline-flex translate-y-[-1px] items-center rounded-full bg-[color:var(--color-saffron)]/30 px-1.5 py-0.5 text-[0.6rem] font-bold text-[color:var(--color-saffron-deep)]">p. 23</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── FEATURE SHOWCASE ─────────────────────── */

function FeatureShowcase() {
  return (
    <section id="features" className="relative z-10 mx-auto max-w-6xl px-8 pb-12 lg:px-14">
      <div className="text-center">
        <span className="badge-pill bg-[color:var(--color-coral)]/15 text-[color:var(--color-coral-deep)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-coral)]" />
          What you actually get
        </span>
        <h2 className="mx-auto mt-4 max-w-3xl font-[family-name:var(--font-display)] text-[clamp(2rem,4vw,3rem)] font-semibold leading-tight tracking-tight">
          Every tool you need to <em className="text-[color:var(--color-saffron-deep)]">finish</em> the book.
        </h2>
      </div>

      <div className="mt-14 space-y-12">
        <FeatureRow
          eyebrow="Translation"
          title="Same book. Same shape. Your language."
          body="Tables stay tables. Headings stay headings. We rebuild every page so it looks like the original publisher did it — including right-to-left scripts, CJK, Devanagari, and all 14 supported languages."
          highlights={[
            "Side-by-side reading mode",
            "Inline source-text peek on hover",
            "Export translated PDF with notes",
          ]}
          mock={<TranslateMockBig />}
          align="left"
          tone="saffron"
        />
        <FeatureRow
          eyebrow="Chat"
          title="Ask the book. Get cited answers."
          body="Every reply links to the exact passage it came from — page number, highlighted excerpt, and a jump button. No hallucinations dressed up as answers."
          highlights={[
            "Plain-language Q&A in any of 14 languages",
            "Auto-summaries by chapter",
            "Highlight to ask: select a passage, ask a question",
          ]}
          mock={<ChatMockBig />}
          align="right"
          tone="sage"
        />
        <FeatureRow
          eyebrow="Quizzes"
          title="Wrong? Here&apos;s where to look."
          body="Surprise quizzes generated from what you actually read. Miss one and we'll send you to the page that explains it — not a vague hand-wave."
          highlights={[
            "5, 8 or 12 questions per round",
            "Multiple choice, with citation per answer",
            "Tracks streaks, weak spots, and improvements",
          ]}
          mock={<QuizMockBig />}
          align="left"
          tone="coral"
        />
      </div>
    </section>
  );
}

function FeatureRow({
  eyebrow, title, body, highlights, mock, align, tone,
}: {
  eyebrow: string;
  title: string;
  body: string;
  highlights: string[];
  mock: React.ReactNode;
  align: "left" | "right";
  tone: "saffron" | "sage" | "coral";
}) {
  const dotByTone = {
    saffron: "bg-[color:var(--color-saffron)]",
    sage: "bg-[color:var(--color-sage)]",
    coral: "bg-[color:var(--color-coral)]",
  }[tone];
  const eyebrowText = {
    saffron: "text-[color:var(--color-saffron-deep)]",
    sage: "text-[color:var(--color-sage-deep)]",
    coral: "text-[color:var(--color-coral-deep)]",
  }[tone];

  const text = (
    <div>
      <span className={`badge-pill bg-[color:var(--color-paper-3)] ${eyebrowText}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dotByTone}`} />
        {eyebrow}
      </span>
      <h3 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(1.6rem,3vw,2.2rem)] font-semibold leading-tight tracking-tight">
        {title}
      </h3>
      <p className="mt-3 max-w-lg text-[1rem] leading-relaxed text-[color:var(--color-ink-soft)]">{body}</p>
      <ul className="mt-5 space-y-2 text-[0.95rem] text-[color:var(--color-ink)]">
        {highlights.map((h) => (
          <li key={h} className="flex items-start gap-2.5">
            <Tick /> {h}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
      {align === "left" ? (
        <>
          {text}
          <div>{mock}</div>
        </>
      ) : (
        <>
          <div className="lg:order-2">{text}</div>
          <div className="lg:order-1">{mock}</div>
        </>
      )}
    </div>
  );
}

function TranslateMockBig() {
  return (
    <div className="card-paper-lifted relative p-5">
      <div className="grid grid-cols-2 gap-3">
        <PageMock lang="EN" title="The Curious Reader" lines={["Chapter One — Origins", "She had been reading since the rain began,", "and now the rain had stopped, and she was", "still reading. The cat noticed first."]} />
        <PageMock lang="FR" title="Le Lecteur Curieux" lines={["Chapitre Un — Origines", "Elle lisait depuis le début de la pluie,", "et maintenant la pluie s'était arrêtée,", "et elle lisait encore. Le chat l'a remarqué."]} highlight />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[0.7rem] text-[color:var(--color-ink-soft)]">page 12 / 240</span>
        <div className="flex gap-1.5">
          {["FR","ES","DE","JA","AR","ZH"].map((c) => (
            <span key={c} className="rounded-md bg-[color:var(--color-paper-3)] px-1.5 py-0.5 text-[0.6rem] font-bold text-[color:var(--color-ink-soft)]">{c}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PageMock({
  lang, title, lines, highlight = false,
}: { lang: string; title: string; lines: string[]; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-[color:var(--color-border)] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-[color:var(--color-paper-3)] px-2 py-0.5 text-[0.6rem] font-bold tracking-[0.1em] text-[color:var(--color-ink-soft)]">{lang}</span>
        {highlight && <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-saffron)]" />}
      </div>
      <p className="font-[family-name:var(--font-display)] text-[0.85rem] font-semibold text-[color:var(--color-ink)]">{title}</p>
      <div className="mt-2 space-y-1.5">
        {lines.map((l, i) => (
          <p key={i} className="text-[0.7rem] leading-snug text-[color:var(--color-ink-soft)]">{l}</p>
        ))}
      </div>
    </div>
  );
}

function ChatMockBig() {
  return (
    <div className="card-paper-lifted relative p-5">
      <div className="space-y-3">
        <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-[color:var(--color-ink)] px-4 py-2 text-[0.85rem] text-[color:var(--color-paper)]">
          Summarise chapter 3 in two lines.
        </div>
        <div className="w-fit max-w-[92%] rounded-2xl rounded-bl-sm bg-[color:var(--color-paper-2)] px-4 py-3 text-[0.85rem] leading-relaxed text-[color:var(--color-ink)]">
          Marius leaves home after a fight about politics with his grandfather.
          He moves to a small apartment, broke and proud, and starts to find friends among the students of the ABC.
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Citation page="187" />
            <Citation page="195" />
            <Citation page="201" />
          </div>
        </div>
        <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-[color:var(--color-ink)] px-4 py-2 text-[0.85rem] text-[color:var(--color-paper)]">
          Who are the ABC?
        </div>
        <div className="flex gap-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[color:var(--color-saffron)]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-[color:var(--color-saffron)] [animation-delay:0.15s]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-[color:var(--color-saffron)] [animation-delay:0.3s]" />
          <span className="text-[0.7rem] text-[color:var(--color-ink-soft)]">flipping pages…</span>
        </div>
      </div>
    </div>
  );
}

function Citation({ page }: { page: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-saffron)]/25 px-2 py-0.5 text-[0.65rem] font-bold text-[color:var(--color-saffron-deep)]">
      <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-[color:var(--color-saffron-deep)] text-[0.55rem] text-white">·</span>
      p. {page}
    </span>
  );
}

function QuizMockBig() {
  return (
    <div className="card-paper-lifted relative p-5">
      <div className="flex items-center justify-between">
        <span className="badge-pill bg-[color:var(--color-coral)]/20 text-[color:var(--color-coral-deep)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-coral)]" />
          Question 4 / 8
        </span>
        <span className="text-[0.7rem] font-semibold text-[color:var(--color-ink-soft)]">⏱ 0:42</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--color-paper-3)]">
        <div className="h-full bg-gradient-to-r from-[color:var(--color-coral)] to-[color:var(--color-saffron)]" style={{ width: "50%" }} />
      </div>
      <p className="mt-4 font-[family-name:var(--font-display)] text-[1.05rem] font-semibold leading-snug text-[color:var(--color-ink)]">
        Why does Cosette&apos;s mother send her to live with the Thénardiers?
      </p>
      <div className="mt-3 space-y-2">
        {[
          { l: "A", t: "She wants to remarry without a child", on: false },
          { l: "B", t: "She believes they will care for her well", on: true },
          { l: "C", t: "She is too sick to keep her", on: false },
          { l: "D", t: "She is being arrested", on: false },
        ].map((c) => (
          <div key={c.l} className={`flex items-center gap-3 rounded-xl border-[1.5px] px-3 py-2 ${c.on ? "border-[color:var(--color-sage-deep)] bg-[color:var(--color-sage)]/15" : "border-[color:var(--color-border)] bg-[color:var(--color-paper)]"}`}>
            <span className={`grid h-7 w-7 place-items-center rounded-full font-[family-name:var(--font-display)] text-[0.78rem] font-semibold ${c.on ? "bg-[color:var(--color-sage)] text-white" : "bg-[color:var(--color-paper-3)] text-[color:var(--color-ink-soft)]"}`}>
              {c.l}
            </span>
            <span className="text-[0.85rem] text-[color:var(--color-ink)]">{c.t}</span>
            {c.on && (
              <span className="ml-auto text-[color:var(--color-sage-deep)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── FOR EVERYONE ───────────────────────── */

function ForEveryone() {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-8 pb-24 pt-12 lg:px-14">
      <div className="text-center">
        <span className="badge-pill bg-[color:var(--color-paper-3)] text-[color:var(--color-ink-soft)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-plum)]" />
          One library, every reader
        </span>
        <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2rem,4vw,3rem)] font-semibold leading-tight tracking-tight">
          Built for the way <em className="text-[color:var(--color-saffron-deep)]">your house</em> reads.
        </h2>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <AudienceCard
          rotate="-rotate-[1.5deg]"
          tone="saffron"
          who="Students"
          line="Read the syllabus in your strongest language. Quiz before exams. Cite pages without lifting the cover."
          tags={["University", "High school", "Self-study"]}
        />
        <AudienceCard
          rotate="rotate-[1deg]"
          tone="sage"
          who="Lifelong readers"
          line="Finally finish that French novel. Skim a German paper. Read a Japanese manga in your own pace, your own tongue."
          tags={["Hobbyists", "Polyglots", "Travel"]}
        />
        <AudienceCard
          rotate="-rotate-[0.5deg]"
          tone="coral"
          who="Children"
          line="A friendlier mascot, a lower reading age, kid-safe chat, and parents who can see exactly what's being read."
          tags={["Ages 7+", "Family library", "Parent dashboard"]}
        />
      </div>
    </section>
  );
}

function AudienceCard({
  rotate, tone, who, line, tags,
}: { rotate: string; tone: "saffron" | "sage" | "coral"; who: string; line: string; tags: string[] }) {
  const colors = {
    saffron: { bg: "bg-gradient-to-br from-[#FFFBF0] to-[#FBE9C2]", chip: "bg-[color:var(--color-saffron)]/20", chipText: "text-[color:var(--color-saffron-deep)]" },
    sage:    { bg: "bg-gradient-to-br from-[#F4F8EC] to-[#DDEAD2]", chip: "bg-[color:var(--color-sage)]/20",    chipText: "text-[color:var(--color-sage-deep)]" },
    coral:   { bg: "bg-gradient-to-br from-[#FFF1EE] to-[#F6CCC4]", chip: "bg-[color:var(--color-coral)]/20",   chipText: "text-[color:var(--color-coral-deep)]" },
  }[tone];
  return (
    <div className={`relative ${rotate} rounded-[1.4rem] border border-[color:var(--color-border)] ${colors.bg} p-7 shadow-[var(--shadow-paper)] transition-transform duration-300 hover:rotate-0 hover:-translate-y-1`}>
      <h3 className="font-[family-name:var(--font-display)] text-[1.6rem] font-semibold leading-tight tracking-tight">
        For <em>{who}</em>.
      </h3>
      <p className="mt-3 text-[0.95rem] leading-relaxed text-[color:var(--color-ink-soft)]">{line}</p>
      <div className="mt-5 flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span key={t} className={`badge-pill ${colors.chip} ${colors.chipText}`}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── LANGUAGES ───────────────────────── */

const LANGUAGES = [
  { f: "🇬🇧", n: "English" },
  { f: "🇫🇷", n: "Français" },
  { f: "🇪🇸", n: "Español" },
  { f: "🇩🇪", n: "Deutsch" },
  { f: "🇮🇹", n: "Italiano" },
  { f: "🇵🇹", n: "Português" },
  { f: "🇳🇱", n: "Nederlands" },
  { f: "🇸🇦", n: "العربية" },
  { f: "🇨🇳", n: "中文" },
  { f: "🇯🇵", n: "日本語" },
  { f: "🇰🇷", n: "한국어" },
  { f: "🇷🇺", n: "Русский" },
  { f: "🇮🇳", n: "हिन्दी" },
  { f: "🇹🇷", n: "Türkçe" },
];

function LanguagesStrip() {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-8 pb-24 lg:px-14">
      <div className="card-paper-lifted overflow-hidden p-8 lg:p-10">
        <div className="grid items-center gap-8 lg:grid-cols-[2fr_3fr]">
          <div>
            <span className="badge-pill bg-[color:var(--color-paper-3)] text-[color:var(--color-ink-soft)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-coral)]" />
              14 languages, every script
            </span>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(1.7rem,3vw,2.2rem)] font-semibold leading-tight tracking-tight">
              Latin, Cyrillic, Arabic, CJK, Devanagari — we handle the typography so the page still feels like a book.
            </h2>
            <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-[color:var(--color-ink-soft)]">
              That includes proper right-to-left flow for Arabic and Hebrew, vertical script support
              for CJK where the source uses it, and embedded fonts so nothing renders as a row of question marks.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-4">
            {LANGUAGES.map((l, i) => (
              <div
                key={l.n}
                className="flex items-center gap-2.5 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-paper)] px-3 py-2.5 shadow-[0_1px_0_rgba(74,60,30,0.04)] transition-all hover:-translate-y-[1px] hover:border-[color:var(--color-saffron-deep)]"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <span className="text-lg leading-none">{l.f}</span>
                <span className="truncate text-[0.85rem] font-semibold text-[color:var(--color-ink)]">{l.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── TESTIMONIALS ───────────────────────── */

function Testimonials() {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-8 pb-24 lg:px-14">
      <div className="text-center">
        <span className="badge-pill bg-[color:var(--color-coral)]/15 text-[color:var(--color-coral-deep)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-coral)]" />
          Loved by readers
        </span>
        <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2rem,4vw,3rem)] font-semibold leading-tight tracking-tight">
          What readers are saying.
        </h2>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <Quote
          rotate="-rotate-[1.2deg]"
          tone="paper"
          quote="I read Tolstoy in his own pace, in my own language. The chat told me what I missed and pointed me back to the page. I finished the book."
          name="Léa M."
          role="Literature student, Paris"
        />
        <Quote
          rotate="rotate-[1.4deg]"
          tone="saffron"
          quote="My ten-year-old reads bedtime stories in Spanish now and quizzes me on them in the morning. He is winning."
          name="Daniel K."
          role="Father of two"
          highlight
        />
        <Quote
          rotate="-rotate-[0.6deg]"
          tone="paper"
          quote="I had a 600-page Mandarin textbook I'd been avoiding for a year. Translify made it readable in an afternoon — and the citations are spot-on."
          name="Mira T."
          role="PhD candidate, EPFL"
        />
      </div>
    </section>
  );
}

function Quote({
  rotate, tone, quote, name, role, highlight = false,
}: { rotate: string; tone: "paper" | "saffron"; quote: string; name: string; role: string; highlight?: boolean }) {
  const bg = tone === "saffron" ? "bg-gradient-to-br from-[#FFFBF0] to-[#FBE9C2]" : "bg-[color:var(--color-paper)]";
  return (
    <figure className={`relative ${rotate} rounded-[1.3rem] border border-[color:var(--color-border)] ${bg} p-7 shadow-[var(--shadow-paper)] transition-transform duration-300 hover:rotate-0 hover:-translate-y-1`}>
      <div aria-hidden className="absolute -top-4 left-6 font-[family-name:var(--font-display)] text-[3.5rem] leading-none text-[color:var(--color-saffron-deep)]/40">
        “
      </div>
      <blockquote className="relative font-[family-name:var(--font-display)] text-[1.05rem] italic leading-snug text-[color:var(--color-ink)]">
        {quote}
      </blockquote>
      {highlight && (
        <div className="mt-3 flex items-center gap-1 text-[0.85rem] text-[color:var(--color-saffron-deep)]">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i}>★</span>
          ))}
        </div>
      )}
      <figcaption className="mt-5 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--color-paper-3)] font-[family-name:var(--font-display)] text-sm font-semibold text-[color:var(--color-ink)]">
          {name.charAt(0)}
        </span>
        <div>
          <p className="text-[0.85rem] font-semibold text-[color:var(--color-ink)]">{name}</p>
          <p className="text-[0.72rem] text-[color:var(--color-ink-soft)]">{role}</p>
        </div>
      </figcaption>
    </figure>
  );
}

/* ───────────────────────── FINAL CTA ───────────────────────── */

function FinalCTA() {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-8 pb-24 lg:px-14">
      <div className="relative overflow-hidden rounded-[1.6rem] border border-[color:var(--color-border-strong)] bg-gradient-to-br from-[#FFFBF0] via-[#FBE9C2] to-[#F2D292] p-10 shadow-[var(--shadow-paper-lg)] lg:p-14">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[color:var(--color-saffron)]/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 left-10 h-72 w-72 rounded-full bg-[color:var(--color-coral)]/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <span className="badge-pill bg-[color:var(--color-paper)] text-[color:var(--color-ink)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-coral)]" />
            Ready when you are
          </span>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.2rem,4.5vw,3.4rem)] font-semibold leading-[1.05] tracking-tight">
            Stop wishing you&apos;d read it.
            <br />
            <em className="text-[color:var(--color-saffron-deep)]">Read it.</em>
          </h2>
          <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed text-[color:var(--color-ink-soft)]">
            Pick a plan, drop your first book, and read the way you mean to. If 30 days in
            you don&apos;t love it, we refund you in full — no forms, no friction.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/onboarding"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-[color:var(--color-ink)] px-7 font-semibold text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4),0_10px_22px_-8px_rgba(20,16,8,0.5)] transition-transform hover:-translate-y-[2px]"
            >
              Start your 30-day trial
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
            <a
              href="#pricing"
              className="inline-flex h-12 items-center rounded-full border-[1.5px] border-[color:var(--color-ink)] bg-[color:var(--color-paper)] px-6 font-semibold text-[color:var(--color-ink)] hover:bg-[color:var(--color-paper-2)]"
            >
              Compare plans
            </a>
          </div>
          <p className="mt-5 text-xs text-[color:var(--color-ink-soft)]">
            No free plan. No surprise charges. Cancel any time, refund within 30 days.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── FOOTER ───────────────────────── */

function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-[color:var(--color-border)] bg-[color:var(--color-paper-2)]/60 px-8 py-12 lg:px-14">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-[0.88rem] leading-relaxed text-[color:var(--color-ink-soft)]">
            A reading companion that translates whole books, answers your questions with citations,
            and quizzes you so it sticks.
          </p>
        </div>
        <FooterCol
          heading="Product"
          links={[
            { label: "How it works", href: "#how" },
            { label: "Features", href: "#features" },
            { label: "Pricing", href: "#pricing" },
            { label: "Languages", href: "#features" },
          ]}
        />
        <FooterCol
          heading="Company"
          links={[
            { label: "Manifesto", href: "/" },
            { label: "Blog", href: "/" },
            { label: "Careers", href: "/" },
            { label: "Press kit", href: "/" },
          ]}
        />
        <FooterCol
          heading="Help"
          links={[
            { label: "FAQ", href: "#faq" },
            { label: "Refund policy", href: "#faq" },
            { label: "Contact", href: "mailto:hello@translify.app" },
            { label: "Status", href: "/" },
          ]}
        />
      </div>
      <div className="mx-auto mt-10 flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-dashed border-[color:var(--color-border)] pt-6 text-[0.78rem] text-[color:var(--color-ink-soft)] md:flex-row">
        <p>Made with patience for readers everywhere · © {new Date().getFullYear()} Translify</p>
        <div className="flex gap-5">
          <Link href="/" className="hover:text-[color:var(--color-ink)]">Privacy</Link>
          <Link href="/" className="hover:text-[color:var(--color-ink)]">Terms</Link>
          <Link href="/" className="hover:text-[color:var(--color-ink)]">Cookies</Link>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ heading, links }: { heading: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="font-[family-name:var(--font-display)] text-[0.95rem] font-semibold text-[color:var(--color-ink)]">{heading}</h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-[0.85rem] text-[color:var(--color-ink-soft)] transition-colors hover:text-[color:var(--color-ink)]">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───────────────────────── SHARED BITS ───────────────────────── */

function Underline() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 220 14"
      preserveAspectRatio="none"
      className="absolute -bottom-1 left-0 h-3 w-full text-[color:var(--color-saffron)]/55"
    >
      <path
        d="M2 8 C 50 1, 100 13, 218 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Tick() {
  return (
    <span className="grid h-5 w-5 place-items-center rounded-full bg-[color:var(--color-sage)]/20 text-[color:var(--color-sage-deep)]">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

function DecorBackdrop() {
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-24 h-96 w-96 rounded-full bg-[color:var(--color-saffron)]/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-32 top-40 h-[28rem] w-[28rem] rounded-full bg-[color:var(--color-sage)]/12 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[color:var(--color-coral)]/10 blur-3xl" />
    </>
  );
}

function BookStack() {
  return (
    <div className="relative mx-auto aspect-[5/6] max-w-md">
      <div className="absolute left-2 top-10 h-[78%] w-[68%] -rotate-[7deg] rounded-2xl bg-gradient-to-br from-[#9CC0A0] to-[#5F8763] shadow-[0_30px_60px_-20px_rgba(60,90,60,0.5)]">
        <div className="absolute inset-0 rounded-2xl border border-white/20" />
        <div className="absolute left-3 top-6 h-[1px] w-12 bg-white/40" />
        <div className="absolute left-3 top-9 h-[1px] w-10 bg-white/30" />
        <div className="absolute bottom-6 right-5 font-[family-name:var(--font-display)] text-2xl italic text-white/80">étude</div>
      </div>
      <div className="absolute right-3 top-4 h-[82%] w-[64%] rotate-[5deg] rounded-2xl bg-gradient-to-br from-[#EE9A91] to-[#C5594D] shadow-[0_30px_60px_-20px_rgba(180,80,70,0.45)]">
        <div className="absolute inset-0 rounded-2xl border border-white/25" />
        <div className="absolute left-4 top-5 font-[family-name:var(--font-display)] text-xs uppercase tracking-[0.3em] text-white/70">chapter one</div>
        <div className="absolute left-4 top-12 font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight text-white/95">
          The
          <br />
          Curious
          <br />
          <em className="font-normal">Reader</em>
        </div>
      </div>
      <div className="absolute bottom-0 left-1/2 h-[88%] w-[72%] -translate-x-1/2 rotate-[-2deg] rounded-2xl bg-gradient-to-br from-[#FFFBF0] to-[#F4ECDB] shadow-[0_40px_70px_-20px_rgba(60,40,15,0.35)]">
        <div className="absolute inset-0 rounded-2xl border border-[color:var(--color-border-strong)]/60" />
        <div className="absolute bottom-3 left-3 top-3 w-2 rounded-l-md bg-[color:var(--color-saffron)]/70" />
        <div className="absolute inset-y-3 left-7 right-3 flex flex-col justify-between p-3">
          <div className="space-y-1.5">
            <div className="h-1.5 w-12 rounded-full bg-[color:var(--color-ink)]/70" />
            <div className="h-1 w-20 rounded-full bg-[color:var(--color-ink-soft)]/50" />
          </div>
          <div className="font-[family-name:var(--font-display)] text-[color:var(--color-ink)]">
            <p className="text-[0.65rem] uppercase tracking-[0.25em] text-[color:var(--color-ink-soft)]">⤳ now in français</p>
            <h3 className="mt-1 text-[1.4rem] font-semibold leading-tight">
              Le Lecteur
              <br />
              <em className="text-[color:var(--color-saffron-deep)]">Curieux</em>
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[color:var(--color-sage)]" />
            <span className="h-2 w-2 rounded-full bg-[color:var(--color-coral)]" />
            <span className="h-2 w-2 rounded-full bg-[color:var(--color-saffron)]" />
            <span className="ml-2 text-[0.65rem] text-[color:var(--color-ink-soft)]">p. 12 / 240</span>
          </div>
        </div>
      </div>
      <div className="absolute -right-2 bottom-12 hidden rotate-[6deg] rounded-2xl bg-white px-3 py-2 text-xs shadow-[0_18px_30px_-10px_rgba(60,40,15,0.25)] sm:block">
        <p className="font-[family-name:var(--font-display)] text-[color:var(--color-ink)]">“What&apos;s the moral?”</p>
        <div className="mt-1 flex items-center gap-1 text-[0.65rem] text-[color:var(--color-sage-deep)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-sage)]" />
          answered with citations
        </div>
      </div>
      <div className="absolute -left-3 top-16 hidden -rotate-[10deg] rounded-full bg-[color:var(--color-coral)] px-3 py-1.5 text-xs font-semibold text-white shadow-[0_12px_22px_-8px_rgba(197,89,77,0.55)] sm:flex">
        ★ 8 / 10 — nice work!
      </div>
    </div>
  );
}
