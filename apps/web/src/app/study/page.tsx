import type { Metadata } from "next";
import Link from "next/link";
import { TranslifyIcon } from "@/components/translify-mark";

// Dedicated paid-social landing page (mostly mobile). Single goal: click →
// /join (anonymous, no-card activation), where the existing funnel + paywall
// converts to a subscription. Noindexed so it doesn't compete with the
// homepage in organic search; ad traffic lands here directly.
export const metadata: Metadata = {
  title: "Study any book, ace the exam",
  description:
    "Turn any textbook, paper, or PDF into a study workspace: a tutor with cited answers, quizzes and flashcards from your reading, and a focus timer. Start free, no card.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/study" },
};

const JOIN = "/join?ref=study";

export default function StudyLanding() {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[color:var(--color-paper)] pb-28 lg:pb-0">
      <Blobs />
      <TopBar />

      <div className="relative z-10 mx-auto w-full max-w-xl px-5 sm:px-6">
        <Hero />
        <RatingStrip />
        <HowItWorks />
        <Workspace />
        <Testimonials />
        <Offer />
        <Faq />
        <FinalCta />
        <Footer />
      </div>

      <StickyCta />
    </main>
  );
}

/* ───────────────────────── chrome ───────────────────────── */

function TopBar() {
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
        Log in
      </Link>
    </header>
  );
}

/* ───────────────────────── hero ───────────────────────── */

function Hero() {
  return (
    <section className="pt-8 text-center">
      <span className="badge-pill bg-[color:var(--color-paper-3)] text-[color:var(--color-ink-soft)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-saffron)]" />
        For students
      </span>

      <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.4rem,9vw,3.4rem)] font-semibold leading-[1.04] tracking-tight text-[color:var(--color-ink)]">
        Study any book.
        <br />
        <span className="relative inline-block">
          <span className="relative z-10 italic text-[color:var(--color-saffron-deep)]">
            Ace the exam.
          </span>
          <Underline />
        </span>
      </h1>

      <p className="mx-auto mt-4 max-w-md text-[1.02rem] leading-relaxed text-[color:var(--color-ink-soft)]">
        Drop in your textbook, paper, or notes. Translify turns it into a study
        workspace: a tutor that answers with cited pages, quizzes and flashcards
        from what you read, and a focus timer.
      </p>

      <div className="mt-7">
        <PrimaryCta />
        <p className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[0.78rem] font-medium text-[color:var(--color-ink-soft)]">
          <Tick /> No card to start
          <Tick /> 30-day money-back
          <Tick /> 14 languages
        </p>
      </div>

      <div className="mt-10">
        <PhoneMock />
      </div>
    </section>
  );
}

function PrimaryCta({ label = "Start studying, free" }: { label?: string }) {
  return (
    <Link
      href={JOIN}
      className="group inline-flex h-13 w-full max-w-sm items-center justify-center gap-2 rounded-full bg-[color:var(--color-saffron)] px-7 py-3.5 text-base font-semibold text-[color:var(--color-accent-foreground)] shadow-[0_2px_0_rgba(140,90,30,0.5),0_14px_28px_-10px_rgba(200,137,62,0.65)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-[2px] active:scale-[0.98] active:translate-y-0"
    >
      {label}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-1">
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </Link>
  );
}

/* ───────────────────────── rating ───────────────────────── */

