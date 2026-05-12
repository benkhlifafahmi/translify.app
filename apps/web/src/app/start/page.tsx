import type { Metadata } from "next";
import Link from "next/link";
import { TranslifyIcon } from "@/components/translify-mark";

// Ad landing page — intentionally noindex to avoid competing with the homepage.
export const metadata: Metadata = {
  title: "Read any book — in any language · Translify",
  description:
    "Upload a PDF or EPUB. Translify rebuilds it in your language, with AI explanations, book chat, and quiz mode.",
  robots: { index: false, follow: false },
};

const TESTIMONIALS = [
  {
    quote:
      "I read Tolstoy in his pace — in mine. The Scholar plan paid itself back in one semester.",
    name: "Léa M.",
    role: "Graduate student, Paris",
    initial: "L",
    tone: "saffron" as const,
  },
  {
    quote:
      "600-page papers in Mandarin, summarised and citable. Translify is my unfair advantage.",
    name: "Mira T.",
    role: "Research analyst",
    initial: "M",
    tone: "plum" as const,
  },
  {
    quote:
      "Bedtime stories in Spanish, quizzes in English at breakfast. He's winning, and so am I.",
    name: "Daniel K.",
    role: "Parent of 3",
    initial: "D",
    tone: "coral" as const,
  },
];

const FEATURES = [
  {
    emoji: "📖",
    title: "Same book. Same shape. Your language.",
    body: "Tables stay tables. Headings stay headings. We rebuild every page so it looks like the original publisher did it — right-to-left, CJK, Devanagari, all 14 languages.",
    tone: "saffron" as const,
  },
  {
    emoji: "💬",
    title: "Ask the book. Get cited answers.",
    body: "Every reply links to the exact passage it came from — page, highlighted excerpt, and a jump button. No hallucinations dressed up as answers.",
    tone: "sage" as const,
  },
  {
    emoji: "🧠",
    title: "Quiz yourself to remember.",
    body: "Surprise quizzes generated from what you actually read. Miss one and we'll send you straight to the page that explains it.",
    tone: "plum" as const,
  },
];

const LANGS = [
  { flag: "🇬🇧", label: "English" },
  { flag: "🇫🇷", label: "Français" },
  { flag: "🇪🇸", label: "Español" },
  { flag: "🇩🇪", label: "Deutsch" },
  { flag: "🇯🇵", label: "日本語" },
  { flag: "🇸🇦", label: "العربية" },
  { flag: "🇮🇩", label: "Indonesia" },
  { flag: "🇲🇾", label: "Malaysia" },
  { flag: "🇨🇳", label: "中文" },
  { flag: "🇰🇷", label: "한국어" },
  { flag: "🇧🇷", label: "Português" },
  { flag: "🇳🇱", label: "Nederlands" },
  { flag: "🇮🇳", label: "हिन्दी" },
  { flag: "🇹🇷", label: "Türkçe" },
];

