"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { register, getGoogleAuthUrl } from "@/lib/auth";
import { startCheckout } from "@/lib/billing";
import { LOCALES, type Locale } from "@/lib/i18n";
import { Lumi, type LumiState } from "@/components/lumi/lumi";
import { TranslifyIcon } from "@/components/translify-mark";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";
const GOOGLE_CALLBACK = `${SITE}/auth/google/callback`;

// ─── Static BG data (deterministic — no hydration mismatch) ──────────────────
const BG_BOOKS = [
  { x: 2,  y: 7,  w: 52, h: 70,  color: "var(--color-saffron)", delay: 0,   dur: 5.2 },
  { x: 88, y: 5,  w: 44, h: 60,  color: "var(--color-sage)",    delay: 1.3, dur: 6.0 },
  { x: 1,  y: 63, w: 38, h: 53,  color: "var(--color-coral)",   delay: 2.4, dur: 7.0 },
  { x: 91, y: 56, w: 56, h: 78,  color: "var(--color-plum)",    delay: 0.7, dur: 5.8 },
  { x: 46, y: 2,  w: 34, h: 47,  color: "var(--color-sage)",    delay: 3.1, dur: 6.7 },
  { x: 73, y: 83, w: 48, h: 65,  color: "var(--color-saffron)", delay: 1.9, dur: 7.3 },
  { x: 18, y: 88, w: 40, h: 56,  color: "var(--color-coral)",   delay: 3.9, dur: 5.9 },
];
const BG_CHARS = [
  { x: 11, y: 17, ch: "読", delay: 0.3, sz: 90 },
  { x: 82, y: 27, ch: "ك",  delay: 1.5, sz: 78 },
  { x: 7,  y: 71, ch: "책", delay: 2.2, sz: 74 },
  { x: 87, y: 67, ch: "Я",  delay: 0.1, sz: 82 },
  { x: 53, y: 87, ch: "अ",  delay: 1.6, sz: 70 },
  { x: 17, y: 43, ch: "Α",  delay: 2.9, sz: 66 },
  { x: 64, y: 11, ch: "文", delay: 2.7, sz: 74 },
];
const BG_STARS = [
  { x: 31, y: 11, d: 0.5 }, { x: 67, y: 21, d: 1.1 }, { x: 13, y: 47, d: 1.9 },
  { x: 82, y: 41, d: 0.8 }, { x: 56, y: 93, d: 3.3 }, { x: 41, y: 77, d: 1.7 },
  { x: 95, y: 17, d: 2.5 }, { x: 25, y: 85, d: 0.9 }, { x: 77, y: 54, d: 3.6 },
  { x: 5,  y: 34, d: 2.3 }, { x: 38, y: 59, d: 4.1 }, { x: 60, y: 40, d: 0.4 },
];

const CONFETTI = Array.from({ length: 64 }, (_, i) => ({
  id: i,
  col: ["#E0A450","#7BA17C","#E2786C","#6B5B95","#F8D47A","#94C48A","#F4A6A0","#B5A0CC"][i % 8],
  left: (i * 1.5625) % 100,
  delay: (i * 0.028) % 1.4,
  size: 7 + (i % 5),
  rot: (i * 41) % 360,
  dur: 1.5 + (i % 4) * 0.28,
}));

// Deterministic book-stack bar heights (avoids Math.random at render)
const BAR_HEIGHTS = Array.from({ length: 20 }, (_, i) => 30 + ((i * 17 + 7) % 40));
const BAR_COLORS  = ["#E0A458", "#7BA17C", "#E2786C", "#6B5B95"];

// ─── Types & data ─────────────────────────────────────────────────────────────
type Persona = "student" | "curious" | "pro" | "family";

interface PlanRec {
  id: "reader" | "scholar" | "family";
  name: string;
  monthly: number;
  yearly: number;
  tone: "saffron" | "sage" | "coral" | "plum";
  emoji: string;
  tagline: string;
}

const PERSONA_PLANS: Record<Persona, PlanRec> = {
  student: { id: "scholar", name: "Scholar", monthly: 18.99, yearly: 14.99, tone: "saffron", emoji: "✦", tagline: "Unlimited reading for serious learners" },
  curious: { id: "reader",  name: "Reader",  monthly: 9.99,  yearly: 7.99,  tone: "sage",    emoji: "✿", tagline: "Perfect for curious explorers" },
  pro:     { id: "scholar", name: "Scholar", monthly: 18.99, yearly: 14.99, tone: "plum",    emoji: "◆", tagline: "Professional-grade reading tools" },
  family:  { id: "family",  name: "Family",  monthly: 27.99, yearly: 22,    tone: "coral",   emoji: "❀", tagline: "Up to 5 readers on one plan" },
};

const PERSONA_CARDS: { id: Persona; emoji: string; label: string; body: string; tone: "saffron" | "sage" | "plum" | "coral" }[] = [
  { id: "student", emoji: "✦", label: "Student / Learner",  body: "I'm studying a language or learning through books",                tone: "saffron" },
  { id: "curious", emoji: "✿", label: "Curious Reader",     body: "I want to explore books in languages I don't speak yet",           tone: "sage"    },
  { id: "pro",     emoji: "◆", label: "Professional",       body: "I read technical or business content in a foreign language",       tone: "plum"    },
  { id: "family",  emoji: "❀", label: "Family",             body: "We want everyone at home to read in our native languages",         tone: "coral"   },
];

const FEATURES = [
  { icon: "📚", label: "14 languages",        badge: "var(--color-saffron-deep)" },
  { icon: "💬", label: "Chat with any book",  badge: "var(--color-sage-deep)"    },
  { icon: "🎯", label: "Smart quizzes",       badge: "var(--color-coral-deep)"   },
  { icon: "✨", label: "AI-preserved layout", badge: "var(--color-plum)"         },
] as const;

