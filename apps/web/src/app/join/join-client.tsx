"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";
import { ApiError, getToken } from "@/lib/api";
import { getGoogleAuthUrl, startAnonymousSession } from "@/lib/auth";
import { cloneSeed, listSeeds, type Seed } from "@/lib/seeds";
import { Lumi } from "@/components/lumi/lumi";
import { TranslifyIcon } from "@/components/translify-mark";

// ─── Study subjects → one real open-access textbook each ──────────────────────
// Slugs mirror app/seeds/catalog.py. Books are hosted and read as-is (no live
// translation). Tap a subject → mint an anon session, clone that book, drop
// straight into the reader. The signup wall is a timed soft wall inside the
// reader (fires after a short taste), so here we keep it one tap to value.
type Tone = "saffron" | "sage" | "coral" | "plum";

interface Subject {
  id: string;
  label: string;
  icon: string;
  slug: string;
  book: string;
  author: string;
  tone: Tone;
}

const SUBJECTS: Subject[] = [
  { id: "cs",         label: "Computer Science", icon: "💻", slug: "dive-into-deep-learning",          book: "Dive into Deep Learning",    author: "Zhang, Lipton, Li, Smola", tone: "plum"    },
  { id: "biology",    label: "Biology",          icon: "🧬", slug: "openstax-biology-2e",              book: "Biology 2e",                 author: "OpenStax",                 tone: "sage"    },
  { id: "chemistry",  label: "Chemistry",        icon: "⚗️", slug: "openstax-chemistry-2e",            book: "Chemistry 2e",               author: "OpenStax",                 tone: "coral"   },
  { id: "physics",    label: "Physics",          icon: "🔭", slug: "openstax-university-physics-1",    book: "University Physics, Vol. 1", author: "OpenStax",                 tone: "saffron" },
  { id: "calculus",   label: "Calculus",         icon: "📐", slug: "openstax-calculus-1",              book: "Calculus, Vol. 1",           author: "OpenStax",                 tone: "plum"    },
  { id: "statistics", label: "Statistics",       icon: "📊", slug: "openstax-intro-statistics",        book: "Introductory Statistics",    author: "OpenStax",                 tone: "sage"    },
  { id: "economics",  label: "Economics",        icon: "📈", slug: "openstax-principles-economics-2e", book: "Principles of Economics 2e", author: "OpenStax",                 tone: "coral"   },
  { id: "psychology", label: "Psychology",       icon: "🧠", slug: "openstax-psychology-2e",           book: "Psychology 2e",              author: "OpenStax",                 tone: "saffron" },
];

const TONE: Record<Tone, { ring: string; bg: string; tile: string; tileFg: string }> = {
  saffron: { ring: "#D09040", bg: "linear-gradient(135deg,#FFFBF0,#FBE9C2)", tile: "rgba(224,164,80,0.18)", tileFg: "var(--color-saffron-deep)" },
  sage:    { ring: "#5A8C5A", bg: "linear-gradient(135deg,#F4F8EC,#DDEAD2)", tile: "rgba(123,161,124,0.18)", tileFg: "var(--color-sage-deep)" },
  coral:   { ring: "#C0604A", bg: "linear-gradient(135deg,#FFF1EE,#F6CCC4)", tile: "rgba(226,120,108,0.18)", tileFg: "var(--color-coral-deep)" },
  plum:    { ring: "#6B5B95", bg: "linear-gradient(135deg,#F4EEF7,#E0D2EA)", tile: "rgba(107,91,149,0.18)", tileFg: "var(--color-plum)" },
};

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
  select: () => { playTone(523, 0.09); setTimeout(() => playTone(659, 0.10), 70); },
  error:  () => playTone(200, 0.2, "sawtooth", 0.08),
};

