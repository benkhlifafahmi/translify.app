import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Floating decorative shapes */}
      <DecorBackdrop />

      <nav className="relative z-10 flex items-center justify-between px-8 py-6 lg:px-14">
        <Logo />
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 font-medium text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-[color:var(--color-ink)] px-5 py-2 font-semibold text-[color:var(--color-primary-foreground)] shadow-[0_2px_0_rgba(20,16,8,0.4),0_8px_18px_-8px_rgba(20,16,8,0.5)] transition-transform hover:-translate-y-[1px]"
          >
            Get started
          </Link>
        </div>
      </nav>

      <section className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-8 pb-16 pt-10 lg:grid-cols-12 lg:gap-10 lg:px-14 lg:pt-20">
        <div className="lg:col-span-7 stagger">
          <span className="badge-pill bg-[color:var(--color-paper-3)] text-[color:var(--color-ink-soft)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-sage)]" />
            For curious readers, big & small
          </span>

          <h1 className="mt-5 font-[family-name:var(--font-display)] text-[clamp(2.6rem,6vw,4.8rem)] font-semibold leading-[1.02] tracking-tight">
            Read any book,
            <br />
            <span className="relative inline-block">
              <span className="relative z-10 italic text-[color:var(--color-saffron-deep)]">
                in your language
              </span>
              <Underline />
            </span>
            .
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[color:var(--color-ink-soft)]">
            Drop in a PDF or EPUB, and Translify keeps the layout exactly the
            same — just translated. Then chat with your book and quiz yourself,
            so you actually <em className="font-[family-name:var(--font-display)]">remember</em> what you read.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-[color:var(--color-saffron)] px-6 font-semibold text-[color:var(--color-accent-foreground)] shadow-[0_2px_0_rgba(140,90,30,0.5),0_10px_22px_-8px_rgba(200,137,62,0.6)] transition-transform hover:-translate-y-[2px]"
            >
              Start reading — free
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center rounded-full border-[1.5px] border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)]/60 px-6 font-semibold text-[color:var(--color-ink)] hover:bg-[color:var(--color-paper-2)]"
            >
              I already have an account
            </Link>
          </div>

          <ul className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[color:var(--color-ink-soft)]">
            <li className="flex items-center gap-2">
              <Tick /> Layout preserved, page by page
            </li>
            <li className="flex items-center gap-2">
              <Tick /> 14+ languages, instant
            </li>
            <li className="flex items-center gap-2">
              <Tick /> Quizzes that cite the source
            </li>
          </ul>
        </div>

        <div className="lg:col-span-5">
          <BookStack />
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-8 pb-24 lg:px-14">
        <div className="grid gap-5 sm:grid-cols-3">
          <Feature
            tone="saffron"
            title="Translate"
            kicker="01"
            body="Pick a language. We rebuild the page in it — same fonts, same shapes, same feel."
          />
          <Feature
            tone="sage"
            title="Chat with it"
            kicker="02"
            body="Ask anything. Answers come with the exact passage they came from, highlighted in the book."
          />
          <Feature
            tone="coral"
            title="Quiz yourself"
            kicker="03"
            body="Surprise quizzes that actually check if you got it. Wrong? We'll show you where to look."
          />
        </div>
      </section>

      <footer className="relative z-10 border-t border-[color:var(--color-border)] bg-[color:var(--color-paper-2)]/60 px-8 py-8 text-center text-xs text-[color:var(--color-ink-soft)] lg:px-14">
        Made with patience for readers everywhere · © {new Date().getFullYear()} Translify
      </footer>
    </main>
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
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-24 h-96 w-96 rounded-full bg-[color:var(--color-saffron)]/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-40 h-[28rem] w-[28rem] rounded-full bg-[color:var(--color-sage)]/12 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[color:var(--color-coral)]/10 blur-3xl"
      />
    </>
  );
}