const COUNTDOWN_SECS = 15 * 60;

function fmtPrice(n: number): string {
  const r = Math.round(n * 100) / 100;
  return r % 1 === 0 ? String(r) : r.toFixed(2);
}

// ─── Web Audio SFX (no external files, no loading delay) ─────────────────────
function playTone(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.14) {
  if (typeof window === "undefined") return;
  try {
    type WinAC = { webkitAudioContext?: typeof AudioContext };
    const AC = window.AudioContext ?? (window as unknown as WinAC).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.connect(vol);
    vol.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    vol.gain.setValueAtTime(gain, ctx.currentTime);
    vol.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start();
    osc.stop(ctx.currentTime + dur);
    osc.onended = () => ctx.close();
  } catch { /* autoplay policy or unsupported */ }
}

const SFX = {
  tap:     () => playTone(880, 0.07, "sine", 0.10),
  select:  () => {
    playTone(523, 0.11, "sine", 0.13);
    setTimeout(() => playTone(659, 0.14, "sine", 0.13), 75);
  },
  advance: () => {
    playTone(523, 0.09);
    setTimeout(() => playTone(659, 0.09), 90);
    setTimeout(() => playTone(784, 0.18), 180);
  },
  success: () => [523, 659, 784, 1047].forEach((f, i) =>
    setTimeout(() => playTone(f, 0.2, "sine", 0.15), i * 105)
  ),
  error:   () => playTone(200, 0.2, "sawtooth", 0.08),
};

// ─── Lumi speech per step ─────────────────────────────────────────────────────
function lumiSpeech(
  step: number, persona: Persona | null,
  name: string, email: string, pw: string,
  busy: boolean, done: boolean, err: string | null,
): { state: LumiState; text: string } {
  if (done) return { state: "celebrating", text: "Your shelf is ready! Welcome to Translify 🎉" };
  if (busy) return { state: "thinking",    text: "Setting up your library… almost there!" };
  if (err)  return { state: "sad",         text: "Hmm, something went wrong. Let's try again?" };
  if (step === 4) {
    if (email && pw) return { state: "excited",  text: "You're all set — just one tap! ✨" };
    if (pw)          return { state: "happy",     text: "Great password! You're almost in 💪" };
    if (email)       return { state: "happy",     text: "Love it! Now add a password." };
    if (name)        return { state: "happy",     text: `Nice to meet you, ${name}! 📖` };
    return                  { state: "waving",    text: "Almost there! Just create your account." };
  }
  if (step === 3) return { state: "celebrating", text: "I found your perfect plan! Let's go 🎉" };
  if (step === 2) return { state: "reading",     text: "How hungry is your reading appetite?" };
  if (step === 1) return { state: "happy",       text: "Which language are you learning?" };
  if (persona)    return { state: "celebrating", text: "Great choice! Let's keep going 🚀" };
  return                 { state: "waving",      text: "Hi! I'm Lumi. Tell me about yourself." };
}