// ─── Root ─────────────────────────────────────────────────────────────────────
export function JoinClient() {
  const router = useRouter();
  const posthog = usePostHog();
  const startedRef = useRef(false);

  const [opening, setOpening] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    posthog?.capture("join_started", { flow: "subjects" });
  }, [posthog]);

  // Which seeds are actually ingested — lets us mark not-yet-available subjects.
  const { data: seeds, isLoading: seedsLoading } = useQuery<Seed[]>({
    queryKey: ["seeds"],
    queryFn: listSeeds,
    staleTime: 30_000,
  });
  const available = new Set((seeds ?? []).map((s) => s.slug));

  const openSubject = async (subject: Subject) => {
    if (opening) return;
    setErr(null);
    posthog?.capture("join_subject_opened", { subject: subject.id, slug: subject.slug });
    SFX.select();
    setOpening(subject.slug);
    try {
      if (!getToken()) {
        await startAnonymousSession();
        posthog?.capture("anon_session_started", { slug: subject.slug });
      }
      const book = await cloneSeed(subject.slug);
      router.push(`/library/${book.id}?welcome=1&study=1`);
    } catch (e) {
      SFX.error();
      setErr(
        e instanceof ApiError && e.status === 404
          ? `${subject.label} is being added. Check back soon, or pick another subject.`
          : "Couldn't open that book. Check your connection and try again.",
      );
      setOpening(null);
    }
  };

  return (
    <div
      className="relative min-h-[100dvh] overflow-x-hidden"
      style={{
        background: "var(--color-paper)",
        backgroundImage: "radial-gradient(circle, rgba(74,60,30,0.06) 1.4px, transparent 1.4px)",
        backgroundSize: "26px 26px",
      }}
    >
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 backdrop-blur-md"
        style={{ background: "rgba(252,248,238,0.85)", borderBottom: "1px solid rgba(74,60,30,0.06)" }}
      >
        <Link href="/" className="flex items-center gap-2" style={{ color: "var(--color-ink)" }}>
          <TranslifyIcon size={26} />
          <span className="font-[family-name:var(--font-display)] text-[1rem] font-semibold tracking-tight">
            Translify
          </span>
        </Link>
        <Link href="/login" className="text-[0.82rem] font-semibold" style={{ color: "var(--color-ink-soft)" }}>
          Log in
        </Link>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-md px-4 pb-16 pt-5 sm:max-w-lg sm:pt-8">
        <section className="text-center">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--color-sage-deep)" }}>
            Free · no card to start
          </p>
          <h1
            className="mt-2 font-[family-name:var(--font-display)] font-semibold leading-[1.05] tracking-tight"
            style={{ fontSize: "clamp(1.85rem,6vw,2.5rem)", color: "var(--color-ink)" }}
          >
            Pick your subject. Start studying.
          </h1>
          <p className="mx-auto mt-3 max-w-[34ch] text-[0.95rem] leading-relaxed" style={{ color: "var(--color-ink-soft)" }}>
            Tap a subject and jump straight into a real textbook. Ask it anything with cited
            answers, quiz yourself, and drill flashcards.
          </p>
        </section>

        <div className="mt-7 grid grid-cols-2 gap-3">
          {SUBJECTS.map((subject, i) => {
            const tone = TONE[subject.tone];
            const isOpening = opening === subject.slug;
            const soon = !seedsLoading && seeds !== undefined && !available.has(subject.slug);
            const disabled = (!!opening && !isOpening) || soon;
            return (
              <button
                key={subject.id}
                type="button"
                disabled={disabled}
                onClick={() => openSubject(subject)}
                className="group relative flex flex-col items-start gap-2 rounded-2xl border-2 p-3.5 text-left transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] animate-float-in disabled:cursor-not-allowed disabled:opacity-55"
                style={{
                  animationDelay: `${i * 0.04}s`,
                  borderColor: "var(--color-border-strong)",
                  background: tone.bg,
                  boxShadow: "0 4px 0 rgba(74,60,30,0.10)",
                }}
              >
                <span
                  className="grid h-10 w-10 place-items-center rounded-xl text-[1.4rem] leading-none"
                  style={{ background: tone.tile, color: tone.tileFg }}
                  aria-hidden
                >
                  {subject.icon}
                </span>
                <span className="font-[family-name:var(--font-display)] text-[1rem] font-semibold leading-tight" style={{ color: "var(--color-ink)" }}>
                  {subject.label}
                </span>
                <span className="min-h-[2.4em] text-[0.74rem] leading-snug" style={{ color: "var(--color-ink-soft)" }}>
                  {subject.book}
                  <br />
                  <span style={{ opacity: 0.7 }}>{subject.author}</span>
                </span>

                {soon ? (
                  <span className="mt-0.5 rounded-full px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.1em]" style={{ background: "rgba(74,60,30,0.10)", color: "var(--color-ink-soft)" }}>
                    Soon
                  </span>
                ) : (
                  <span
                    className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full transition-transform group-active:translate-x-0.5"
                    style={{ background: "var(--color-saffron-deep)", color: "white", boxShadow: "0 2px 0 rgba(152,96,24,0.50)" }}
                    aria-hidden
                  >
                    {isOpening ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M13 5l7 7-7 7" />
                      </svg>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {err && (
          <div
            className="mt-5 rounded-xl px-4 py-3 text-[0.86rem]"
            style={{ background: "rgba(220,38,38,0.07)", color: "#B91C1C", border: "1.5px solid rgba(220,38,38,0.22)" }}
          >
            {err}
          </div>
        )}

        <p className="mt-6 text-center text-[0.78rem]" style={{ color: "var(--color-ink-soft)" }}>
          No card, no email yet. One tap to start studying.
        </p>

        <div className="mt-9">
          <div className="relative flex items-center" role="separator" aria-hidden>
            <span className="flex-1 border-t" style={{ borderColor: "var(--color-border)" }} />
            <span className="mx-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--color-ink-soft)" }}>
              or sign up
            </span>
            <span className="flex-1 border-t" style={{ borderColor: "var(--color-border)" }} />
          </div>
          <div className="mt-5">
            <GoogleButton label="Sign up with Google" />
          </div>
          <p className="mt-3 text-center text-[0.76rem]" style={{ color: "var(--color-ink-soft)" }}>
            Bring your own PDF or EPUB after you sign up.
          </p>
        </div>
      </main>

      {opening && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center" style={{ background: "rgba(252,248,238,0.55)" }}>
          <Lumi state="thinking" size={72} animate />
        </div>
      )}
    </div>
  );
}

// ─── Google sign-up ───────────────────────────────────────────────────────────
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
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
