"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { getGoogleAuthUrl, startSession } from "@/lib/auth";
import { listBooks, type Book } from "@/lib/books";
import { trackLead } from "@/lib/onboarding";
import { Lumi } from "@/components/lumi/lumi";
import { TranslifyIcon } from "@/components/translify-mark";

// ─── Steps ────────────────────────────────────────────────────────────────────
type Step =
  | "email"        // 1. visitor types email → silent backend signup
  | "magic-sent"   // 1b. (existing email) — show "check your inbox"
  | "topics"       // 2. multi-select topic chips
  | "shelf"        // 3. seed books matching their topics — tap one → /read/<id>
  ;

const VISIBLE_STEPS: Step[] = ["email", "topics", "shelf"];

// ─── Topics ───────────────────────────────────────────────────────────────────
type TopicId =
  | "fiction" | "self-help" | "history" | "science"
  | "philosophy" | "business" | "art" | "nature";

type Tone = "saffron" | "sage" | "plum" | "coral";

const TOPICS: { id: TopicId; icon: string; label: string; tone: Tone }[] = [
  { id: "fiction",     icon: "📖", label: "Fiction",       tone: "saffron" },
  { id: "self-help",   icon: "✨", label: "Self-help",     tone: "sage"    },
  { id: "philosophy",  icon: "🌿", label: "Philosophy",    tone: "sage"    },
  { id: "history",     icon: "🏛️", label: "History",       tone: "plum"    },
  { id: "science",     icon: "🔬", label: "Science",       tone: "coral"   },
  { id: "business",    icon: "💼", label: "Strategy",      tone: "plum"    },
  { id: "art",         icon: "🎨", label: "Art & Poetry",  tone: "coral"   },
  { id: "nature",      icon: "🌲", label: "Nature",        tone: "saffron" },
];

const TONE_MAP: Record<Tone, { ring: string; bg: string; iconBg: string; iconColor: string; deep: string }> = {
  saffron: { ring: "#D09040", bg: "linear-gradient(135deg,#FFFBF0,#FBE9C2)", iconBg: "rgba(224,164,80,0.18)", iconColor: "var(--color-saffron-deep)", deep: "var(--color-saffron-deep)" },
  sage:    { ring: "#5A8C5A", bg: "linear-gradient(135deg,#F4F8EC,#DDEAD2)", iconBg: "rgba(123,161,124,0.18)", iconColor: "var(--color-sage-deep)",    deep: "var(--color-sage-deep)"    },
  plum:    { ring: "#6B5B95", bg: "linear-gradient(135deg,#F4EEF7,#E0D2EA)", iconBg: "rgba(107,91,149,0.18)",  iconColor: "var(--color-plum)",         deep: "var(--color-plum)"          },
  coral:   { ring: "#C0604A", bg: "linear-gradient(135deg,#FFF1EE,#F6CCC4)", iconBg: "rgba(226,120,108,0.18)", iconColor: "var(--color-coral-deep)",   deep: "var(--color-coral-deep)"    },
};

// ─── Seed-book display metadata ───────────────────────────────────────────────
// Pairs with the backend by ``seed_slug``. Titles/authors come from /books;
// covers and topic chips are display-only and live here.
interface SeedDisplay {
  cover: { bg: string; emoji: string };
  topics: TopicId[];
}
const SEED_DISPLAY: Record<string, SeedDisplay> = {
  "pride-and-prejudice":   { cover: { bg: "linear-gradient(135deg,#6B5B95,#3D2D5C)", emoji: "💃" }, topics: ["fiction"] },
  "alice-in-wonderland":   { cover: { bg: "linear-gradient(135deg,#94C48A,#3D6B44)", emoji: "🐇" }, topics: ["fiction"] },
  "meditations":           { cover: { bg: "linear-gradient(135deg,#E2786C,#9B3B2D)", emoji: "🏛️" }, topics: ["philosophy", "self-help"] },
  "art-of-war":            { cover: { bg: "linear-gradient(135deg,#4A3C1E,#1F1808)", emoji: "⚔️" }, topics: ["business", "history"] },
  "origin-of-species":     { cover: { bg: "linear-gradient(135deg,#7BA17C,#3F5C40)", emoji: "🐢" }, topics: ["science", "history", "nature"] },
  "tao-te-ching":          { cover: { bg: "linear-gradient(135deg,#5A8C5A,#2A4530)", emoji: "☯️" }, topics: ["philosophy", "self-help", "art"] },
  "shakespeares-sonnets":  { cover: { bg: "linear-gradient(135deg,#E0A450,#8E5C18)", emoji: "🪶" }, topics: ["art"] },
  "walden":                { cover: { bg: "linear-gradient(135deg,#3D6B44,#1E3A24)", emoji: "🌲" }, topics: ["nature", "self-help", "philosophy"] },
};

