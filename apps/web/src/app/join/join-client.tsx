"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { register } from "@/lib/auth";
import { Lumi, type LumiState } from "@/components/lumi/lumi";
import { TranslifyIcon } from "@/components/translify-mark";

// ─── Static background data (no Math.random = no hydration mismatch) ──────────
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

// ─── Feature unlocks ──────────────────────────────────────────────────────────
const FEATURES = [
  { icon: "📚", label: "14 languages",        badge: "var(--color-saffron-deep)" },
  { icon: "💬", label: "Chat with any book",  badge: "var(--color-sage-deep)"    },
  { icon: "🎯", label: "Smart quizzes",       badge: "var(--color-coral-deep)"   },
  { icon: "✨", label: "AI-preserved layout", badge: "var(--color-plum)"         },
] as const;

// ─── Confetti (deterministic) ─────────────────────────────────────────────────
const CONFETTI = Array.from({ length: 64 }, (_, i) => ({
  id: i,
  col: ["#E0A450","#7BA17C","#E2786C","#6B5B95","#F8D47A","#94C48A","#F4A6A0","#B5A0CC"][i % 8],
  left: (i * 1.5625) % 100,
  delay: (i * 0.028) % 1.4,
  size: 7 + (i % 5),
  rot: (i * 41) % 360,
  dur: 1.5 + (i % 4) * 0.28,
}));

// ─── Derive Lumi state from form ──────────────────────────────────────────────
function lumiReaction(
  name: string, email: string, pw: string,
  busy: boolean, done: boolean, err: string | null
): { state: LumiState; text: string } {
  if (done)              return { state: "celebrating", text: "Welcome to the bookshelf! 🎉 You're going to love it here." };
  if (busy)              return { state: "thinking",    text: "Building your library… almost there! 📖" };
  if (err)               return { state: "sad",         text: "Hmm, something went sideways. Let's try again?" };
  if (email && pw)       return { state: "excited",     text: "You're all set — just one tap away! ✨" };
  if (pw)                return { state: "happy",       text: "Strong password! I'm excited for you 💪" };
  if (email)             return { state: "happy",       text: "Almost there — now set a password!" };
  if (name)              return { state: "happy",       text: `Nice to meet you, ${name}! 📖 Let's set up your shelf.` };
  return                        { state: "waving",      text: "Hi! I'm Lumi. I'll guide you through every book you read." };
}

// ─── Root component ───────────────────────────────────────────────────────────
export function JoinClient() {
  const router = useRouter();
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [pw,    setPw]    = useState("");
  const [busy,  setBusy]  = useState(false);
  const [err,   setErr]   = useState<string | null>(null);
  const [done,  setDone]  = useState(false);

  const { state: lumiState, text: lumiText } = useMemo(
    () => lumiReaction(name, email, pw, busy, done, err),
    [name, email, pw, busy, done, err]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pw) return;
    setErr(null); setBusy(true);
    try {
      await register(email, pw, name || undefined);
      setDone(true);
      setTimeout(() => router.push("/library?welcome=1"), 2400);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

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
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          style={{ color: "var(--color-ink)" }}
        >
          <TranslifyIcon size={30} />
          <span className="font-[family-name:var(--font-display)] text-[1.1rem] font-semibold tracking-tight">
            Translify
          </span>
        </Link>
        <Link
          href="/login"
          className="rounded-full border-2 px-4 py-1.5 text-[0.82rem] font-bold transition-all hover:-translate-y-[2px]"
          style={{
            borderColor: "var(--color-border-strong)",
            background: "white",
            color: "var(--color-ink-soft)",
            boxShadow: "0 3px 0 rgba(74,60,30,0.12)",
          }}
        >
          Sign in
        </Link>
      </header>

      {/* Two-column layout */}
      <main className="relative z-20 mx-auto max-w-5xl px-4 pb-16 pt-2 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
          <LumiHero lumiState={lumiState} lumiText={lumiText} done={done} />
          <GameForm
            name={name} setName={setName}
            email={email} setEmail={setEmail}
            pw={pw} setPw={setPw}
            err={err} busy={busy} done={done}
            onSubmit={handleSubmit}
          />
        </div>
      </main>
    </div>
  );
}