export default function StartPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[color:var(--color-paper)]">
      <Blobs />

      {/* ── Minimal nav — no distractions ── */}
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 py-5 lg:px-10">
        <Link
          href="/"
          aria-label="Translify"
          className="flex items-center gap-2.5 font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-[color:var(--color-ink)]"
        >
          <TranslifyIcon size={34} />
          Translify
        </Link>
        <Link
          href="/login"
          className="text-sm font-semibold text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)] transition-colors"
        >
          Already a reader? Log in
        </Link>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-14 pt-12 text-center lg:px-10 lg:pt-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-saffron-deep)]/30 bg-[color:var(--color-saffron)]/15 px-4 py-1.5 text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[color:var(--color-saffron-deep)]">
          ✦ For readers who want more from every book
        </div>

        <h1 className="mt-6 font-[family-name:var(--font-display)] text-[clamp(2.6rem,7vw,5rem)] font-semibold leading-[1.02] tracking-tight text-[color:var(--color-ink)]">
          Read any book.
          <br />
          <em className="text-[color:var(--color-saffron-deep)]">Finally</em> in your language.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-[1.05rem] leading-relaxed text-[color:var(--color-ink-soft)]">
          Upload a PDF or EPUB in any language. Translify rebuilds it page by page in your
          language — with AI explanations, a chat that cites the text, and quiz mode to make sure
          you remember what you read.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4">
          <Link
            href="/join"
            className="group inline-flex h-14 items-center gap-2.5 rounded-full bg-[color:var(--color-ink)] px-8 font-[family-name:var(--font-display)] text-[1.05rem] font-semibold text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4),0_16px_32px_-10px_rgba(20,16,8,0.45)] transition-all hover:-translate-y-[3px] hover:shadow-[0_2px_0_rgba(20,16,8,0.4),0_24px_40px_-10px_rgba(20,16,8,0.45)]"
          >
            Start free — no card needed
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>

          <p className="text-[0.78rem] text-[color:var(--color-ink-soft)]">
            14-day free trial &nbsp;·&nbsp; No credit card &nbsp;·&nbsp; 30-day money-back guarantee
          </p>
        </div>

        {/* Stats micro-strip */}
        <div className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-3">
          {[
            { n: "42,000+", l: "books read" },
            { n: "9.4 / 10", l: "reader satisfaction" },
            { n: "30 days", l: "money-back, always" },
          ].map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-paper-2)]/60 px-4 py-3 text-center shadow-[var(--shadow-paper)]"
            >
              <p className="font-[family-name:var(--font-display)] text-[1.4rem] font-semibold leading-tight text-[color:var(--color-ink)]">
                {s.n}
              </p>
              <p className="mt-0.5 text-[0.68rem] uppercase tracking-[0.16em] text-[color:var(--color-ink-soft)]">
                {s.l}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Product preview ── */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 lg:px-10">
        <div className="overflow-hidden rounded-[1.6rem] border border-[color:var(--color-border)] bg-[color:var(--color-paper)] shadow-[0_4px_0_rgba(20,16,8,0.06),0_24px_60px_-12px_rgba(20,16,8,0.2)]">
          {/* Chrome bar */}
          <div className="flex items-center gap-2 border-b border-[color:var(--color-border)] bg-[color:var(--color-paper-2)] px-5 py-3">
            <span className="h-3 w-3 rounded-full bg-[#FF6058]" />
            <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
            <span className="h-3 w-3 rounded-full bg-[#28C941]" />
            <span className="ml-4 flex-1 rounded-md bg-[color:var(--color-paper-3)] px-3 py-1 text-center text-[0.72rem] text-[color:var(--color-ink-soft)]">
              translify.app/read/french-novel/in/english
            </span>
          </div>

          {/* Split-reader mockup */}
          <div className="grid divide-x divide-[color:var(--color-border)] sm:grid-cols-2">
            {/* Original text column */}
            <div className="p-6">
              <p className="mb-3 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[color:var(--color-ink-soft)]">
                🇫🇷 Original
              </p>
              <p className="font-[family-name:var(--font-display)] text-[0.95rem] leading-relaxed text-[color:var(--color-ink)]/70 italic">
                «&nbsp;Longtemps, je me suis couché de bonne heure. Parfois, à peine ma bougie
                éteinte, mes yeux se fermaient si vite que je n'avais pas le temps de me dire
                :&nbsp;«&nbsp;Je m'endors.&nbsp;»&nbsp;»
              </p>
              <p className="mt-3 text-[0.75rem] text-[color:var(--color-ink-soft)]">
                — Marcel Proust, <em>Du côté de chez Swann</em>
              </p>
            </div>

            {/* Translation column */}
            <div className="relative bg-gradient-to-br from-[#FFFBF0] to-[#FAF0D5] p-6">
              <p className="mb-3 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[color:var(--color-saffron-deep)]">
                🇬🇧 Translify
              </p>
              <p className="font-[family-name:var(--font-display)] text-[0.95rem] leading-relaxed text-[color:var(--color-ink)]">
                "For a long time I would go to bed early. Sometimes, the candle barely out, my eyes
                would close so quickly that I had not even time to say to myself: 'I'm falling
                asleep.'"
              </p>

              {/* Chat bubble overlay */}
              <div className="mt-5 rounded-2xl border border-[color:var(--color-saffron-deep)]/20 bg-white/80 px-4 py-3 shadow-[var(--shadow-paper)]">
                <p className="text-[0.72rem] font-bold text-[color:var(--color-saffron-deep)]">
                  💬 You asked:
                </p>
                <p className="mt-1 text-[0.82rem] text-[color:var(--color-ink)]">
                  "What does this opening line suggest about memory?"
                </p>
                <p className="mt-2 border-t border-[color:var(--color-border)] pt-2 text-[0.78rem] leading-snug text-[color:var(--color-ink-soft)]">
                  Proust signals that memory is involuntary — the narrator slips into sleep without
                  conscious intention, mirroring how memories surface unexpectedly throughout the
                  novel.{" "}
                  <span className="rounded bg-[color:var(--color-saffron)]/30 px-1 text-[color:var(--color-saffron-deep)]">
                    p. 1
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Language strip ── */}
      <section className="relative z-10 mx-auto mt-14 max-w-4xl px-6 lg:px-10">
        <p className="mb-4 text-center text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[color:var(--color-ink-soft)]">
          14 languages — every script supported
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {LANGS.map((l) => (
            <span
              key={l.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-paper-2)] px-3 py-1.5 text-[0.82rem] text-[color:var(--color-ink-soft)]"
            >
              <span>{l.flag}</span>
              {l.label}
            </span>
          ))}
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="relative z-10 mx-auto mt-16 max-w-4xl px-6 lg:px-10">
        <p className="mb-2 text-center text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[color:var(--color-saffron-deep)]">
          What you actually get
        </p>
        <h2 className="mb-10 text-center font-[family-name:var(--font-display)] text-[clamp(1.8rem,4vw,2.8rem)] font-semibold leading-tight tracking-tight text-[color:var(--color-ink)]">
          Everything you need to{" "}
          <em className="text-[color:var(--color-saffron-deep)]">finish</em> the book.
        </h2>

        <div className="grid gap-5 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="relative z-10 mx-auto mt-16 max-w-4xl px-6 lg:px-10">
        <p className="mb-8 text-center text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[color:var(--color-ink-soft)]">
          ★★★★★&nbsp; Loved by readers
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.name} {...t} />
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="relative z-10 mx-auto mt-20 max-w-2xl px-6 pb-24 text-center lg:px-10">
        <div className="overflow-hidden rounded-[2rem] border border-[color:var(--color-border)] bg-gradient-to-br from-[color:var(--color-ink)] to-[#2A2218] p-10 shadow-[0_4px_0_rgba(20,16,8,0.5),0_32px_64px_-16px_rgba(20,16,8,0.5)]">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[color:var(--color-saffron)]">
            Ready when you are
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.8rem,4vw,2.8rem)] font-semibold leading-tight tracking-tight text-[color:var(--color-paper)]">
            Stop wishing you'd read it.
            <br />
            <span className="text-[color:var(--color-saffron)]">Read it.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-[0.92rem] leading-relaxed text-[color:var(--color-paper)]/60">
            Start free today — no card, no commitment. If 30 days in you don't love it, we refund
            you in full, no questions.
          </p>

          <Link
            href="/join"
            className="group mt-8 inline-flex h-14 items-center gap-2.5 rounded-full bg-[color:var(--color-saffron)] px-8 font-[family-name:var(--font-display)] text-[1.05rem] font-semibold text-[color:var(--color-ink)] shadow-[0_2px_0_rgba(20,16,8,0.3),0_12px_28px_-8px_rgba(20,16,8,0.6)] transition-all hover:-translate-y-[2px]"
          >
            Start free now
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>

          <p className="mt-4 text-[0.75rem] text-[color:var(--color-paper)]/40">
            14-day free trial &nbsp;·&nbsp; No credit card &nbsp;·&nbsp; Cancel anytime
          </p>
        </div>
      </section>
    </main>
  );
}