// Stable order to surface in step 3 — used when no topic intersection.
const SEED_ORDER: string[] = [
  "pride-and-prejudice", "meditations", "art-of-war", "alice-in-wonderland",
  "tao-te-ching", "origin-of-species", "walden", "shakespeares-sonnets",
];

// ─── Audio cues ───────────────────────────────────────────────────────────────
function playTone(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.12) {
  if (typeof window === "undefined") return;
  try {
    type WinAC = { webkitAudioContext?: typeof AudioContext };
    const AC = window.AudioContext ?? (window as unknown as WinAC).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.connect(vol); vol.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    vol.gain.setValueAtTime(gain, ctx.currentTime);
    vol.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
    osc.onended = () => ctx.close();
  } catch { /* autoplay or unsupported */ }
}
const SFX = {
  tap:     () => playTone(880, 0.06, "sine", 0.10),
  select:  () => { playTone(523, 0.09); setTimeout(() => playTone(659, 0.10), 70); },
  advance: () => { playTone(523, 0.08); setTimeout(() => playTone(659, 0.08), 90); setTimeout(() => playTone(784, 0.15), 180); },
  success: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.18, "sine", 0.14), i * 95)),
  error:   () => playTone(200, 0.2, "sawtooth", 0.08),
};

// ─── Root ─────────────────────────────────────────────────────────────────────
export function JoinClient() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [topics, setTopics] = useState<TopicId[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Capture document.referrer once on mount so trackLead carries attribution.
  const referrerRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (typeof document !== "undefined") referrerRef.current = document.referrer || undefined;
  }, []);

  // Persist email between refreshes inside the flow.
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("join.email");
      if (cached && !email) setEmail(cached);
    } catch { /* ignore */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (typeof window === "undefined") return;
    try { if (email) sessionStorage.setItem("join.email", email); } catch { /* ignore */ }
  }, [email]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleEmail = async () => {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!ok) { setErr("Enter a valid email — we'll send your sign-in link there."); SFX.error(); return; }
    setErr(null); setBusy(true);
    try {
      // Detect locale from the page (set by I18nProvider on document.documentElement.lang).
      const preferred = typeof document !== "undefined"
        ? (document.documentElement.lang || undefined)
        : undefined;
      const res = await startSession({
        email,
        referrer: referrerRef.current,
        preferred_language: preferred,
      });
      trackLead({ email, step: "email", referrer: referrerRef.current });
      if (res.is_new_user && res.access_token) {
        SFX.advance();
        setStep("topics");
      } else {
        // Existing email — server sent a magic link, we never get a JWT here.
        SFX.success();
        setStep("magic-sent");
      }
    } catch (e) {
      SFX.error();
      setErr(e instanceof ApiError ? e.message : "Couldn't start a session. Please try again.");
    } finally { setBusy(false); }
  };

  const handleTopicsContinue = () => {
    if (topics.length === 0) { SFX.error(); return; }
    trackLead({ email, step: "topics", topics });
    SFX.advance();
    setStep("shelf");
  };

  const handleBookOpen = (book: Book) => {
    SFX.select();
    trackLead({
      email, step: "experience", topics,
      chosen_book_id: book.seed_slug ?? null,
    });
    // We don't mark "completed" here — that's set when the user upgrades. For
    // the funnel, opening a book is the "experience" step.
    router.push(`/read/${book.id}?welcome=1`);
  };

  // Step index for the progress pill — only visible (non-magic-sent) steps.
  const stepIdx = Math.max(0, VISIBLE_STEPS.indexOf(step as (typeof VISIBLE_STEPS)[number]));
  const TOTAL = VISIBLE_STEPS.length;

  return (
    <div
      className="relative min-h-[100dvh] overflow-x-hidden"
      style={{
        background: "var(--color-paper)",
        backgroundImage: "radial-gradient(circle, rgba(74,60,30,0.06) 1.4px, transparent 1.4px)",
        backgroundSize: "26px 26px",
      }}
    >
      {/* Top bar */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 backdrop-blur-md"
        style={{ background: "rgba(252,248,238,0.85)", borderBottom: "1px solid rgba(74,60,30,0.06)" }}
      >
        {step === "topics" || step === "shelf" ? (
          <button
            type="button"
            onClick={() => {
              SFX.tap();
              setStep(step === "shelf" ? "topics" : "email");
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-90"
            style={{ background: "white", border: "1.5px solid var(--color-border)", boxShadow: "0 2px 0 rgba(74,60,30,0.08)" }}
            aria-label="Back"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        ) : (
          <Link href="/" className="flex items-center gap-2" style={{ color: "var(--color-ink)" }}>
            <TranslifyIcon size={26} />
            <span className="font-[family-name:var(--font-display)] text-[1rem] font-semibold tracking-tight">
              Translify
            </span>
          </Link>
        )}

        {step !== "magic-sent" && (
          <div className="flex items-center gap-1.5">
            {VISIBLE_STEPS.map((s, i) => (
              <span
                key={s}
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: i === stepIdx ? 22 : 6,
                  background: i <= stepIdx ? "var(--color-saffron-deep)" : "rgba(74,60,30,0.15)",
                }}
              />
            ))}
          </div>
        )}

        {step === "email" ? (
          <Link href="/login" className="text-[0.82rem] font-semibold" style={{ color: "var(--color-ink-soft)" }}>
            Sign in
          </Link>
        ) : (
          <span className="w-9" />
        )}
      </header>

      <main className="relative z-10 mx-auto w-full max-w-md px-4 pb-32 pt-4 sm:max-w-lg sm:pt-8">
        <div key={step} className="ob-enter-forward">
          {step === "email" && (
            <StepEmail
              email={email} setEmail={setEmail}
              onContinue={handleEmail} err={err} busy={busy}
            />
          )}
          {step === "magic-sent" && (
            <StepMagicSent email={email} />
          )}
          {step === "topics" && (
            <StepTopics
              topics={topics} setTopics={setTopics}
              onContinue={handleTopicsContinue}
            />
          )}
          {step === "shelf" && (
            <StepShelf
              topics={topics}
              onOpen={handleBookOpen}
              total={TOTAL} idx={stepIdx}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Step 1 — Email ───────────────────────────────────────────────────────────
function StepEmail({
  email, setEmail, onContinue, err, busy,
}: {
  email: string;
  setEmail: (v: string) => void;
  onContinue: () => void;
  err: string | null;
  busy: boolean;
}) {
  return (
    <div className="flex flex-col">
      <div className="mb-6 flex justify-center">
        <Lumi state="waving" size={108} animate />
      </div>

      <div className="text-center">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--color-saffron-deep)" }}>
          Welcome
        </p>
        <h1
          className="mt-2 font-[family-name:var(--font-display)] font-semibold leading-[1.04] tracking-tight"
          style={{ fontSize: "clamp(2rem,7vw,2.6rem)", color: "var(--color-ink)" }}
        >
          Read any book.
          <br />
          <span style={{ color: "var(--color-saffron-deep)" }}>In your language.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-[28ch] text-[0.95rem] leading-relaxed" style={{ color: "var(--color-ink-soft)" }}>
          Just your email — we&apos;ll set up your shelf and email you a sign-in link too.
        </p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); onContinue(); }}
        className="mt-7 flex flex-col gap-3"
      >
        <GameField
          icon="📧"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
          autoFocus
        />
        {err && (
          <div className="rounded-xl px-3 py-2 text-[0.84rem] font-medium" style={{ background: "rgba(220,38,38,0.07)", color: "#B91C1C", border: "1.5px solid rgba(220,38,38,0.22)" }}>
            {err}
          </div>
        )}

        <BigButton type="submit" disabled={!email || busy}>
          {busy ? "Opening your shelf…" : "Continue →"}
        </BigButton>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
        <span className="text-[0.7rem] font-semibold uppercase tracking-wider" style={{ color: "var(--color-ink-soft)" }}>or</span>
        <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
      </div>

      <GoogleButton />

      <p className="mt-6 text-center text-[0.78rem]" style={{ color: "var(--color-ink-soft)" }}>
        By continuing you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-4">Terms</Link> &{" "}
        <Link href="/privacy" className="underline underline-offset-4">Privacy</Link>.
      </p>
    </div>
  );
}