// ─── Lumi hero ────────────────────────────────────────────────────────────────
function LumiHero({
  lumiState, lumiText, done,
}: {
  lumiState: LumiState;
  lumiText: string;
  done: boolean;
}) {
  // Fade out → swap text → fade in when text changes
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
      {/* Eyebrow pill */}
      <div
        className="flex items-center gap-2 rounded-full border-2 px-4 py-1.5"
        style={{
          borderColor: "var(--color-border)",
          background: "white",
          boxShadow: "0 3px 0 rgba(74,60,30,0.08)",
        }}
      >
        <span style={{ color: "var(--color-saffron-deep)" }}>✦</span>
        <span
          className="text-[0.72rem] font-bold uppercase tracking-[0.18em]"
          style={{ color: "var(--color-ink-soft)" }}
        >
          Your reading guide
        </span>
      </div>

      {/* Lumi + reactive speech bubble */}
      <div className="flex items-end gap-4">
        <div className="shrink-0">
          <Lumi state={lumiState} size={196} animate />
        </div>

        {/* Bubble */}
        <div
          className="relative mb-8 max-w-[210px] rounded-[1.3rem] rounded-bl-md border-2 p-4"
          style={{
            borderColor: "var(--color-border)",
            background: "white",
            boxShadow: "0 5px 0 rgba(74,60,30,0.10)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0) scale(1)" : "translateY(6px) scale(0.97)",
            transition: "opacity 0.22s cubic-bezier(0.34,1.56,0.64,1), transform 0.22s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          {/* Left-pointing tail */}
          <span
            aria-hidden
            className="absolute h-3 w-3 rotate-45 border-b-2 border-l-2"
            style={{
              left: -8, bottom: 26,
              borderColor: "var(--color-border)",
              background: "white",
            }}
          />
          <p
            className="font-[family-name:var(--font-display)] text-[0.9rem] leading-snug"
            style={{ color: "var(--color-ink)" }}
          >
            {displayed.current}
          </p>
        </div>
      </div>

      {/* Unlock list */}
      {!done && (
        <div className="w-full space-y-2.5 lg:max-w-sm">
          <p
            className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.2em]"
            style={{ color: "var(--color-ink-soft)" }}
          >
            You&apos;re unlocking
          </p>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="flex animate-float-in items-center gap-3 rounded-2xl border-2 px-4 py-3"
              style={{
                borderColor: "var(--color-border)",
                background: "white",
                boxShadow: "0 4px 0 rgba(74,60,30,0.09)",
                animationDelay: `${0.06 + i * 0.11}s`,
              }}
            >
              <span className="text-[1.25rem] leading-none">{f.icon}</span>
              <span
                className="font-[family-name:var(--font-display)] text-[0.94rem] font-semibold"
                style={{ color: "var(--color-ink)" }}
              >
                {f.label}
              </span>
              <span
                className="ml-auto grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.6rem] font-bold text-white"
                style={{ background: f.badge }}
              >
                ✓
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Game form ────────────────────────────────────────────────────────────────
function GameForm({
  name, setName, email, setEmail, pw, setPw,
  err, busy, done, onSubmit,
}: {
  name: string; setName: (s: string) => void;
  email: string; setEmail: (s: string) => void;
  pw: string;   setPw: (s: string) => void;
  err: string | null; busy: boolean; done: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const [pressed, setPressed] = useState(false);
  const ready = !!email && !!pw;

  if (done) {
    return (
      <div
        className="rounded-3xl border-2 p-10 text-center"
        style={{
          borderColor: "var(--color-border)",
          background: "white",
          boxShadow: "0 8px 0 rgba(74,60,30,0.12)",
        }}
      >
        <div
          className="mx-auto mb-5 grid h-20 w-20 animate-pop-in place-items-center rounded-full text-4xl"
          style={{ background: "rgba(224,164,80,0.15)" }}
        >
          🎉
        </div>
        <h2
          className="font-[family-name:var(--font-display)] text-[1.8rem] font-semibold leading-tight"
          style={{ color: "var(--color-ink)" }}
        >
          Your shelf is ready!
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--color-ink-soft)" }}>
          Taking you to your library…
        </p>
        <div className="mt-6 flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2.5 w-2.5 rounded-full"
              style={{
                background: "var(--color-saffron)",
                animation: `dot-bounce 0.9s ease-in-out ${i * 0.22}s infinite`,
              }}
            />
          ))}
        </div>
        <style>{`@keyframes dot-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-10px)}}`}</style>
      </div>
    );
  }

  return (
    <div
      className="rounded-3xl border-2 p-7 lg:p-8"
      style={{
        borderColor: "var(--color-border-strong)",
        background: "white",
        boxShadow: "0 8px 0 rgba(74,60,30,0.12)",
      }}
    >
      {/* Card header */}
      <div className="mb-6">
        <span
          className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.15em]"
          style={{
            background: "rgba(224,164,80,0.12)",
            color: "var(--color-saffron-deep)",
          }}
        >
          🆕 New reader
        </span>
        <h1
          className="font-[family-name:var(--font-display)] text-[1.9rem] font-semibold leading-[1.05] tracking-tight"
          style={{ color: "var(--color-ink)" }}
        >
          Start your<br />
          <em style={{ color: "var(--color-saffron-deep)", fontStyle: "italic" }}>reading adventure</em>
        </h1>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <GameField icon="👤" type="text"     placeholder="Your name (optional)"    value={name}  onChange={setName}  autoComplete="name" />
        <GameField icon="📧" type="email"    placeholder="Email address"           value={email} onChange={setEmail} autoComplete="email" required />
        <GameField icon="🔒" type="password" placeholder="Password (8+ characters)" value={pw}    onChange={setPw}   autoComplete="new-password" minLength={8} required />

        {err && (
          <div
            className="rounded-2xl border-2 px-4 py-3 text-[0.88rem] font-medium"
            style={{
              borderColor: "rgba(220,38,38,0.28)",
              background: "rgba(220,38,38,0.06)",
              color: "#B91C1C",
            }}
          >
            {err}
          </div>
        )}

        {/* Duolingo-style 3D press button */}
        <button
          type="submit"
          disabled={busy || !ready}
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
          onMouseLeave={() => setPressed(false)}
          onTouchStart={() => setPressed(true)}
          onTouchEnd={() => setPressed(false)}
          className="mt-1.5 h-14 w-full rounded-2xl font-[family-name:var(--font-display)] text-[1.05rem] font-bold transition-[transform,box-shadow] duration-75 disabled:cursor-not-allowed disabled:opacity-45"
          style={{
            background: ready && !busy
              ? "linear-gradient(to bottom, #EDB86A, #D09040)"
              : "rgba(74,60,30,0.10)",
            color: ready && !busy ? "white" : "rgba(74,60,30,0.3)",
            boxShadow:
              pressed || !ready || busy
                ? "none"
                : "0 6px 0 rgba(152,96,24,0.50)",
            transform:
              pressed && ready && !busy ? "translateY(6px)" : "translateY(0)",
          }}
        >
          {busy ? "Creating your shelf…" : "Start reading for free →"}
        </button>

        <p
          className="text-center text-[0.7rem]"
          style={{ color: "var(--color-ink-soft)" }}
        >
          No credit card · Cancel anytime · 30-day money-back
        </p>
      </form>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
        <span className="text-[0.72rem]" style={{ color: "var(--color-ink-soft)" }}>or</span>
        <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
      </div>

      <p className="text-center text-[0.84rem]" style={{ color: "var(--color-ink-soft)" }}>
        Already a reader?{" "}
        <Link
          href="/login"
          className="font-bold underline underline-offset-4"
          style={{ color: "var(--color-ink)", textDecorationColor: "var(--color-saffron)" }}
        >
          Log in
        </Link>
      </p>

      {/* Social proof */}
      <div
        className="mt-5 flex items-center justify-center gap-2 rounded-2xl px-4 py-3"
        style={{ background: "rgba(224,164,80,0.07)", border: "1.5px solid rgba(224,164,80,0.18)" }}
      >
        {/* Mini avatar stack */}
        <div className="flex -space-x-1.5">
          {["L","A","K","M"].map((ch, i) => (
            <span
              key={i}
              className="grid h-6 w-6 place-items-center rounded-full border-2 text-[0.6rem] font-bold text-white"
              style={{
                borderColor: "white",
                background: ["var(--color-saffron-deep)","var(--color-sage-deep)","var(--color-coral-deep)","var(--color-plum)"][i],
              }}
            >
              {ch}
            </span>
          ))}
        </div>
        <p className="text-[0.78rem]" style={{ color: "var(--color-ink-soft)" }}>
          <span className="font-bold" style={{ color: "var(--color-ink)" }}>42,000+</span>{" "}
          readers · 60+ countries
        </p>
      </div>
    </div>
  );
}