// ─── Root component ───────────────────────────────────────────────────────────
export function JoinClient() {
  const router = useRouter();

  const [step,      setStep]      = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [persona,   setPersona]   = useState<Persona | null>(null);
  const [lang,      setLang]      = useState<Locale>("en");
  const [books,     setBooks]     = useState(4);

  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [pw,    setPw]    = useState("");
  const [busy,  setBusy]  = useState(false);
  const [err,   setErr]   = useState<string | null>(null);
  const [done,  setDone]  = useState(false);

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const planRec = persona ? PERSONA_PLANS[persona] : null;

  const clearAdvance = () => {
    if (advanceTimer.current) { clearTimeout(advanceTimer.current); advanceTimer.current = null; }
  };

  const go = (n: number, dir: 1 | -1 = 1) => {
    setDirection(dir);
    setStep(n);
  };

  const handlePersonaSelect = (p: Persona) => {
    setPersona(p);
    SFX.select();
    clearAdvance();
    advanceTimer.current = setTimeout(() => { SFX.advance(); go(1); }, 420);
  };

  const handleLangSelect = (l: Locale) => {
    setLang(l);
    SFX.select();
    clearAdvance();
    advanceTimer.current = setTimeout(() => { SFX.advance(); go(2); }, 320);
  };

  const handleNext  = () => { SFX.advance(); go(step + 1); };
  const handleBack  = () => { clearAdvance(); SFX.tap(); go(step - 1, -1); };

  const handleTryFree = async () => {
    if (!email || !pw) { setErr("Please enter your email and password."); SFX.error(); return; }
    setErr(null); setBusy(true);
    try {
      await register(email, pw, name || undefined);
      setDone(true);
      SFX.success();
      setTimeout(() => router.push("/library?welcome=1"), 2400);
    } catch (e) {
      SFX.error();
      setErr(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  };

  const handleSubscribe = async () => {
    if (!email || !pw) { setErr("Please enter your email and password."); SFX.error(); return; }
    setErr(null); setBusy(true);
    try {
      await register(email, pw, name || undefined);
      if (planRec) {
        try {
          const { url } = await startCheckout({ plan: planRec.id, cycle: "yearly", applyFirstMonthDiscount: true });
          window.location.href = url;
          return;
        } catch { /* Stripe not configured — fall through */ }
      }
      setDone(true);
      SFX.success();
      setTimeout(() => router.push("/library?welcome=1"), 2400);
    } catch (e) {
      SFX.error();
      setErr(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  };

  const { state: lumiState, text: lumiText } = lumiSpeech(step, persona, name, email, pw, busy, done, err);
  const animClass = direction > 0 ? "ob-enter-forward" : "ob-enter-back";
  const TOTAL = 5;

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background: "var(--color-paper)",
        backgroundImage: "radial-gradient(circle, rgba(74,60,30,0.07) 1.5px, transparent 1.5px)",
        backgroundSize: "26px 26px",
      }}
    >
      {done && <Confetti />}
      <FloatingBg />

      {/* Nav */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5 lg:px-10">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80" style={{ color: "var(--color-ink)" }}>
          <TranslifyIcon size={30} />
          <span className="font-[family-name:var(--font-display)] text-[1.1rem] font-semibold tracking-tight">Translify</span>
        </Link>
        <Link
          href="/login"
          className="rounded-full border-2 px-4 py-1.5 text-[0.82rem] font-bold transition-all hover:-translate-y-[2px]"
          style={{ borderColor: "var(--color-border-strong)", background: "white", color: "var(--color-ink-soft)", boxShadow: "0 3px 0 rgba(74,60,30,0.12)" }}
        >
          Sign in
        </Link>
      </header>

      {/* Progress bar */}
      <div className="relative z-20 mx-auto mt-1 max-w-xs px-6">
        <div className="h-2.5 overflow-hidden rounded-full" style={{ background: "rgba(74,60,30,0.10)" }}>
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / TOTAL) * 100}%`, background: "var(--color-saffron-deep)" }}
          />
        </div>
        <p className="mt-1 text-center text-[0.68rem] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--color-ink-soft)" }}>
          Step {step + 1} of {TOTAL}
        </p>
      </div>

      {/* Main content */}
      <main className="relative z-20 mx-auto max-w-5xl px-4 pb-24 pt-6 lg:px-8">
        {/* Lumi speech panel — shown on steps 0–3 */}
        {step < 4 && !done && <LumiPanel state={lumiState} text={lumiText} />}

        {/* Step content */}
        <div key={step} className={animClass}>
          {step === 0 && (
            <StepPersona persona={persona} onSelect={handlePersonaSelect} />
          )}
          {step === 1 && (
            <StepLanguage lang={lang} onSelect={handleLangSelect} />
          )}
          {step === 2 && (
            <StepBooks books={books} setBooks={setBooks} />
          )}
          {step === 3 && planRec && (
            <StepReveal planRec={planRec} lang={lang} books={books} />
          )}
          {step === 4 && (
            <StepAccount
              lumiState={lumiState} lumiText={lumiText} done={done}
              planRec={planRec}
              name={name}   setName={setName}
              email={email} setEmail={setEmail}
              pw={pw}       setPw={setPw}
              err={err} busy={busy}
              onTryFree={handleTryFree}
              onSubscribe={handleSubscribe}
            />
          )}
        </div>

        {/* Navigation: explicit Continue button for steps 2–3 */}
        {step >= 2 && step <= 3 && !done && (
          <div className="mt-10 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors hover:text-[color:var(--color-ink)]"
              style={{ color: "var(--color-ink-soft)" }}
            >
              ← Back
            </button>
            <DuoButton
              onClick={handleNext}
              label={step === 3 ? "Create my account →" : "Continue →"}
            />
          </div>
        )}

        {/* Back button for auto-advance step 1 */}
        {step === 1 && (
          <div className="mt-8">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors"
              style={{ color: "var(--color-ink-soft)" }}
            >
              ← Back
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Lumi speech panel (steps 0–3) ───────────────────────────────────────────
function LumiPanel({ state, text }: { state: LumiState; text: string }) {
  const [visible, setVisible] = useState(true);
  const displayed = useRef(text);

  useEffect(() => {
    if (text === displayed.current) return;
    setVisible(false);
    const t = setTimeout(() => { displayed.current = text; setVisible(true); }, 180);
    return () => clearTimeout(t);
  }, [text]);

  return (
    <div className="mb-5 flex justify-center">
      <div className="flex items-end gap-4">
        <Lumi state={state} size={88} animate />
        <div
          className="relative mb-5 max-w-[220px] rounded-[1.2rem] rounded-bl-md border-2 p-3.5"
          style={{
            borderColor: "var(--color-border)", background: "white",
            boxShadow: "0 4px 0 rgba(74,60,30,0.09)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0) scale(1)" : "translateY(5px) scale(0.97)",
            transition: "opacity 0.2s cubic-bezier(0.34,1.56,0.64,1), transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          <span
            aria-hidden
            className="absolute h-3 w-3 rotate-45 border-b-2 border-l-2"
            style={{ left: -7, bottom: 22, borderColor: "var(--color-border)", background: "white" }}
          />
          <p className="font-[family-name:var(--font-display)] text-[0.88rem] leading-snug" style={{ color: "var(--color-ink)" }}>
            {displayed.current}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Step 0: Persona ──────────────────────────────────────────────────────────
function StepPersona({ persona, onSelect }: { persona: Persona | null; onSelect: (p: Persona) => void }) {
  const toneMap = {
    saffron: { ring: "#D09040", bg: "linear-gradient(135deg,#FFFBF0,#FBE9C2)", iconBg: "rgba(224,164,80,0.18)", iconColor: "var(--color-saffron-deep)" },
    sage:    { ring: "#5A8C5A", bg: "linear-gradient(135deg,#F4F8EC,#DDEAD2)", iconBg: "rgba(123,161,124,0.18)", iconColor: "var(--color-sage-deep)"    },
    plum:    { ring: "#6B5B95", bg: "linear-gradient(135deg,#F4EEF7,#E0D2EA)", iconBg: "rgba(107,91,149,0.18)", iconColor: "var(--color-plum)"          },
    coral:   { ring: "#C0604A", bg: "linear-gradient(135deg,#FFF1EE,#F6CCC4)", iconBg: "rgba(226,120,108,0.18)", iconColor: "var(--color-coral-deep)"  },
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <p className="text-[0.74rem] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--color-saffron-deep)" }}>Nice to meet you</p>
        <h1
          className="mt-3 font-[family-name:var(--font-display)] font-semibold leading-[1.05] tracking-tight"
          style={{ fontSize: "clamp(1.9rem,5vw,3rem)", color: "var(--color-ink)" }}
        >
          What brings you to Translify?
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[0.95rem] leading-relaxed" style={{ color: "var(--color-ink-soft)" }}>
          We&apos;ll build your reading shelf around your answer.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {PERSONA_CARDS.map((card, i) => {
          const selected = persona === card.id;
          const s = toneMap[card.tone];
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelect(card.id)}
              className="group relative flex items-start gap-4 rounded-[1.4rem] border-2 p-5 text-start transition-all duration-300 animate-float-in"
              style={{
                animationDelay: `${i * 0.07}s`,
                borderColor: selected ? s.ring : "var(--color-border-strong)",
                background: selected ? s.bg : "white",
                boxShadow: selected
                  ? `0 6px 0 ${s.ring}55`
                  : "0 4px 0 rgba(74,60,30,0.09)",
                transform: selected ? "scale(1.025) translateY(-2px)" : "scale(1)",
              }}
            >
              <span
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-[family-name:var(--font-display)] text-2xl"
                style={{ background: s.iconBg, color: s.iconColor }}
              >
                {card.emoji}
              </span>
              <div className="flex-1 pt-0.5">
                <h3 className="font-[family-name:var(--font-display)] text-[1.1rem] font-semibold leading-tight" style={{ color: "var(--color-ink)" }}>
                  {card.label}
                </h3>
                <p className="mt-1 text-[0.87rem] leading-snug" style={{ color: "var(--color-ink-soft)" }}>{card.body}</p>
              </div>
              {selected && (
                <span className="absolute end-4 top-4 grid h-7 w-7 place-items-center rounded-full text-white animate-pop-in" style={{ background: "var(--color-ink)" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 1: Language picker ──────────────────────────────────────────────────
function StepLanguage({ lang, onSelect }: { lang: Locale; onSelect: (l: Locale) => void }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <p className="text-[0.74rem] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--color-saffron-deep)" }}>Great choice!</p>
        <h1
          className="mt-3 font-[family-name:var(--font-display)] font-semibold leading-[1.05] tracking-tight"
          style={{ fontSize: "clamp(1.9rem,5vw,3rem)", color: "var(--color-ink)" }}
        >
          Pick your reading language
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[0.95rem] leading-relaxed" style={{ color: "var(--color-ink-soft)" }}>
          This is the language your books will be translated <em>into</em>.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {LOCALES.map((l, i) => {
          const selected = lang === l.code;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => onSelect(l.code)}
              dir={l.dir}
              className="flex items-center justify-between gap-2 rounded-2xl border-2 px-4 py-3.5 transition-all duration-300 animate-float-in"
              style={{
                animationDelay: `${i * 0.05}s`,
                borderColor: selected ? "var(--color-saffron-deep)" : "var(--color-border-strong)",
                background: selected ? "linear-gradient(135deg,#FFFBF0,#FBE9C2)" : "white",
                boxShadow: selected ? "0 5px 0 rgba(208,144,64,0.40)" : "0 3px 0 rgba(74,60,30,0.08)",
                transform: selected ? "translateY(-2px)" : "translateY(0)",
              }}
            >
              <span className="flex items-center gap-2.5">
                <span className="text-2xl leading-none">{l.flag}</span>
                <span className="font-[family-name:var(--font-display)] text-[0.98rem] font-semibold" style={{ color: "var(--color-ink)" }}>{l.label}</span>
              </span>
              {selected && (
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-white animate-pop-in" style={{ background: "var(--color-ink)" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        className="mt-5 rounded-2xl border border-dashed px-5 py-3 text-center text-[0.84rem]"
        style={{ borderColor: "var(--color-border-strong)", color: "var(--color-ink-soft)" }}
      >
        More languages coming — Japanese, German, Arabic & more are already supported
      </div>
    </div>
  );
}

// ─── Step 2: Books slider ─────────────────────────────────────────────────────
function StepBooks({ books, setBooks }: { books: number; setBooks: (n: number) => void }) {
  const max = 20;
  const pct = (books / max) * 100;

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-8 text-center">
        <p className="text-[0.74rem] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--color-saffron-deep)" }}>One more thing</p>
        <h1
          className="mt-3 font-[family-name:var(--font-display)] font-semibold leading-[1.05] tracking-tight"
          style={{ fontSize: "clamp(1.9rem,5vw,3rem)", color: "var(--color-ink)" }}
        >
          How many books a month?
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[0.95rem] leading-relaxed" style={{ color: "var(--color-ink-soft)" }}>
          Roughly — we&apos;ll suggest the right plan for you.
        </p>
      </div>

      <div
        className="rounded-[1.6rem] border-2 p-8"
        style={{
          borderColor: "var(--color-border-strong)",
          background: "linear-gradient(135deg,#FFFCF3,#F5E9CD)",
          boxShadow: "0 8px 0 rgba(74,60,30,0.10)",
        }}
      >
        <div className="text-center">
          <div
            className="font-[family-name:var(--font-display)] font-semibold leading-none tracking-tight"
            style={{ fontSize: "clamp(4rem,12vw,7rem)", color: "var(--color-ink)" }}
          >
            {books}{books === max && <span style={{ color: "var(--color-saffron-deep)" }}>+</span>}
          </div>
          <p className="mt-2 text-sm font-bold uppercase tracking-[0.22em]" style={{ color: "var(--color-ink-soft)" }}>
            books / month
          </p>
        </div>

        {/* Visual book stack */}
        <div className="mt-8 flex h-16 items-end justify-center gap-1 overflow-hidden">
          {BAR_HEIGHTS.map((h, i) => (
            <span
              key={i}
              className="rounded-t-md transition-all duration-500"
              style={{
                width: "clamp(8px,1.6vw,14px)",
                height: i < books ? `${h}px` : "8px",
                background: i < books ? BAR_COLORS[i % BAR_COLORS.length] : "rgba(74,60,30,0.08)",
                transitionDelay: `${i * 22}ms`,
              }}
            />
          ))}
        </div>

        {/* Slider */}
        <div className="mt-8 px-2">
          <div className="relative">
            <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full" style={{ background: "rgba(74,60,30,0.10)" }} />
            <div
              className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full transition-all"
              style={{ width: `${pct}%`, background: "linear-gradient(to right,var(--color-saffron),var(--color-coral),var(--color-plum))" }}
            />
            <input
              type="range" min={1} max={max} value={books}
              onChange={(e) => setBooks(Number(e.target.value))}
              className="join-slider relative h-6 w-full cursor-pointer appearance-none bg-transparent"
              aria-label="Books per month"
            />
          </div>
          <div className="mt-3 flex justify-between text-[0.7rem] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--color-ink-soft)" }}>
            <span>1</span><span>5</span><span>10</span><span>15</span><span>20+</span>
          </div>
        </div>
      </div>

      <style>{`
        .join-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 30px; height: 30px; border-radius: 50%;
          background: var(--color-ink); border: 3px solid var(--color-paper);
          box-shadow: 0 4px 14px rgba(20,16,8,0.35); cursor: grab; transition: transform 0.15s;
        }
        .join-slider::-webkit-slider-thumb:active { transform: scale(1.15); cursor: grabbing; }
        .join-slider::-moz-range-thumb {
          width: 30px; height: 30px; border-radius: 50%;
          background: var(--color-ink); border: 3px solid var(--color-paper);
          box-shadow: 0 4px 14px rgba(20,16,8,0.35); cursor: grab;
        }
      `}</style>
    </div>
  );
}

// ─── Step 3: Plan reveal ──────────────────────────────────────────────────────
function StepReveal({ planRec, lang, books }: { planRec: PlanRec; lang: Locale; books: number }) {
  const [secs, setSecs] = useState(COUNTDOWN_SECS);

  useEffect(() => {
    const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const langInfo = LOCALES.find((l) => l.code === lang);
  const discounted = fmtPrice(planRec.monthly * 0.6);

  const toneMap = {
    saffron: { bg: "linear-gradient(135deg,#FFFBF0,#F8E1B0,#F0CC85)", border: "#D09040", chip: "#D09040", accent: "var(--color-saffron-deep)" },
    sage:    { bg: "linear-gradient(135deg,#F4F8EC,#CCDDC0,#A9C5A8)",  border: "#5A8C5A", chip: "#5A8C5A", accent: "var(--color-sage-deep)"    },
    coral:   { bg: "linear-gradient(135deg,#FFF1EE,#F4BBB1,#E59C8F)",  border: "#C0604A", chip: "#C0604A", accent: "var(--color-coral-deep)"   },
    plum:    { bg: "linear-gradient(135deg,#F4EEF7,#D2BFE0,#B5A0CC)",  border: "#6B5B95", chip: "#6B5B95", accent: "var(--color-plum)"         },
  }[planRec.tone];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 text-center">
        <p className="text-[0.74rem] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--color-saffron-deep)" }}>Your perfect match</p>
        <h1
          className="mt-3 font-[family-name:var(--font-display)] font-semibold leading-[1.05] tracking-tight"
          style={{ fontSize: "clamp(1.8rem,5vw,2.8rem)", color: "var(--color-ink)" }}
        >
          We found your plan 🎯
        </h1>
      </div>

      {/* Plan card */}
      <div
        className="relative overflow-hidden rounded-[1.8rem] border-2 p-8"
        style={{
          borderColor: toneMap.border,
          background: toneMap.bg,
          boxShadow: `0 10px 0 ${toneMap.border}44`,
        }}
      >
        {/* Recommended chip */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-white"
            style={{ background: toneMap.chip, boxShadow: "0 6px 16px -4px rgba(20,16,8,0.4)" }}
          >
            ★ Recommended for you
          </span>
        </div>

        <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
          {/* Plan icon */}
          <div
            className="mx-auto grid h-20 w-20 place-items-center rounded-[1.2rem] font-[family-name:var(--font-display)] text-[2.8rem] sm:mx-0"
            style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(4px)", color: toneMap.accent, boxShadow: "0 6px 18px -6px rgba(20,16,8,0.2)" }}
          >
            {planRec.emoji}
          </div>

          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--color-ink-soft)" }}>Your plan</p>
            <h3
              className="mt-1 font-[family-name:var(--font-display)] text-[2rem] font-semibold leading-tight tracking-tight"
              style={{ color: "var(--color-ink)" }}
            >
              Translify {planRec.name}
            </h3>
            <p className="mt-1 text-[0.9rem]" style={{ color: "var(--color-ink-soft)" }}>{planRec.tagline}</p>

            {/* Pricing */}
            <div className="mt-4 flex items-end gap-3">
              <span
                className="font-[family-name:var(--font-display)] font-semibold leading-none tracking-tight"
                style={{ fontSize: "clamp(2.8rem,8vw,3.4rem)", color: "var(--color-ink)" }}
              >
                €{discounted}
              </span>
              <div className="pb-1.5">
                <span className="block text-sm line-through" style={{ color: "var(--color-ink-soft)" }}>€{planRec.monthly}</span>
                <span className="block text-xs" style={{ color: "var(--color-ink-soft)" }}>first month</span>
              </div>
              <span
                className="mb-1 ms-auto inline-flex h-9 items-center rounded-full px-3 text-sm font-bold text-white"
                style={{ background: toneMap.chip, boxShadow: "0 4px 10px -2px rgba(20,16,8,0.3)" }}
              >
                –40%
              </span>
            </div>
            <p className="mt-1 text-[0.84rem]" style={{ color: "var(--color-ink-soft)" }}>
              then €{planRec.monthly}/mo · cancel anytime
            </p>

            {/* Match bullets */}
            <ul className="mt-5 space-y-1.5 text-[0.9rem]" style={{ color: "var(--color-ink)" }}>
              <li className="flex items-center gap-2.5"><span>📚</span> {books === 20 ? "20+" : books} books/month — you&apos;re covered</li>
              <li className="flex items-center gap-2.5"><span>{langInfo?.flag ?? "🌐"}</span> Full {langInfo?.label ?? lang} translation</li>
              <li className="flex items-center gap-2.5"><span>✨</span> AI layout preservation + chat</li>
              <li className="flex items-center gap-2.5"><span>✓</span> 30-day money-back guarantee</li>
            </ul>
          </div>
        </div>

        {/* Countdown */}
        <div
          className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border px-5 py-4 sm:flex-row"
          style={{ borderColor: "rgba(20,16,8,0.12)", background: "rgba(255,255,255,0.55)", backdropFilter: "blur(4px)" }}
        >
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full text-white" style={{ background: "var(--color-ink)" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
              </svg>
            </span>
            <div>
              <p className="text-[0.66rem] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--color-ink-soft)" }}>Offer expires</p>
              <p className="font-[family-name:var(--font-display)] text-[1.4rem] font-semibold leading-tight tabular-nums" style={{ color: "var(--color-ink)" }}>
                {mm}:{ss}
              </p>
            </div>
          </div>
          <p className="text-end text-[0.78rem] leading-snug sm:max-w-[180px]" style={{ color: "var(--color-ink-soft)" }}>
            Lock in your <strong style={{ color: "var(--color-ink)" }}>–40% first month</strong> discount before it expires
          </p>
        </div>
      </div>

      <p className="mt-5 text-center text-[0.84rem]" style={{ color: "var(--color-ink-soft)" }}>
        Or start with our <strong style={{ color: "var(--color-ink)" }}>free plan</strong> — no card needed, upgrade anytime.
      </p>
    </div>
  );
}

// ─── Step 4: Account creation ─────────────────────────────────────────────────
function StepAccount({
  lumiState, lumiText, done, planRec,
  name, setName, email, setEmail, pw, setPw,
  err, busy, onTryFree, onSubscribe,
}: {
  lumiState: LumiState; lumiText: string; done: boolean;
  planRec: PlanRec | null;
  name: string;  setName:  (s: string) => void;
  email: string; setEmail: (s: string) => void;
  pw: string;    setPw:    (s: string) => void;
  err: string | null; busy: boolean;
  onTryFree:   () => void;
  onSubscribe: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const formReady = !!email && !!pw;

  if (done) {
    return (
      <div
        className="mx-auto max-w-md rounded-3xl border-2 p-10 text-center"
        style={{ borderColor: "var(--color-border)", background: "white", boxShadow: "0 8px 0 rgba(74,60,30,0.12)" }}
      >
        <div className="mx-auto mb-5 grid h-20 w-20 animate-pop-in place-items-center rounded-full text-4xl" style={{ background: "rgba(224,164,80,0.15)" }}>
          🎉
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-[1.8rem] font-semibold leading-tight" style={{ color: "var(--color-ink)" }}>
          Your shelf is ready!
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--color-ink-soft)" }}>Taking you to your library…</p>
        <div className="mt-6 flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--color-saffron)", animation: `dot-bounce 0.9s ease-in-out ${i * 0.22}s infinite` }} />
          ))}
        </div>
        <style>{`@keyframes dot-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-10px)}}`}</style>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
      {/* Left: Lumi + feature unlocks */}
      <LumiHeroPanel lumiState={lumiState} lumiText={lumiText} />

      {/* Right: Account form */}
      <div
        className="rounded-3xl border-2 p-7 lg:p-8"
        style={{ borderColor: "var(--color-border-strong)", background: "white", boxShadow: "0 8px 0 rgba(74,60,30,0.12)" }}
      >
        <div className="mb-6">
          <span
            className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.15em]"
            style={{ background: "rgba(224,164,80,0.12)", color: "var(--color-saffron-deep)" }}
          >
            🆕 Final step
          </span>
          <h2
            className="font-[family-name:var(--font-display)] text-[1.75rem] font-semibold leading-[1.05] tracking-tight"
            style={{ color: "var(--color-ink)" }}
          >
            Create your account
          </h2>
          {planRec && (
            <p className="mt-1 text-[0.88rem]" style={{ color: "var(--color-ink-soft)" }}>
              Recommended: <strong style={{ color: "var(--color-ink)" }}>Translify {planRec.name}</strong> — or start free below.
            </p>
          )}
        </div>

        {/* Google sign-in */}
        <GoogleButton callbackUrl={GOOGLE_CALLBACK} />

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
          <span className="text-[0.72rem] font-semibold" style={{ color: "var(--color-ink-soft)" }}>or continue with email</span>
          <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
        </div>

        <div className="flex flex-col gap-3.5">
          <GameField icon="👤" type="text"     placeholder="Your name (optional)"     value={name}  onChange={setName}  autoComplete="name"         />
          <GameField icon="📧" type="email"    placeholder="Email address"            value={email} onChange={setEmail} autoComplete="email" required />
          <GameField icon="🔒" type="password" placeholder="Password (8+ characters)" value={pw}    onChange={setPw}   autoComplete="new-password" minLength={8} required />

          {err && (
            <div
              className="rounded-2xl border-2 px-4 py-3 text-[0.88rem] font-medium"
              style={{ borderColor: "rgba(220,38,38,0.28)", background: "rgba(220,38,38,0.06)", color: "#B91C1C" }}
            >
              {err}
            </div>
          )}

          {/* Duolingo 3D "start free" button */}
          <button
            type="button"
            disabled={busy || !formReady}
            onMouseDown={() => setPressed(true)}
            onMouseUp={() => setPressed(false)}
            onMouseLeave={() => setPressed(false)}
            onTouchStart={() => setPressed(true)}
            onTouchEnd={() => setPressed(false)}
            onClick={onTryFree}
            className="mt-1.5 h-14 w-full rounded-2xl font-[family-name:var(--font-display)] text-[1.05rem] font-bold transition-[transform,box-shadow] duration-75 disabled:cursor-not-allowed disabled:opacity-45"
            style={{
              background: formReady && !busy ? "linear-gradient(to bottom,#EDB86A,#D09040)" : "rgba(74,60,30,0.10)",
              color: formReady && !busy ? "white" : "rgba(74,60,30,0.3)",
              boxShadow: pressed || !formReady || busy ? "none" : "0 6px 0 rgba(152,96,24,0.50)",
              transform: pressed && formReady && !busy ? "translateY(6px)" : "translateY(0)",
            }}
          >
            {busy ? "Creating your shelf…" : "Start reading for free →"}
          </button>

          <p className="text-center text-[0.7rem]" style={{ color: "var(--color-ink-soft)" }}>
            No credit card · Cancel anytime · 30-day money-back
          </p>

          {planRec && (
            <button
              type="button"
              disabled={busy || !formReady}
              onClick={onSubscribe}
              className="self-center text-[0.85rem] font-medium underline decoration-dotted underline-offset-4 transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:text-[color:var(--color-ink)]"
              style={{ color: "var(--color-ink-soft)", textDecorationColor: "rgba(74,60,30,0.30)" }}
            >
              Or subscribe to {planRec.name} · €{fmtPrice(planRec.monthly * 0.6)} first month
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
          <span className="text-[0.72rem]" style={{ color: "var(--color-ink-soft)" }}>or</span>
          <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
        </div>

        <p className="text-center text-[0.84rem]" style={{ color: "var(--color-ink-soft)" }}>
          Already a reader?{" "}
          <Link href="/login" className="font-bold underline underline-offset-4" style={{ color: "var(--color-ink)", textDecorationColor: "var(--color-saffron)" }}>
            Log in
          </Link>
        </p>

        {/* Social proof */}
        <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl px-4 py-3" style={{ background: "rgba(224,164,80,0.07)", border: "1.5px solid rgba(224,164,80,0.18)" }}>
          <div className="flex -space-x-1.5">
            {["L","A","K","M"].map((ch, i) => (
              <span key={i} className="grid h-6 w-6 place-items-center rounded-full border-2 text-[0.6rem] font-bold text-white" style={{ borderColor: "white", background: ["var(--color-saffron-deep)","var(--color-sage-deep)","var(--color-coral-deep)","var(--color-plum)"][i] }}>{ch}</span>
            ))}
          </div>
          <p className="text-[0.78rem]" style={{ color: "var(--color-ink-soft)" }}>
            <span className="font-bold" style={{ color: "var(--color-ink)" }}>42,000+</span> readers · 60+ countries
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Lumi hero panel (step 4 left column) ────────────────────────────────────
function LumiHeroPanel({ lumiState, lumiText }: { lumiState: LumiState; lumiText: string }) {
  const [visible, setVisible] = useState(true);
  const displayed = useRef(lumiText);

  useEffect(() => {
    if (lumiText === displayed.current) return;
    setVisible(false);
    const t = setTimeout(() => { displayed.current = lumiText; setVisible(true); }, 180);
    return () => clearTimeout(t);
  }, [lumiText]);

  return (
    <div className="flex flex-col items-center gap-5 lg:items-start">
      <div
        className="flex items-center gap-2 rounded-full border-2 px-4 py-1.5"
        style={{ borderColor: "var(--color-border)", background: "white", boxShadow: "0 3px 0 rgba(74,60,30,0.08)" }}
      >
        <span style={{ color: "var(--color-saffron-deep)" }}>✦</span>
        <span className="text-[0.72rem] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--color-ink-soft)" }}>Your reading guide</span>
      </div>

      <div className="flex items-end gap-4">
        <div className="shrink-0">
          <Lumi state={lumiState} size={180} animate />
        </div>
        <div
          className="relative mb-8 max-w-[200px] rounded-[1.3rem] rounded-bl-md border-2 p-4"
          style={{
            borderColor: "var(--color-border)", background: "white", boxShadow: "0 5px 0 rgba(74,60,30,0.10)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0) scale(1)" : "translateY(6px) scale(0.97)",
            transition: "opacity 0.22s cubic-bezier(0.34,1.56,0.64,1), transform 0.22s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          <span aria-hidden className="absolute h-3 w-3 rotate-45 border-b-2 border-l-2" style={{ left: -8, bottom: 26, borderColor: "var(--color-border)", background: "white" }} />
          <p className="font-[family-name:var(--font-display)] text-[0.9rem] leading-snug" style={{ color: "var(--color-ink)" }}>{displayed.current}</p>
        </div>
      </div>

      <div className="w-full space-y-2.5 lg:max-w-sm">
        <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--color-ink-soft)" }}>You&apos;re unlocking</p>
        {FEATURES.map((f, i) => (
          <div
            key={i}
            className="flex animate-float-in items-center gap-3 rounded-2xl border-2 px-4 py-3"
            style={{ borderColor: "var(--color-border)", background: "white", boxShadow: "0 4px 0 rgba(74,60,30,0.09)", animationDelay: `${0.06 + i * 0.11}s` }}
          >
            <span className="text-[1.25rem] leading-none">{f.icon}</span>
            <span className="font-[family-name:var(--font-display)] text-[0.94rem] font-semibold" style={{ color: "var(--color-ink)" }}>{f.label}</span>
            <span className="ml-auto grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.6rem] font-bold text-white" style={{ background: f.badge }}>✓</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Duolingo 3D continue button ──────────────────────────────────────────────
function DuoButton({ onClick, label }: { onClick: () => void; label: string }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      className="h-12 rounded-2xl px-8 font-[family-name:var(--font-display)] text-[1rem] font-bold text-white transition-[transform,box-shadow] duration-75"
      style={{
        background: "linear-gradient(to bottom,#EDB86A,#D09040)",
        boxShadow: pressed ? "none" : "0 5px 0 rgba(152,96,24,0.50)",
        transform: pressed ? "translateY(5px)" : "translateY(0)",
      }}
    >
      {label}
    </button>
  );
}

// ─── Styled input field ───────────────────────────────────────────────────────
function GameField({
  icon, type, placeholder, value, onChange, autoComplete, required, minLength,
}: {
  icon: string; type: string; placeholder: string; value: string;
  onChange: (v: string) => void;
  autoComplete?: string; required?: boolean; minLength?: number;
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
        className="flex-1 bg-transparent py-3.5 text-[0.95rem] outline-none"
        style={{ color: "var(--color-ink)", caretColor: "var(--color-saffron-deep)" }}
      />
      {value && (
        <span className="animate-pop-in grid h-5 w-5 shrink-0 place-items-center rounded-full text-[0.58rem] font-bold text-white" style={{ background: "var(--color-sage-deep)" }}>✓</span>
      )}
    </div>
  );
}

// ─── Google OAuth button ──────────────────────────────────────────────────────
function GoogleButton({ callbackUrl }: { callbackUrl: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const url = await getGoogleAuthUrl(callbackUrl);
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
      className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border-2 font-[family-name:var(--font-display)] text-[0.95rem] font-semibold transition-all hover:-translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        borderColor: "var(--color-border-strong)",
        background: "white",
        color: "var(--color-ink)",
        boxShadow: "0 3px 0 rgba(74,60,30,0.09)",
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

// ─── Animated background ──────────────────────────────────────────────────────
function FloatingBg() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {BG_BOOKS.map((b, i) => (
        <div key={i} className="absolute rounded-xl" style={{ left: `${b.x}%`, top: `${b.y}%`, width: b.w, height: b.h, background: b.color, opacity: 0.10, boxShadow: "3px 4px 0 rgba(74,60,30,0.14)", animationName: "bg-bob", animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s`, animationTimingFunction: "ease-in-out", animationIterationCount: "infinite", animationDirection: "alternate" }} />
      ))}
      {BG_CHARS.map((c, i) => (
        <span key={i} className="absolute select-none" style={{ left: `${c.x}%`, top: `${c.y}%`, fontSize: c.sz, lineHeight: 1, fontFamily: "var(--font-display),serif", color: "rgba(74,60,30,0.055)", animationName: "bg-bob", animationDuration: "7.5s", animationDelay: `${c.delay}s`, animationTimingFunction: "ease-in-out", animationIterationCount: "infinite", animationDirection: "alternate" }}>{c.ch}</span>
      ))}
      {BG_STARS.map((s, i) => (
        <span key={i} className="absolute select-none" style={{ left: `${s.x}%`, top: `${s.y}%`, fontSize: 18, color: "var(--color-saffron)", opacity: 0.28, animationName: "sparkle", animationDuration: "3.8s", animationDelay: `${s.d}s`, animationTimingFunction: "ease-in-out", animationIterationCount: "infinite" }}>✦</span>
      ))}
      <style>{`
        @keyframes bg-bob { from{transform:translateY(0) rotate(-1.5deg)} to{transform:translateY(-20px) rotate(1.5deg)} }
        @keyframes sparkle { 0%,100%{opacity:.12;transform:scale(.75) rotate(0deg)} 50%{opacity:.50;transform:scale(1.45) rotate(200deg)} }
      `}</style>
    </div>
  );
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
function Confetti() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {CONFETTI.map((p) => (
        <div key={p.id} className="absolute" style={{ left: `${p.left}%`, top: "-12px", width: p.size, height: Math.round(p.size * 0.55), background: p.col, borderRadius: 2, transform: `rotate(${p.rot}deg)`, animationName: "confetti-fall", animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`, animationTimingFunction: "ease-in", animationFillMode: "both" }} />
      ))}
      <style>{`@keyframes confetti-fall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(105vh) rotate(740deg);opacity:0}}`}</style>
    </div>
  );
}