// ─── Step 1b — Magic link sent (existing email path) ──────────────────────────
function StepMagicSent({ email }: { email: string }) {
  return (
    <div className="mt-6 flex flex-col items-center text-center">
      <Lumi state="happy" size={108} animate />
      <p
        className="mt-6 text-[0.7rem] font-bold uppercase tracking-[0.22em]"
        style={{ color: "var(--color-sage-deep)" }}
      >
        Welcome back
      </p>
      <h1
        className="mt-2 font-[family-name:var(--font-display)] font-semibold leading-[1.06] tracking-tight"
        style={{ fontSize: "clamp(1.7rem,6vw,2.2rem)", color: "var(--color-ink)" }}
      >
        Check your inbox.
      </h1>
      <p className="mx-auto mt-3 max-w-[30ch] text-[0.95rem] leading-relaxed" style={{ color: "var(--color-ink-soft)" }}>
        We sent a one-tap sign-in link to <span className="font-semibold" style={{ color: "var(--color-ink)" }}>{email}</span>. The link opens your shelf — no password to remember.
      </p>
      <p className="mt-6 text-[0.82rem]" style={{ color: "var(--color-ink-soft)" }}>
        Didn&apos;t arrive? Check spam or{" "}
        <Link href="/login" className="font-semibold underline underline-offset-4" style={{ color: "var(--color-ink)" }}>
          try again
        </Link>.
      </p>
    </div>
  );
}

