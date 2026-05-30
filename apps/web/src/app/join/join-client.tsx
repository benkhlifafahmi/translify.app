"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { usePostHog, useFeatureFlagEnabled } from "posthog-js/react";
import { ApiError, getToken } from "@/lib/api";
import { getGoogleAuthUrl, startAnonymousSession } from "@/lib/auth";
import { cloneSeed, listSeeds, type Seed } from "@/lib/seeds";
import { trackLead } from "@/lib/onboarding";
import { Lumi } from "@/components/lumi/lumi";
import { SeedCover } from "@/components/seed-covers";
import { TranslifyIcon } from "@/components/translify-mark";
import { useI18n } from "@/lib/i18n";

// ─── Steps ────────────────────────────────────────────────────────────────────
type Step =
  | "topics"       // 1. multi-select topic chips — no auth required
  | "shelf"        // 2. seed catalogue — tap one → silently mint anon JWT + clone
  ;

const VISIBLE_STEPS: Step[] = ["topics", "shelf"];

// ─── Topics ───────────────────────────────────────────────────────────────────
type TopicId =
  | "fiction" | "self-help" | "history" | "science"
  | "philosophy" | "business" | "art" | "nature";

type Tone = "saffron" | "sage" | "plum" | "coral";

const TOPICS: { id: TopicId; icon: string; labelKey: string; tone: Tone }[] = [
  { id: "fiction",     icon: "📖", labelKey: "topic.fiction",    tone: "saffron" },
  { id: "self-help",   icon: "✨", labelKey: "topic.selfHelp",   tone: "sage"    },
  { id: "philosophy",  icon: "🌿", labelKey: "topic.philosophy", tone: "sage"    },
  { id: "history",     icon: "🏛️", labelKey: "topic.history",    tone: "plum"    },
  { id: "science",     icon: "🔬", labelKey: "topic.science",    tone: "coral"   },
  { id: "business",    icon: "💼", labelKey: "topic.business",   tone: "plum"    },
  { id: "art",         icon: "🎨", labelKey: "topic.art",        tone: "coral"   },
  { id: "nature",      icon: "🌲", labelKey: "topic.nature",     tone: "saffron" },
];

const TONE_MAP: Record<Tone, { ring: string; bg: string; iconBg: string; iconColor: string; deep: string }> = {
  saffron: { ring: "#D09040", bg: "linear-gradient(135deg,#FFFBF0,#FBE9C2)", iconBg: "rgba(224,164,80,0.18)", iconColor: "var(--color-saffron-deep)", deep: "var(--color-saffron-deep)" },
  sage:    { ring: "#5A8C5A", bg: "linear-gradient(135deg,#F4F8EC,#DDEAD2)", iconBg: "rgba(123,161,124,0.18)", iconColor: "var(--color-sage-deep)",    deep: "var(--color-sage-deep)"    },
  plum:    { ring: "#6B5B95", bg: "linear-gradient(135deg,#F4EEF7,#E0D2EA)", iconBg: "rgba(107,91,149,0.18)",  iconColor: "var(--color-plum)",         deep: "var(--color-plum)"          },
  coral:   { ring: "#C0604A", bg: "linear-gradient(135deg,#FFF1EE,#F6CCC4)", iconBg: "rgba(226,120,108,0.18)", iconColor: "var(--color-coral-deep)",   deep: "var(--color-coral-deep)"    },
};