function BookStack() {
  return (
    <div className="relative mx-auto aspect-[5/6] max-w-md">
      {/* Back book — sage */}
      <div className="absolute left-2 top-10 h-[78%] w-[68%] -rotate-[7deg] rounded-2xl bg-gradient-to-br from-[#9CC0A0] to-[#5F8763] shadow-[0_30px_60px_-20px_rgba(60,90,60,0.5)]">
        <div className="absolute inset-0 rounded-2xl border border-white/20" />
        <div className="absolute left-3 top-6 h-[1px] w-12 bg-white/40" />
        <div className="absolute left-3 top-9 h-[1px] w-10 bg-white/30" />
        <div className="absolute bottom-6 right-5 font-[family-name:var(--font-display)] text-2xl italic text-white/80">
          étude
        </div>
      </div>

      {/* Middle book — coral */}
      <div className="absolute right-3 top-4 h-[82%] w-[64%] rotate-[5deg] rounded-2xl bg-gradient-to-br from-[#EE9A91] to-[#C5594D] shadow-[0_30px_60px_-20px_rgba(180,80,70,0.45)]">
        <div className="absolute inset-0 rounded-2xl border border-white/25" />
        <div className="absolute left-4 top-5 font-[family-name:var(--font-display)] text-xs uppercase tracking-[0.3em] text-white/70">
          chapter one
        </div>
        <div className="absolute left-4 top-12 font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight text-white/95">
          The
          <br />
          Curious
          <br />
          <em className="font-normal">Reader</em>
        </div>
      </div>

      {/* Front book — paper/saffron */}
      <div className="absolute bottom-0 left-1/2 h-[88%] w-[72%] -translate-x-1/2 rotate-[-2deg] rounded-2xl bg-gradient-to-br from-[#FFFBF0] to-[#F4ECDB] shadow-[0_40px_70px_-20px_rgba(60,40,15,0.35)]">
        <div className="absolute inset-0 rounded-2xl border border-[color:var(--color-border-strong)]/60" />
        {/* spine line */}
        <div className="absolute bottom-3 left-3 top-3 w-2 rounded-l-md bg-[color:var(--color-saffron)]/70" />
        <div className="absolute inset-y-3 left-7 right-3 flex flex-col justify-between p-3">
          <div className="space-y-1.5">
            <div className="h-1.5 w-12 rounded-full bg-[color:var(--color-ink)]/70" />
            <div className="h-1 w-20 rounded-full bg-[color:var(--color-ink-soft)]/50" />
          </div>
          <div className="font-[family-name:var(--font-display)] text-[color:var(--color-ink)]">
            <p className="text-[0.65rem] uppercase tracking-[0.25em] text-[color:var(--color-ink-soft)]">
              ⤳ now in français
            </p>
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
            <span className="ml-2 text-[0.65rem] text-[color:var(--color-ink-soft)]">
              p. 12 / 240
            </span>
          </div>
        </div>
      </div>

      {/* Floating chat sticker */}
      <div className="absolute -right-2 bottom-12 hidden rotate-[6deg] rounded-2xl bg-white px-3 py-2 text-xs shadow-[0_18px_30px_-10px_rgba(60,40,15,0.25)] sm:block">
        <p className="font-[family-name:var(--font-display)] text-[color:var(--color-ink)]">
          “What's the moral?”
        </p>
        <div className="mt-1 flex items-center gap-1 text-[0.65rem] text-[color:var(--color-sage-deep)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-sage)]" />
          answered with citations
        </div>
      </div>

      {/* Floating quiz badge */}
      <div className="absolute -left-3 top-16 hidden -rotate-[10deg] rounded-full bg-[color:var(--color-coral)] px-3 py-1.5 text-xs font-semibold text-white shadow-[0_12px_22px_-8px_rgba(197,89,77,0.55)] sm:flex">
        ★ 8 / 10 — nice work!
      </div>
    </div>
  );
}

function Feature({
  tone,
  kicker,
  title,
  body,
}: {
  tone: "saffron" | "sage" | "coral";
  kicker: string;
  title: string;
  body: string;
}) {
  const tones: Record<typeof tone, { bg: string; text: string; ring: string }> = {
    saffron: {
      bg: "bg-[color:var(--color-saffron)]/15",
      text: "text-[color:var(--color-saffron-deep)]",
      ring: "ring-[color:var(--color-saffron)]/30",
    },
    sage: {
      bg: "bg-[color:var(--color-sage)]/15",
      text: "text-[color:var(--color-sage-deep)]",
      ring: "ring-[color:var(--color-sage)]/25",
    },
    coral: {
      bg: "bg-[color:var(--color-coral)]/15",
      text: "text-[color:var(--color-coral-deep)]",
      ring: "ring-[color:var(--color-coral)]/25",
    },
  };
  const t = tones[tone];
  return (
    <div className="card-paper relative overflow-hidden p-6">
      <div className={`mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl ${t.bg} ${t.text} ring-1 ${t.ring} font-[family-name:var(--font-display)] text-sm font-semibold`}>
        {kicker}
      </div>
      <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-ink-soft)]">
        {body}
      </p>
    </div>
  );
}