// ─── Step 2 — Topics ──────────────────────────────────────────────────────────
function StepTopics({
  topics, setTopics, onContinue,
}: {
  topics: TopicId[];
  setTopics: (fn: (prev: TopicId[]) => TopicId[]) => void;
  onContinue: () => void;
}) {
  const toggle = (id: TopicId) => {
    SFX.tap();
    setTopics((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  };

  return (
    <div>
      <div className="text-center">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--color-sage-deep)" }}>
          Your shelf is ready
        </p>
        <h2
          className="mt-2 font-[family-name:var(--font-display)] font-semibold leading-[1.05] tracking-tight"
          style={{ fontSize: "clamp(1.7rem,5.5vw,2.2rem)", color: "var(--color-ink)" }}
        >
          What do you love reading?
        </h2>
        <p className="mx-auto mt-2 max-w-[28ch] text-[0.92rem]" style={{ color: "var(--color-ink-soft)" }}>
          Pick a few — we&apos;ll surface books in those topics first.
        </p>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3">
        {TOPICS.map((t, i) => {
          const selected = topics.includes(t.id);
          const tone = TONE_MAP[t.tone];
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              className="group relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 px-3 py-5 text-center transition-all duration-200 active:scale-[0.97] animate-float-in"
              style={{
                animationDelay: `${i * 0.04}s`,
                borderColor: selected ? tone.ring : "var(--color-border-strong)",
                background: selected ? tone.bg : "white",
                boxShadow: selected ? `0 5px 0 ${tone.ring}40` : "0 3px 0 rgba(74,60,30,0.08)",
                transform: selected ? "translateY(-2px)" : "translateY(0)",
              }}
            >
              <span className="text-[1.7rem] leading-none">{t.icon}</span>
              <span className="font-[family-name:var(--font-display)] text-[0.9rem] font-semibold" style={{ color: "var(--color-ink)" }}>
                {t.label}
              </span>
              {selected && (
                <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full text-white animate-pop-in" style={{ background: tone.deep }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <FixedFooter>
        <BigButton onClick={onContinue} disabled={topics.length === 0}>
          {topics.length === 0 ? "Pick at least one" : `Continue (${topics.length}) →`}
        </BigButton>
      </FixedFooter>
    </div>
  );
}

// ─── Step 3 — Shelf (real seed books from API) ────────────────────────────────
function StepShelf({
  topics, onOpen, total, idx,
}: {
  topics: TopicId[];
  onOpen: (book: Book) => void;
  total: number;
  idx: number;
}) {
  // Fetch the user's library. Seed books are filtered in via the backend's
  // visibility predicate — they show up alongside any uploaded books.
  const { data: books, isLoading, error } = useQuery<Book[]>({
    queryKey: ["library", "join"],
    queryFn: listBooks,
    staleTime: 30_000,
  });

  const ordered = useMemo(() => {
    const all = books ?? [];
    const seeds = all.filter((b) => b.is_seed && b.seed_slug && SEED_DISPLAY[b.seed_slug]);
    // Books that match a chosen topic come first; rest fall to the stable order.
    const slugScore = (slug: string) => {
      const d = SEED_DISPLAY[slug];
      const overlap = d ? d.topics.filter((t) => topics.includes(t)).length : 0;
      const order = SEED_ORDER.indexOf(slug);
      return overlap * 100 + (order >= 0 ? 100 - order : 0);
    };
    return [...seeds].sort((a, b) => slugScore(b.seed_slug!) - slugScore(a.seed_slug!));
  }, [books, topics]);

  return (
    <div>
      <div className="text-center">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--color-plum)" }}>
          Step {idx + 1} of {total}
        </p>
        <h2
          className="mt-2 font-[family-name:var(--font-display)] font-semibold leading-[1.05] tracking-tight"
          style={{ fontSize: "clamp(1.7rem,5.5vw,2.2rem)", color: "var(--color-ink)" }}
        >
          Pick a book to open
        </h2>
        <p className="mx-auto mt-2 max-w-[30ch] text-[0.92rem]" style={{ color: "var(--color-ink-soft)" }}>
          The first 10 pages of any book are free — keep going on a 14-day trial.
        </p>
      </div>

      {/* Loading + error states */}
      {isLoading && (
        <div className="mt-10 flex justify-center">
          <Lumi state="thinking" size={68} animate />
        </div>
      )}
      {error && (
        <div
          className="mt-6 rounded-xl px-4 py-3 text-[0.86rem]"
          style={{
            background: "rgba(220,38,38,0.07)", color: "#B91C1C",
            border: "1.5px solid rgba(220,38,38,0.22)",
          }}
        >
          Couldn&apos;t load your shelf. Refresh to try again.
        </div>
      )}

      {!isLoading && !error && (
        <ul className="mt-7 flex flex-col gap-3">
          {ordered.map((book, i) => {
            const display = SEED_DISPLAY[book.seed_slug!];
            const tagTopics = display.topics.slice(0, 2);
            return (
              <li key={book.id}>
                <button
                  type="button"
                  onClick={() => onOpen(book)}
                  className="group flex w-full items-center gap-4 rounded-2xl border-2 p-3.5 text-start transition-all active:scale-[0.99] animate-float-in"
                  style={{
                    animationDelay: `${i * 0.06}s`,
                    borderColor: "var(--color-border-strong)",
                    background: "white",
                    boxShadow: "0 4px 0 rgba(74,60,30,0.10)",
                  }}
                >
                  <div
                    className="relative grid h-20 w-14 shrink-0 place-items-center overflow-hidden rounded-md"
                    style={{ background: display.cover.bg, boxShadow: "2px 3px 0 rgba(74,60,30,0.18)" }}
                  >
                    <span className="text-[1.8rem]">{display.cover.emoji}</span>
                    <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: "rgba(0,0,0,0.25)" }} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-[family-name:var(--font-display)] text-[1rem] font-semibold leading-tight" style={{ color: "var(--color-ink)" }}>
                      {book.title}
                    </h3>
                    <p className="mt-0.5 truncate text-[0.82rem]" style={{ color: "var(--color-ink-soft)" }}>
                      {book.author ?? ""}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {tagTopics.map((tid) => {
                        const t = TOPICS.find((x) => x.id === tid);
                        if (!t) return null;
                        return (
                          <span
                            key={tid}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.66rem] font-semibold"
                            style={{ background: TONE_MAP[t.tone].iconBg, color: TONE_MAP[t.tone].iconColor }}
                          >
                            {t.icon} {t.label}
                          </span>
                        );
                      })}
                      {book.status !== "ready" && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.66rem] font-semibold"
                          style={{ background: "rgba(74,60,30,0.08)", color: "var(--color-ink-soft)" }}
                          title="Translify is still indexing this book — chat/quiz unlock when it's ready."
                        >
                          Preparing
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition-transform group-active:translate-x-0.5"
                    style={{ background: "var(--color-saffron-deep)", color: "white", boxShadow: "0 3px 0 rgba(152,96,24,0.50)" }}
                    aria-hidden
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!isLoading && !error && ordered.length === 0 && (
        <p className="mt-10 rounded-xl border-2 p-4 text-center text-[0.86rem]" style={{ borderColor: "var(--color-border)", background: "white", color: "var(--color-ink-soft)" }}>
          The seed library hasn&apos;t finished loading on this server yet. Try{" "}
          <Link href="/library" className="font-bold underline underline-offset-4" style={{ color: "var(--color-ink)" }}>your library</Link>.
        </p>
      )}

      <p className="mt-6 text-center text-[0.78rem]" style={{ color: "var(--color-ink-soft)" }}>
        You can upload your own books later from your library.
      </p>
    </div>
  );
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────
function GameField({
  icon, type, placeholder, value, onChange, autoComplete, required, minLength, autoFocus,
}: {
  icon: string; type: string; placeholder: string; value: string;
  onChange: (v: string) => void;
  autoComplete?: string; required?: boolean; minLength?: number; autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 transition-all duration-150"
      style={{
        border: focused ? "2px solid var(--color-saffron-deep)" : "2px solid var(--color-border-strong)",
        boxShadow: focused ? "0 0 0 4px rgba(224,164,80,0.14),0 4px 0 rgba(74,60,30,0.07)" : "0 3px 0 rgba(74,60,30,0.08)",
        background: focused ? "var(--color-paper)" : "white",
      }}
    >
      <span className="shrink-0 text-[1.2rem] leading-none">{icon}</span>
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete} required={required} minLength={minLength}
        autoFocus={autoFocus}
        className="flex-1 bg-transparent py-3.5 text-[1rem] outline-none"
        style={{ color: "var(--color-ink)", caretColor: "var(--color-saffron-deep)" }}
      />
      {value && (
        <span className="animate-pop-in grid h-5 w-5 shrink-0 place-items-center rounded-full text-[0.58rem] font-bold text-white" style={{ background: "var(--color-sage-deep)" }}>✓</span>
      )}
    </div>
  );
}

function BigButton({
  children, onClick, disabled, type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const [pressed, setPressed] = useState(false);
  const live = !disabled;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      className="h-14 w-full rounded-2xl font-[family-name:var(--font-display)] text-[1.05rem] font-bold transition-[transform,box-shadow] duration-75 disabled:cursor-not-allowed"
      style={{
        background: live ? "linear-gradient(to bottom,#EDB86A,#D09040)" : "rgba(74,60,30,0.10)",
        color: live ? "white" : "rgba(74,60,30,0.35)",
        boxShadow: pressed || !live ? "none" : "0 6px 0 rgba(152,96,24,0.50)",
        transform: pressed && live ? "translateY(6px)" : "translateY(0)",
      }}
    >
      {children}
    </button>
  );
}

function FixedFooter({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="h-24" />
      <div
        className="fixed inset-x-0 bottom-0 z-20 px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3 backdrop-blur-md"
        style={{ background: "rgba(252,248,238,0.92)", borderTop: "1px solid rgba(74,60,30,0.08)" }}
      >
        <div className="mx-auto w-full max-w-md sm:max-w-lg">
          {children}
        </div>
      </div>
    </>
  );
}

function GoogleButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const url = await getGoogleAuthUrl("https://translify.app/auth/google/callback");
      window.location.href = url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border-2 font-[family-name:var(--font-display)] text-[0.98rem] font-semibold transition-all active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        borderColor: "var(--color-border-strong)",
        background: "white",
        color: "var(--color-ink)",
        boxShadow: loading ? "none" : "0 4px 0 rgba(74,60,30,0.10)",
      }}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <GoogleLogo />
      )}
      {loading ? "Redirecting…" : "Continue with Google"}
    </button>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.25-.164-1.84H9v3.48h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.706 17.64 9.2z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}