/* ─── Sub-components ─── */

function Blobs() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-32 h-[32rem] w-[32rem] rounded-full bg-[color:var(--color-saffron)]/12 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-60 h-[28rem] w-[28rem] rounded-full bg-[color:var(--color-sage)]/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-40 left-1/3 h-72 w-72 rounded-full bg-[color:var(--color-coral)]/8 blur-3xl"
      />
    </>
  );
}

const toneMap = {
  saffron: {
    bg: "bg-gradient-to-br from-[#FFFBF0] to-[#FBE9C2]",
    icon: "bg-[color:var(--color-saffron)]/25 text-[color:var(--color-saffron-deep)]",
    ring: "border-[color:var(--color-saffron-deep)]/20",
    avatar: "bg-[color:var(--color-saffron)]/20 text-[color:var(--color-saffron-deep)]",
  },
  sage: {
    bg: "bg-gradient-to-br from-[#F4F8EC] to-[#DDEAD2]",
    icon: "bg-[color:var(--color-sage)]/25 text-[color:var(--color-sage-deep)]",
    ring: "border-[color:var(--color-sage-deep)]/20",
    avatar: "bg-[color:var(--color-sage)]/20 text-[color:var(--color-sage-deep)]",
  },
  plum: {
    bg: "bg-gradient-to-br from-[#F4EEF7] to-[#E0D2EA]",
    icon: "bg-[color:var(--color-plum)]/20 text-[color:var(--color-plum)]",
    ring: "border-[color:var(--color-plum)]/20",
    avatar: "bg-[color:var(--color-plum)]/20 text-[color:var(--color-plum)]",
  },
  coral: {
    bg: "bg-gradient-to-br from-[#FFF1EE] to-[#F6CCC4]",
    icon: "bg-[color:var(--color-coral)]/20 text-[color:var(--color-coral-deep)]",
    ring: "border-[color:var(--color-coral-deep)]/20",
    avatar: "bg-[color:var(--color-coral)]/20 text-[color:var(--color-coral-deep)]",
  },
};