function RatingStrip() {
  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-paper-2)]/50 px-5 py-3 text-center">
        <Stars />
        <p className="text-sm text-[color:var(--color-ink-soft)]">
          <span className="font-semibold text-[color:var(--color-ink)]">9.4 / 10</span> from
          students at 600+ universities
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
  const steps = [
    { n: "01", tone: "saffron", title: "Add your book", body: "PDF or EPUB. Textbook, paper, lecture notes, anything you need to learn." },
    { n: "02", tone: "sage", title: "Study with a tutor", body: "Ask anything and get answers that cite the exact page. Highlight as you read." },
    { n: "03", tone: "coral", title: "Quiz, drill, remember", body: "Your highlights become flashcards and quizzes. Walk into the exam ready." },
  ] as const;
  return (
    <section className="mt-16">
      <h2 className="text-center font-[family-name:var(--font-display)] text-[clamp(1.7rem,6vw,2.2rem)] font-semibold leading-tight tracking-tight">
        From textbook to <em className="text-[color:var(--color-saffron-deep)]">exam-ready</em>.
      </h2>
      <div className="mt-7 flex flex-col gap-3">
        {steps.map((s) => (
          <Step key={s.n} {...s} />
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
  const items = [
    { tone: "sage", title: "Cited tutor chat", body: "Ask anything, every answer links to the exact page. No made-up sources." },
    { tone: "coral", title: "Quizzes that find your gaps", body: "Generated from what you read. Miss one and it sends you to the page that explains it." },
    { tone: "plum", title: "One-tap flashcards", body: "Turn your highlights into spaced-repetition cards that come back before you forget." },
    { tone: "saffron", title: "Focus timer + goals", body: "A study timer and a daily goal that keep you in the chair." },
  ] as const;
  return (
    <section className="mt-16">
      <h2 className="text-center font-[family-name:var(--font-display)] text-[clamp(1.7rem,6vw,2.2rem)] font-semibold leading-tight tracking-tight">
        Everything you need to <em className="text-[color:var(--color-saffron-deep)]">learn it</em>.
      </h2>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {items.map((it) => (
          <div key={it.title} className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-4 shadow-[var(--shadow-paper)]">
            <span className={`inline-grid h-9 w-9 place-items-center rounded-xl ${TONE[it.tone].bg} ${TONE[it.tone].text}`}>
              <Dot />
            </span>
            <h3 className="mt-3 text-[1rem] font-semibold text-[color:var(--color-ink)]">{it.title}</h3>
            <p className="mt-1 text-[0.86rem] leading-relaxed text-[color:var(--color-ink-soft)]">{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── testimonials ───────────────────────── */

function Testimonials() {
  const quotes = [
    { q: "Two quizzes the night before my exam. Same score as a week of flashcards.", r: "Med student · 3rd year" },
    { q: "I turned a term of highlights into flashcards in one tap. Walked into finals actually ready.", r: "Law student · finals week" },
    { q: "I asked a 600-page paper what its argument was. It cited me three pages and saved my weekend.", r: "PhD candidate · Berlin" },
  ];
  return (
    <section className="mt-16">
      <div className="flex flex-col gap-3">
        {quotes.map((t) => (
          <figure key={t.r} className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-paper-2)]/50 p-5">
            <Stars />
            <blockquote className="mt-2 font-[family-name:var(--font-display)] text-[1.05rem] leading-snug text-[color:var(--color-ink)]">
              {t.q}
            </blockquote>
            <figcaption className="mt-2 text-[0.74rem] uppercase tracking-[0.12em] text-[color:var(--color-ink-soft)]">
              {t.r}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── offer / money model ───────────────────────── */

function Offer() {
  return (
    <section className="mt-16">
      <div className="relative overflow-hidden rounded-[1.6rem] border border-[color:var(--color-border-strong)] bg-gradient-to-br from-[#FFFBF0] via-[#FBE9C2] to-[#F2D292] p-7 shadow-[var(--shadow-paper-lg)]">
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[color:var(--color-saffron)]/30 blur-3xl" />
        <div className="relative text-center">
          <span className="badge-pill bg-[color:var(--color-paper)] text-[color:var(--color-ink)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-sage)]" />
            Start free, no card
          </span>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(1.8rem,6vw,2.4rem)] font-semibold leading-tight tracking-tight text-[color:var(--color-ink)]">
            Try it on your own book first.
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-[0.95rem] leading-relaxed text-[color:var(--color-ink-soft)]">
            Read and study right away, no card, no commitment. Keep going for
            <span className="font-semibold text-[color:var(--color-ink)]"> €7.99/mo</span>,
            billed monthly or yearly. Cancel in one click.
          </p>

          <div className="mt-5">
            <PrimaryCta label="Start studying, free" />
          </div>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[color:var(--color-paper)]/70 px-4 py-1.5 text-[0.8rem] font-semibold text-[color:var(--color-sage-deep)]">
            <Shield /> 30-day money-back, no questions, no forms
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <Compare who="vs DeepL / Google Translate" pitch="They translate a paragraph. Translify rebuilds the whole book and you can study it." />
        <Compare who="vs ChatGPT / Claude" pitch="Chatbots invent sources. Every Translify answer cites the page, with a jump button." />
        <Compare who="vs Anki / flashcards" pitch="Anki tests cards you wrote. Translify builds them from what you actually read." />
      </div>
      <p className="mt-4 text-center text-[0.82rem] text-[color:var(--color-ink-soft)]">
        Want the full breakdown?{" "}
        <Link href="/pricing" className="font-semibold text-[color:var(--color-ink)] underline decoration-[color:var(--color-saffron)] underline-offset-2">
          See all plans
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
  const items = [
    { q: "Do I need a card to start?", a: "No. Tap a book and start reading and studying in under a minute. We ask for payment only when you choose to upgrade." },
    { q: "What if my book is not in my language?", a: "Translify rebuilds the whole book in any of 14 languages with the layout preserved, so you study it as fast as you think." },
    { q: "Can I cancel anytime?", a: "Yes, in one click. And if you are not happy within 30 days, we refund you in full, no questions and no forms." },
    { q: "What can I upload?", a: "Any PDF or EPUB up to 200 MB: textbooks, papers, lecture notes, even novels for your literature class." },
  ];
  return (
    <section className="mt-16">
      <h2 className="text-center font-[family-name:var(--font-display)] text-[clamp(1.6rem,5.5vw,2rem)] font-semibold tracking-tight">
        Quick questions
      </h2>
      <div className="mt-6 flex flex-col gap-2.5">
        {items.map((it) => (
          <details key={it.q} className="group rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-4 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[0.95rem] font-semibold text-[color:var(--color-ink)]">
              {it.q}
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[color:var(--color-paper-3)] text-[color:var(--color-ink-soft)] transition-transform duration-200 group-open:rotate-45">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              </span>
            </summary>
            <p className="mt-2.5 text-[0.88rem] leading-relaxed text-[color:var(--color-ink-soft)]">{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── final CTA + footer ───────────────────────── */

function FinalCta() {
  return (
    <section className="mt-16 text-center">
      <h2 className="font-[family-name:var(--font-display)] text-[clamp(2rem,7vw,2.8rem)] font-semibold leading-[1.05] tracking-tight text-[color:var(--color-ink)]">
        Your next exam is coming.
        <br />
        <em className="text-[color:var(--color-saffron-deep)]">Walk in ready.</em>
      </h2>
      <div className="mt-6 flex justify-center">
        <PrimaryCta />
      </div>
      <p className="mt-3 text-[0.78rem] text-[color:var(--color-ink-soft)]">
        No card to start. Cancel any time. 30-day money-back.
      </p>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-dashed border-[color:var(--color-border)] py-8 text-center text-[0.78rem] text-[color:var(--color-ink-soft)]">
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <Link href="/pricing" className="hover:text-[color:var(--color-ink)]">Pricing</Link>
        <Link href="/" className="hover:text-[color:var(--color-ink)]">Home</Link>
        <Link href="/privacy" className="hover:text-[color:var(--color-ink)]">Privacy</Link>
        <Link href="/terms" className="hover:text-[color:var(--color-ink)]">Terms</Link>
      </div>
      <p className="mt-4">© {new Date().getFullYear()} Translify</p>
    </footer>
  );
}

/* ───────────────────────── sticky mobile CTA ───────────────────────── */

function StickyCta() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--color-border)] bg-[color:var(--color-paper)]/90 px-4 pt-3 backdrop-blur lg:hidden"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}
    >
      <Link
        href={JOIN}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[color:var(--color-saffron)] font-semibold text-[color:var(--color-accent-foreground)] shadow-[0_2px_0_rgba(140,90,30,0.5)] active:scale-[0.98]"
      >
        Start studying, free
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
  return (
    <div className="relative mx-auto w-[270px]">
      <div className="rounded-[2.4rem] border-[6px] border-[color:var(--color-ink)] bg-[color:var(--color-ink)] shadow-[0_30px_60px_-20px_rgba(20,16,8,0.5)]">
        <div className="overflow-hidden rounded-[1.9rem] bg-[color:var(--color-paper)]">
          {/* status bar */}
          <div className="flex items-center justify-between px-5 pt-3 pb-1 text-[0.6rem] font-semibold text-[color:var(--color-ink-soft)]">
            <span>9:41</span>
            <span className="h-3.5 w-12 rounded-full bg-[color:var(--color-paper-3)]" />
          </div>
          {/* book header */}
          <div className="flex items-center gap-2 border-b border-[color:var(--color-border)] px-4 py-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[color:var(--color-saffron)]/20 text-[color:var(--color-saffron-deep)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
            </span>
            <div className="min-w-0">
              <p className="truncate text-[0.72rem] font-semibold text-[color:var(--color-ink)]">Organic Chemistry</p>
              <p className="text-[0.58rem] text-[color:var(--color-ink-soft)]">ch. 3 · p. 142</p>
            </div>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[color:var(--color-saffron)]/15 px-2 py-0.5 text-[0.56rem] font-semibold text-[color:var(--color-saffron-deep)]">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /><path d="M9 2h6" /></svg>
              18:24
            </span>
          </div>
          {/* screen body */}
          <div className="flex flex-col gap-2.5 p-3">
            <p className="text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-ink-soft)]">
              Study desk · 12 cards due
            </p>
            <div className="rounded-xl border-[1.5px] border-[color:var(--color-border-strong)] bg-[#FFFCF3] p-3">
              <span className="text-[0.5rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-ink-soft)]">Prompt</span>
              <p className="mt-1 text-[0.74rem] leading-snug text-[color:var(--color-ink)]">
                What does Le Chatelier&apos;s principle predict when you add reactant?
              </p>
              <div className="mt-2.5 flex gap-1.5">
                <span className="flex-1 rounded-lg border-[1.5px] border-[color:var(--color-border)] bg-white/60 py-1 text-center text-[0.6rem] font-semibold text-[color:var(--color-ink-soft)]">Again</span>
                <span className="flex-1 rounded-lg bg-[color:var(--color-sage)] py-1 text-center text-[0.6rem] font-semibold text-white">Got it</span>
              </div>
            </div>
            {/* chat bubble */}
            <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-paper-2)] p-2.5">
              <p className="text-[0.66rem] leading-snug text-[color:var(--color-ink)]">
                The equilibrium shifts toward the products to use up the added reactant.
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