// ─── Seed-book display metadata ───────────────────────────────────────────────
// Pairs with the backend by ``seed_slug``. Titles/authors come from /books.
// Cover artwork lives in ``components/seed-covers.tsx`` keyed by slug; this
// record only carries the per-seed topic mapping used for ranking step 2.
interface SeedDisplay {
  topics: TopicId[];
}
const SEED_DISPLAY: Record<string, SeedDisplay> = {
  "pride-and-prejudice":   { topics: ["fiction"] },
  "alice-in-wonderland":   { topics: ["fiction"] },
  "meditations":           { topics: ["philosophy", "self-help"] },
  "art-of-war":            { topics: ["business", "history"] },
  "origin-of-species":     { topics: ["science", "history", "nature"] },
  "tao-te-ching":          { topics: ["philosophy", "self-help", "art"] },
  "shakespeares-sonnets":  { topics: ["art"] },
  "walden":                { topics: ["nature", "self-help", "philosophy"] },
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
  const { t } = useI18n();
  const posthog = usePostHog();

  // A/B (experiment key: `join-books-first`). When on, lead with the bookshelf
  // — the instant, no-signup read — instead of the topics quiz that visitors
  // currently drop on. Undefined/false → control, so the page NEVER blocks on
  // PostHog flags loading (a missing/blocked key would otherwise hang forever
  // on the spinner — which broke /join).
  const booksFirst = useFeatureFlagEnabled("join-books-first") === true;
  const startedRef = useRef(false);

  const [step, setStep] = useState<Step>("topics");
  const [topics, setTopics] = useState<TopicId[]>([]);
  const [err, setErr] = useState<string | null>(null);

  // In books-first the shelf is the landing; the quiz becomes an inline filter.
  const effectiveStep: Step = booksFirst ? "shelf" : step;

  // Fire once on mount. PostHog auto-attaches the active flag to the event.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    posthog?.capture("join_started");
  }, [posthog]);

  // Capture document.referrer once on mount — used for analytics if the
  // visitor later claims their session with an email.
  const referrerRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (typeof document !== "undefined") referrerRef.current = document.referrer || undefined;
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleTopicsContinue = () => {
    if (topics.length === 0) { SFX.error(); return; }
    posthog?.capture("join_topics_selected", { count: topics.length, topics });
    SFX.advance();
    setStep("shelf");
  };

  // Track which seed is currently being cloned so the row can show a spinner
  // and we can guard against double-taps creating racing requests.
  const [cloningSlug, setCloningSlug] = useState<string | null>(null);

  const handleSeedOpen = async (seed: Seed) => {
    if (cloningSlug) return; // double-tap guard
    // Capture intent up front so it survives a slow/failed clone — this is the
    // activation event the experiment optimises for.
    posthog?.capture("join_seed_opened", {
      slug: seed.slug,
      already_opened: !!seed.clone_id,
      variant: booksFirst ? "books_first" : "control",
    });
    SFX.select();

    // Fast path — the visitor already opened this seed before; deep-link in.
    if (seed.clone_id) {
      router.push(`/library/${seed.clone_id}?welcome=1`);
      return;
    }

    setCloningSlug(seed.slug);
    try {
      // No JWT yet → mint a ghost-account JWT silently so the clone-on-seed
      // endpoint (which requires auth) succeeds. The user never sees this
      // step — it's invisible friction-free auth for TikTok visitors.
      if (!getToken()) {
        await startAnonymousSession();
        posthog?.capture("anon_session_started", { slug: seed.slug });
      }
      const book = await cloneSeed(seed.slug);
      // Best-effort lead-track — useful even before they claim with an email
      // because the lead model carries chosen_book_id for funnel analysis.
      // We don't have an email yet, so we skip the call entirely; the
      // session-level analytics live on user_id once claim happens.
      router.push(`/library/${book.id}?welcome=1`);
    } catch (e) {
      SFX.error();
      setErr(
        e instanceof ApiError
          ? e.message
          : t("join.s.openError"),
      );
      setCloningSlug(null);
    }
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
        {effectiveStep === "shelf" && !booksFirst ? (
          <button
            type="button"
            onClick={() => { SFX.tap(); setStep("topics"); }}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-[transform,box-shadow] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-90"
            style={{ background: "white", border: "1.5px solid var(--color-border)", boxShadow: "0 2px 0 rgba(74,60,30,0.08)" }}
            aria-label={t("join.back")}
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

        <div className="flex items-center gap-1.5">
          {!booksFirst && VISIBLE_STEPS.map((s, i) => (
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

        <Link href="/login" className="text-[0.82rem] font-semibold" style={{ color: "var(--color-ink-soft)" }}>
          {t("join.signIn")}
        </Link>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-md px-4 pb-32 pt-4 sm:max-w-lg sm:pt-8">
        <div key={effectiveStep} className="ob-enter-forward">
          {effectiveStep === "topics" && (
            <StepTopics
              topics={topics} setTopics={setTopics}
              onContinue={handleTopicsContinue}
            />
          )}
          {effectiveStep === "shelf" && (
            <StepShelf
              booksFirst={booksFirst}
              topics={topics} setTopics={setTopics}
              onOpen={handleSeedOpen}
              cloningSlug={cloningSlug}
              total={TOTAL} idx={stepIdx}
            />
          )}
        </div>
      </main>
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
  const { t } = useI18n();
  // Auto-advance after a short pause so the Continue button isn't required —
  // important on small phones where the fixed footer can hide under the
  // browser UI. A 700ms debounce still lets fast multi-tappers stack a
  // second topic before we move on.
  const advanceTimer = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    };
  }, []);

  const toggle = (id: TopicId) => {
    SFX.tap();
    let nextLen = 0;
    setTopics((prev) => {
      const next = prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id];
      nextLen = next.length;
      return next;
    });
    if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    if (nextLen > 0) {
      advanceTimer.current = window.setTimeout(() => onContinue(), 700);
    }
  };

  return (
    <div>
      <HeroHook />

      <div className="mt-9 text-center">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--color-sage-deep)" }}>
          {t("join.t.eyebrow")}
        </p>
        <h2
          className="mt-2 font-[family-name:var(--font-display)] font-semibold leading-[1.05] tracking-tight"
          style={{ fontSize: "clamp(1.7rem,5.5vw,2.2rem)", color: "var(--color-ink)" }}
        >
          {t("join.t.title")}
        </h2>
        <p className="mx-auto mt-2 max-w-[28ch] text-[0.92rem]" style={{ color: "var(--color-ink-soft)" }}>
          {t("join.t.subtitle")}
        </p>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3">
        {TOPICS.map((topic, i) => {
          const selected = topics.includes(topic.id);
          const tone = TONE_MAP[topic.tone];
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => toggle(topic.id)}
              className="group relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 px-3 py-5 text-center transition-[transform,box-shadow,border-color,background] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] animate-float-in"
              style={{
                animationDelay: `${i * 0.04}s`,
                borderColor: selected ? tone.ring : "var(--color-border-strong)",
                background: selected ? tone.bg : "white",
                boxShadow: selected ? `0 5px 0 ${tone.ring}40` : "0 3px 0 rgba(74,60,30,0.08)",
                transform: selected ? "translateY(-2px)" : "translateY(0)",
              }}
            >
              <span className="text-[1.7rem] leading-none">{topic.icon}</span>
              <span className="font-[family-name:var(--font-display)] text-[0.9rem] font-semibold" style={{ color: "var(--color-ink)" }}>
                {t(topic.labelKey)}
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

      <p className="mt-6 text-center text-[0.78rem]" style={{ color: "var(--color-ink-soft)" }}>
        {t("join.t.trust")}
      </p>

      <FixedFooter>
        <BigButton onClick={onContinue} disabled={topics.length === 0}>
          {topics.length === 0 ? t("join.t.cta.empty") : t("join.t.cta.continue", { n: topics.length })}
        </BigButton>
      </FixedFooter>
    </div>
  );
}

// ─── Hero hook (top of step 1) ────────────────────────────────────────────────
function HeroHook() {
  const { t } = useI18n();
  return (
    <section className="text-center">
      <h1
        className="font-[family-name:var(--font-display)] font-semibold leading-[1.05] tracking-tight"
        style={{ fontSize: "clamp(1.9rem,6vw,2.5rem)", color: "var(--color-ink)" }}
      >
        {t("join.hook.title")}
      </h1>
      <p
        className="mx-auto mt-3 max-w-[34ch] text-[0.95rem] leading-relaxed"
        style={{ color: "var(--color-ink-soft)" }}
      >
        {t("join.hook.body")}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        <HookPill tone="sage" label={t("join.cap.chat")}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z" />
          </svg>
        </HookPill>
        <HookPill tone="coral" label={t("join.cap.quiz")}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M9.1 9a3 3 0 0 1 5.83 1c0 2-3 2.5-3 4.5" />
            <line x1="12" y1="17.5" x2="12.01" y2="17.5" />
          </svg>
        </HookPill>
        <HookPill tone="saffron" label={t("join.cap.translate")}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
          </svg>
        </HookPill>
      </div>
    </section>
  );
}

function HookPill({
  tone, label, children,
}: {
  tone: "saffron" | "sage" | "coral";
  label: string;
  children: React.ReactNode;
}) {
  const styles = {
    saffron: { bg: "rgba(224,164,80,0.14)", color: "var(--color-saffron-deep)", ring: "rgba(224,164,80,0.28)" },
    sage:    { bg: "rgba(123,161,124,0.18)", color: "var(--color-sage-deep)",    ring: "rgba(123,161,124,0.34)" },
    coral:   { bg: "rgba(226,120,108,0.16)", color: "var(--color-coral-deep)",   ring: "rgba(226,120,108,0.30)" },
  }[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.74rem] font-semibold"
      style={{ background: styles.bg, color: styles.color, boxShadow: `0 0 0 1px ${styles.ring}` }}
    >
      {children}
      {label}
    </span>
  );
}

// ─── Books-first hero (variant) ───────────────────────────────────────────────
// Leads with the value prop instead of a quiz, with topics demoted to an
// optional inline filter that re-ranks the shelf live.
function BooksFirstHero({
  topics, setTopics,
}: {
  topics: TopicId[];
  setTopics: (fn: (prev: TopicId[]) => TopicId[]) => void;
}) {
  const toggle = (id: TopicId) => {
    SFX.tap();
    setTopics((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  return (
    <section className="text-center">
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--color-sage-deep)" }}>
        Free · no sign-up
      </p>
      <h1
        className="mt-2 font-[family-name:var(--font-display)] font-semibold leading-[1.05] tracking-tight"
        style={{ fontSize: "clamp(1.85rem,6vw,2.5rem)", color: "var(--color-ink)" }}
      >
        Read any book — in your language
      </h1>
      <p className="mx-auto mt-3 max-w-[32ch] text-[0.95rem] leading-relaxed" style={{ color: "var(--color-ink-soft)" }}>
        Tap one to start reading instantly. Translate any page into your language as you go — layout kept intact. No account needed.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {TOPICS.map((topic) => {
          const selected = topics.includes(topic.id);
          const tone = TONE_MAP[topic.tone];
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => toggle(topic.id)}
              className="inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-[0.8rem] font-semibold transition-[transform,box-shadow,border-color,background] duration-150 active:scale-[0.96]"
              style={{
                borderColor: selected ? tone.ring : "var(--color-border-strong)",
                background: selected ? tone.bg : "white",
                color: "var(--color-ink)",
                boxShadow: selected ? `0 2px 0 ${tone.ring}40` : "0 2px 0 rgba(74,60,30,0.06)",
              }}
            >
              <span className="text-[0.95rem] leading-none">{topic.icon}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ─── Step 3 — Shelf (seed catalogue, clone-on-tap) ────────────────────────────
function StepShelf({
  topics, setTopics, onOpen, cloningSlug, total, idx, booksFirst,
}: {
  topics: TopicId[];
  setTopics: (fn: (prev: TopicId[]) => TopicId[]) => void;
  onOpen: (seed: Seed) => void;
  cloningSlug: string | null;
  total: number;
  idx: number;
  booksFirst?: boolean;
}) {
  const { t } = useI18n();
  // Catalogue lives server-side — `clone_id` is populated for seeds the user
  // has already opened so re-taps are instant rather than re-cloning.
  const { data: seeds, isLoading, error } = useQuery<Seed[]>({
    queryKey: ["seeds"],
    queryFn: listSeeds,
    staleTime: 30_000,
  });

  const ordered = useMemo(() => {
    const all = (seeds ?? []).filter((s) => SEED_DISPLAY[s.slug]);
    const slugScore = (slug: string) => {
      const d = SEED_DISPLAY[slug];
      const overlap = d ? d.topics.filter((t) => topics.includes(t)).length : 0;
      const order = SEED_ORDER.indexOf(slug);
      return overlap * 100 + (order >= 0 ? 100 - order : 0);
    };
    return [...all].sort((a, b) => slugScore(b.slug) - slugScore(a.slug));
  }, [seeds, topics]);

  return (
    <div>
      {booksFirst ? (
        <BooksFirstHero topics={topics} setTopics={setTopics} />
      ) : (
        <div className="text-center">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--color-plum)" }}>
            {t("join.s.eyebrow", { idx: idx + 1, total })}
          </p>
          <h2
            className="mt-2 font-[family-name:var(--font-display)] font-semibold leading-[1.05] tracking-tight"
            style={{ fontSize: "clamp(1.7rem,5.5vw,2.2rem)", color: "var(--color-ink)" }}
          >
            {t("join.s.title")}
          </h2>
          <p className="mx-auto mt-2 max-w-[30ch] text-[0.92rem]" style={{ color: "var(--color-ink-soft)" }}>
            {t("join.s.subtitle")}
          </p>
        </div>
      )}

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
          {t("join.s.loadError")}
        </div>
      )}

      {!isLoading && !error && (
        <ul className="mt-7 flex flex-col gap-3">
          {ordered.map((seed, i) => {
            const display = SEED_DISPLAY[seed.slug];
            const tagTopics = display.topics.slice(0, 2);
            const isCloning = cloningSlug === seed.slug;
            const alreadyOpened = !!seed.clone_id;
            const isLoved = i === 0 && !alreadyOpened;
            return (
              <li key={seed.slug}>
                <button
                  type="button"
                  disabled={!!cloningSlug && !isCloning}
                  onClick={() => onOpen(seed)}
                  className="group relative flex w-full items-center gap-4 rounded-2xl border-2 p-3.5 text-start transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.99] animate-float-in disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    animationDelay: `${i * 0.06}s`,
                    borderColor: isLoved ? "var(--color-saffron-deep)" : "var(--color-border-strong)",
                    background: "white",
                    boxShadow: isLoved ? "0 4px 0 rgba(152,96,24,0.30)" : "0 4px 0 rgba(74,60,30,0.10)",
                  }}
                >
                  {isLoved && (
                    <span
                      className="absolute -top-2 left-4 rounded-full px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.10em] text-white"
                      style={{ background: "var(--color-saffron-deep)", boxShadow: "0 2px 0 rgba(152,96,24,0.40)" }}
                    >
                      ★ {t("join.s.loved")}
                    </span>
                  )}
                  <div
                    className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md"
                    style={{ boxShadow: "2px 3px 0 rgba(74,60,30,0.18)" }}
                  >
                    <SeedCover slug={seed.slug} />
                    <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[3px]" style={{ background: "rgba(0,0,0,0.28)" }} />
                    <span aria-hidden className="pointer-events-none absolute inset-y-0 left-[3px] w-[1.5px]" style={{ background: "rgba(255,255,255,0.10)" }} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-[family-name:var(--font-display)] text-[1rem] font-semibold leading-tight" style={{ color: "var(--color-ink)" }}>
                      {seed.title}
                    </h3>
                    <p className="mt-0.5 truncate text-[0.82rem]" style={{ color: "var(--color-ink-soft)" }}>
                      {seed.author}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {tagTopics.map((tid) => {
                        const topic = TOPICS.find((x) => x.id === tid);
                        if (!topic) return null;
                        return (
                          <span
                            key={tid}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.66rem] font-semibold"
                            style={{ background: TONE_MAP[topic.tone].iconBg, color: TONE_MAP[topic.tone].iconColor }}
                          >
                            {topic.icon} {t(topic.labelKey)}
                          </span>
                        );
                      })}
                      {alreadyOpened && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.66rem] font-semibold"
                          style={{ background: "rgba(123,161,124,0.18)", color: "var(--color-sage-deep)" }}
                        >
                          {t("join.s.inLibrary")}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition-transform group-active:translate-x-0.5"
                    style={{ background: "var(--color-saffron-deep)", color: "white", boxShadow: "0 3px 0 rgba(152,96,24,0.50)" }}
                    aria-hidden
                  >
                    {isCloning ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M13 5l7 7-7 7" />
                      </svg>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!isLoading && !error && ordered.length === 0 && (
        <p className="mt-10 rounded-xl border-2 p-4 text-center text-[0.86rem]" style={{ borderColor: "var(--color-border)", background: "white", color: "var(--color-ink-soft)" }}>
          {t("join.s.emptyCatalog")}
        </p>
      )}

      <p className="mt-6 text-center text-[0.78rem]" style={{ color: "var(--color-ink-soft)" }}>
        {t("join.s.foot")}
      </p>

      {!isLoading && !error && ordered.length > 0 && (
        <div className="mt-10">
          <div className="relative flex items-center" role="separator" aria-hidden>
            <span className="flex-1 border-t" style={{ borderColor: "var(--color-border)" }} />
            <span
              className="mx-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em]"
              style={{ color: "var(--color-ink-soft)" }}
            >
              {t("join.s.skipDivider")}
            </span>
            <span className="flex-1 border-t" style={{ borderColor: "var(--color-border)" }} />
          </div>

          <div className="mt-5">
            <GoogleButton label={t("join.s.skipGoogle")} />
          </div>
          <p className="mt-3 text-center text-[0.76rem]" style={{ color: "var(--color-ink-soft)" }}>
            {t("join.s.skipNote")}
          </p>
        </div>
      )}
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

function GoogleButton({ label = "Continue with Google" }: { label?: string }) {
  const [loading, setLoading] = useState(false);
  const posthog = usePostHog();

  const handleClick = async () => {
    posthog?.capture("join_google_clicked");
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
      className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border-2 font-[family-name:var(--font-display)] text-[0.98rem] font-semibold transition-[transform,box-shadow] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-50"
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
      {loading ? "Redirecting" : label}
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