// ─── Styled game input ────────────────────────────────────────────────────────
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
        boxShadow: focused
          ? "0 0 0 4px rgba(224,164,80,0.14), 0 4px 0 rgba(74,60,30,0.07)"
          : "0 3px 0 rgba(74,60,30,0.08)",
        background: focused ? "var(--color-paper)" : "white",
      }}
    >
      <span className="shrink-0 text-[1.2rem] leading-none">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className="flex-1 bg-transparent py-3.5 text-[0.95rem] outline-none"
        style={{
          color: "var(--color-ink)",
          caretColor: "var(--color-saffron-deep)",
        }}
      />
      {value && (
        <span
          className="animate-pop-in grid h-5 w-5 shrink-0 place-items-center rounded-full text-[0.58rem] font-bold text-white"
          style={{ background: "var(--color-sage-deep)" }}
        >
          ✓
        </span>
      )}
    </div>
  );
}

// ─── Animated background ──────────────────────────────────────────────────────
function FloatingBg() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Coloured book silhouettes */}
      {BG_BOOKS.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-xl"
          style={{
            left: `${b.x}%`, top: `${b.y}%`,
            width: b.w, height: b.h,
            background: b.color,
            opacity: 0.10,
            boxShadow: "3px 4px 0 rgba(74,60,30,0.14)",
            animationName: "bg-bob",
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            animationDirection: "alternate",
          }}
        />
      ))}

      {/* Language characters */}
      {BG_CHARS.map((c, i) => (
        <span
          key={i}
          className="absolute select-none"
          style={{
            left: `${c.x}%`, top: `${c.y}%`,
            fontSize: c.sz,
            lineHeight: 1,
            fontFamily: "var(--font-display), serif",
            color: "rgba(74,60,30,0.055)",
            animationName: "bg-bob",
            animationDuration: "7.5s",
            animationDelay: `${c.delay}s`,
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            animationDirection: "alternate",
          }}
        >
          {c.ch}
        </span>
      ))}

      {/* Sparkle stars */}
      {BG_STARS.map((s, i) => (
        <span
          key={i}
          className="absolute select-none"
          style={{
            left: `${s.x}%`, top: `${s.y}%`,
            fontSize: 18,
            color: "var(--color-saffron)",
            opacity: 0.28,
            animationName: "sparkle",
            animationDuration: "3.8s",
            animationDelay: `${s.d}s`,
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
          }}
        >
          ✦
        </span>
      ))}

      <style>{`
        @keyframes bg-bob {
          from { transform: translateY(0px)   rotate(-1.5deg); }
          to   { transform: translateY(-20px) rotate( 1.5deg); }
        }
        @keyframes sparkle {
          0%,100% { opacity:0.12; transform:scale(0.75) rotate(  0deg); }
          50%     { opacity:0.50; transform:scale(1.45) rotate(200deg); }
        }
      `}</style>
    </div>
  );
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
function Confetti() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {CONFETTI.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.left}%`,
            top: "-12px",
            width: p.size,
            height: Math.round(p.size * 0.55),
            background: p.col,
            borderRadius: 2,
            transform: `rotate(${p.rot}deg)`,
            animationName: "confetti-fall",
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            animationTimingFunction: "ease-in",
            animationFillMode: "both",
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(0)      rotate(0deg);   opacity: 1; }
          100% { transform: translateY(105vh)  rotate(740deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