function FeatureCard({
  emoji,
  title,
  body,
  tone,
}: {
  emoji: string;
  title: string;
  body: string;
  tone: keyof typeof toneMap;
}) {
  const s = toneMap[tone];
  return (
    <div
      className={`flex flex-col gap-4 rounded-[1.4rem] border ${s.ring} ${s.bg} p-6 shadow-[var(--shadow-paper)]`}
    >
      <span
        className={`grid h-12 w-12 place-items-center rounded-2xl text-xl ${s.icon}`}
      >
        {emoji}
      </span>
      <div>
        <h3 className="font-[family-name:var(--font-display)] text-[1.1rem] font-semibold leading-snug tracking-tight text-[color:var(--color-ink)]">
          {title}
        </h3>
        <p className="mt-2 text-[0.88rem] leading-relaxed text-[color:var(--color-ink-soft)]">
          {body}
        </p>
      </div>
    </div>
  );
}

function TestimonialCard({
  quote,
  name,
  role,
  initial,
  tone,
}: {
  quote: string;
  name: string;
  role: string;
  initial: string;
  tone: keyof typeof toneMap;
}) {
  const s = toneMap[tone];
  return (
    <div className="flex flex-col gap-4 rounded-[1.4rem] border border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-6 shadow-[var(--shadow-paper)]">
      <span className="font-[family-name:var(--font-display)] text-[2.8rem] leading-[0.7] text-[color:var(--color-saffron-deep)]/35">
        "
      </span>
      <p className="flex-1 font-[family-name:var(--font-display)] text-[0.92rem] italic leading-snug text-[color:var(--color-ink)]">
        {quote}
      </p>
      <div className="flex items-center gap-3 border-t border-[color:var(--color-border)] pt-4">
        <span
          className={`grid h-9 w-9 place-items-center rounded-full ${s.avatar} font-[family-name:var(--font-display)] text-[0.85rem] font-semibold`}
        >
          {initial}
        </span>
        <div>
          <p className="text-[0.82rem] font-semibold text-[color:var(--color-ink)]">{name}</p>
          <p className="text-[0.72rem] text-[color:var(--color-ink-soft)]">{role}</p>
        </div>
        <span className="ml-auto text-xs tracking-wide text-[color:var(--color-saffron-deep)]">
          ★★★★★
        </span>
      </div>
    </div>
  );
}
