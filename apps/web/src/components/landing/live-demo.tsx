"use client";

import { useEffect, useState } from "react";

type Phase = 0 | 1 | 2 | 3;
const PHASE_DURATION_MS = 6500;
const PHASE_S = PHASE_DURATION_MS / 1000;

const SCENES: { label: string; eyebrow: string; tone: "saffron" | "sage" | "coral" | "plum" }[] = [
  { label: "Drop your book", eyebrow: "Step 01", tone: "saffron" },
  { label: "Translate it", eyebrow: "Step 02", tone: "sage" },
  { label: "Chat with it", eyebrow: "Step 03", tone: "coral" },
  { label: "Quiz yourself", eyebrow: "Step 04", tone: "plum" },
];

export function LiveDemo() {
  const [phase, setPhase] = useState<Phase>(0);
  const [cycle, setCycle] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setPhase((p) => {
        const next = ((p + 1) % 4) as Phase;
        if (next === 0) setCycle((c) => c + 1);
        return next;
      });
    }, PHASE_DURATION_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const goTo = (p: Phase) => {
    setPhase(p);
    setCycle((c) => c + 1);
  };

  return (
    <section
      aria-label="Translify in action"
      className="relative z-10 mx-auto max-w-6xl px-8 pb-12 pt-16 lg:px-14 lg:pt-24"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mb-8 flex flex-col items-center text-center">
        <span className="badge-pill bg-[color:var(--color-paper-3)] text-[color:var(--color-ink-soft)]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--color-coral)]" />
          Watch it work · live demo
        </span>
        <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(1.7rem,3.5vw,2.6rem)] font-semibold leading-tight tracking-tight">
          A whole reading day, in <em className="text-[color:var(--color-saffron-deep)]">twenty-six seconds</em>.
        </h2>
      </div>

      {/* Filmstrip phase tracker */}
      <div className="mx-auto mb-6 flex max-w-3xl items-center gap-2 sm:gap-3">
        {SCENES.map((s, i) => {
          const active = i === phase;
          const passed = i < phase;
          const dotColor = {
            saffron: "bg-[color:var(--color-saffron)]",
            sage: "bg-[color:var(--color-sage)]",
            coral: "bg-[color:var(--color-coral)]",
            plum: "bg-[color:var(--color-plum)]",
          }[s.tone];
          return (
            <button
              key={s.label}
              onClick={() => goTo(i as Phase)}
              className={`group flex flex-1 flex-col items-start gap-1.5 rounded-lg border-[1.5px] px-3 py-2 text-left transition-all ${
                active
                  ? "border-[color:var(--color-ink)] bg-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.2)]"
                  : passed
                    ? "border-[color:var(--color-border)] bg-[color:var(--color-paper-2)]/60"
                    : "border-[color:var(--color-border)]/60 bg-transparent opacity-60 hover:opacity-100"
              }`}
              aria-current={active ? "step" : undefined}
            >
              <div className="flex w-full items-center gap-2">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? dotColor : "bg-[color:var(--color-border-strong)]"}`} />
                <span className={`text-[0.6rem] uppercase tracking-[0.18em] ${active ? "text-[color:var(--color-ink)]" : "text-[color:var(--color-ink-soft)]"}`}>
                  {s.eyebrow}
                </span>
              </div>
              <span className={`hidden text-[0.78rem] font-semibold sm:block ${active ? "text-[color:var(--color-ink)]" : "text-[color:var(--color-ink-soft)]"}`}>
                {s.label}
              </span>
              <span className="relative mt-1 block h-[3px] w-full overflow-hidden rounded-full bg-[color:var(--color-paper-3)]">
                {active ? (
                  <span
                    key={`bar-${cycle}-${phase}`}
                    className={`absolute inset-y-0 left-0 ${dotColor}`}
                    style={{
                      animation: `filmstrip-progress ${PHASE_DURATION_MS}ms linear both`,
                      animationPlayState: paused ? "paused" : "running",
                    }}
                  />
                ) : passed ? (
                  <span className={`absolute inset-y-0 left-0 right-0 ${dotColor} opacity-60`} />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stage */}
      <div className="relative mx-auto max-w-4xl">
        {/* Tape strips */}
        <span aria-hidden className="absolute -top-3 left-12 z-20 h-6 w-24 rounded-[2px] bg-[color:var(--color-saffron)]/55 shadow-[0_2px_4px_rgba(60,40,15,0.15)]" style={{ transform: "rotate(-8deg)" }} />
        <span aria-hidden className="absolute -top-3 right-16 z-20 h-6 w-20 rounded-[2px] bg-[color:var(--color-coral)]/55 shadow-[0_2px_4px_rgba(60,40,15,0.15)]" style={{ transform: "rotate(7deg)" }} />

        <div
          className="card-paper-lifted relative overflow-hidden p-5 sm:p-8"
          style={{
            background:
              "linear-gradient(180deg, #FFFCF3 0%, #FBF4E2 100%), radial-gradient(at 12% 8%, rgba(224,164,88,0.12), transparent 40%)",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(74,60,30,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(74,60,30,0.4) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div
            key={`stage-${cycle}-${phase}`}
            className="relative h-[360px] sm:h-[380px]"
            style={{ animation: "scene-in 0.45s cubic-bezier(0.34,1.56,0.64,1) both" }}
          >
            {phase === 0 && <UploadScene />}
            {phase === 1 && <TranslateScene />}
            {phase === 2 && <ChatScene />}
            {phase === 3 && <QuizScene />}
          </div>

          <div className="relative mt-4 flex items-center justify-between border-t border-dashed border-[color:var(--color-border)] pt-3 text-[0.72rem] text-[color:var(--color-ink-soft)]">
            <span className="flex items-center gap-2 font-[family-name:var(--font-display)] italic">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-coral)]" />
              {paused ? "paused — hover off to resume" : "auto-playing · hover to pause · tap a step to jump"}
            </span>
            <span className="font-mono text-[0.7rem]">
              {String(phase + 1).padStart(2, "0")} / 04
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Shared Cursor ───────────────────────── */

interface DemoCursorProps {
  /** name of the @keyframes path animation */
  pathName: string;
  /** times (in seconds) when a click happens, with optional caption */
  clicks: { at: number; caption?: string }[];
  /** total path duration (defaults to PHASE_S) */
  duration?: number;
}

function DemoCursor({ pathName, clicks, duration = PHASE_S }: DemoCursorProps) {
  const clickAnims = clicks
    .map((c) => `cursor-click 0.4s cubic-bezier(0.34,1.56,0.64,1) ${c.at}s both`)
    .join(", ");

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-40"
      style={{
        animation: `${pathName} ${duration}s cubic-bezier(0.55, 0, 0.45, 1) both`,
      }}
    >
      {/* Click ripples — one per click event, anchored at cursor tip */}
      {clicks.map((c, i) => (
        <span key={`r-${i}`} className="pointer-events-none absolute left-1 top-1">
          <span
            aria-hidden
            className="absolute h-9 w-9 rounded-full border-[2.5px] border-[color:var(--color-saffron)]"
            style={{
              animation: "click-ripple 0.7s ease-out both",
              animationDelay: `${c.at}s`,
            }}
          />
          <span
            aria-hidden
            className="absolute h-9 w-9 rounded-full border-[2px] border-[color:var(--color-coral)]"
            style={{
              animation: "click-ripple-outer 0.85s ease-out both",
              animationDelay: `${c.at + 0.05}s`,
            }}
          />
        </span>
      ))}

      {/* Arrow with click-squish animations */}
      <div
        className="relative origin-top-left"
        style={{
          animation: clickAnims || undefined,
        }}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          className="drop-shadow-[0_3px_6px_rgba(60,40,15,0.35)]"
        >
          {/* arrow body */}
          <path
            d="M5 3 L5 19 L9.5 14.5 L12.5 21.5 L15 20.5 L12 13.5 L18.5 13.5 Z"
            fill="var(--color-ink)"
            stroke="var(--color-paper)"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          {/* tiny saffron tip — like an inked nib */}
          <circle cx="5.5" cy="3.5" r="1.2" fill="var(--color-saffron)" stroke="var(--color-paper)" strokeWidth="0.6" />
        </svg>

        {/* Optional caption that follows */}
        {clicks.find((c) => c.caption) && (
          <span
            className="absolute left-7 top-3 whitespace-nowrap rounded-full bg-[color:var(--color-ink)] px-2 py-0.5 font-[family-name:var(--font-display)] text-[0.65rem] font-bold italic text-[color:var(--color-paper)] shadow-[0_4px_10px_-2px_rgba(20,16,8,0.4)]"
            style={{
              animation: clicks
                .filter((c) => c.caption)
                .map((c) => `scale-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) ${c.at}s both, fade-out 0.4s ease-in ${c.at + 0.9}s both`)
                .join(", "),
            }}
          >
            {clicks.find((c) => c.caption)?.caption}
          </span>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── Scene 01 — Upload ───────────────────────── */

function UploadScene() {
  return (
    <div className="grid h-full grid-cols-1 gap-4 sm:grid-cols-[1.1fr_1fr]">
      {/* Dropzone */}
      <div className="relative flex items-center justify-center rounded-2xl border-[2px] border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)]/60">
        <div
          className="demo-anim relative h-44 w-32 rotate-[-6deg] rounded-lg bg-gradient-to-br from-white to-[#F6EBD0] p-3 shadow-[0_18px_30px_-10px_rgba(60,40,15,0.4)]"
          style={{ animation: "drop-in 0.9s cubic-bezier(0.34,1.56,0.64,1) both", animationDelay: "1.7s" }}
        >
          <div className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-md bg-[color:var(--color-coral)]/90 text-[0.55rem] font-bold text-white">PDF</div>
          <div className="mt-7 space-y-1">
            <div className="h-1.5 w-12 rounded-full bg-[color:var(--color-ink)]/70" />
            <div className="h-1 w-16 rounded-full bg-[color:var(--color-ink-soft)]/40" />
            <div className="h-1 w-14 rounded-full bg-[color:var(--color-ink-soft)]/40" />
          </div>
          <div className="mt-3 space-y-0.5">
            {[80, 95, 70, 88, 60, 78, 92].map((w, i) => (
              <div key={i} className="h-[2px] rounded-full bg-[color:var(--color-ink)]/35" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>

        <div
          className="demo-anim absolute bottom-4 left-1/2 -translate-x-1/2 text-center"
          style={{ animation: "slide-up 0.5s ease-out both", animationDelay: "2.6s" }}
        >
          <p className="font-[family-name:var(--font-display)] text-sm italic text-[color:var(--color-ink-soft)]">…dropped.</p>
        </div>
      </div>

      {/* Right column */}
      <div className="flex flex-col gap-3">
        <div
          className="demo-anim flex items-center gap-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-3 shadow-sm"
          style={{ animation: "slide-right 0.5s ease-out both", animationDelay: "2.2s" }}
        >
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[color:var(--color-saffron)]/20 text-[color:var(--color-saffron-deep)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[color:var(--color-ink)]">les-misérables.pdf</p>
            <p className="text-[0.7rem] text-[color:var(--color-ink-soft)]">2.4 MB · 487 pages</p>
          </div>
        </div>

        <div
          className="demo-anim rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-3 shadow-sm"
          style={{ animation: "slide-right 0.5s ease-out both", animationDelay: "2.6s" }}
        >
          <div className="mb-2 flex items-center justify-between text-[0.7rem]">
            <span className="font-semibold text-[color:var(--color-ink-soft)]">Uploading</span>
            <span className="font-bold text-[color:var(--color-saffron-deep)]">100%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[color:var(--color-paper-3)]">
            <div
              className="demo-anim h-full bg-gradient-to-r from-[color:var(--color-saffron)] to-[color:var(--color-coral)]"
              style={{ animation: "fill-bar 2.2s cubic-bezier(0.4,0,0.2,1) both", animationDelay: "2.9s" }}
            />
          </div>
        </div>

        <div className="relative flex flex-1 items-center justify-center">
          <div
            className="demo-anim flex items-center gap-2 rounded-full border-[2.5px] border-[color:var(--color-sage-deep)] bg-[color:var(--color-paper)] px-5 py-2 shadow-[0_8px_18px_-6px_rgba(95,135,99,0.4)]"
            style={{ animation: "stamp 0.6s cubic-bezier(0.34,1.56,0.64,1) both", animationDelay: "5.2s", transform: "rotate(-6deg)" }}
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[color:var(--color-sage)] text-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            </span>
            <span className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-[0.15em] text-[color:var(--color-sage-deep)]">On the shelf</span>
          </div>
        </div>
      </div>

      {/* The cursor — clicks the dropzone */}
      <DemoCursor
        pathName="cursor-path-upload"
        clicks={[{ at: 1.45, caption: "click to upload" }]}
      />
    </div>
  );
}

/* ───────────────────────── Scene 02 — Translate ───────────────────────── */

const RIGHT_PAGE_TEXT = ["Chapitre Un — Origines", "Elle lisait depuis", "le début de la pluie."];
const LANGS = [
  { code: "FR", flag: "🇫🇷", name: "Français" },
  { code: "JA", flag: "🇯🇵", name: "日本語" },
  { code: "AR", flag: "🇸🇦", name: "العربية" },
  { code: "ZH", flag: "🇨🇳", name: "中文" },
];

function TranslateScene() {
  return (
    <div className="grid h-full grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
      {/* Book spread */}
      <div className="relative flex items-center justify-center">
        <div className="grid w-full grid-cols-2 gap-1 rounded-xl border border-[color:var(--color-border)] bg-white p-3 shadow-[0_18px_36px_-12px_rgba(60,40,15,0.3)]">
          {/* Left page (English) */}
          <div
            className="demo-anim border-r border-dashed border-[color:var(--color-border)] p-3"
            style={{ animation: "slide-right 0.6s ease-out both", animationDelay: "0.1s" }}
          >
            <span className="rounded-full bg-[color:var(--color-paper-3)] px-2 py-0.5 text-[0.55rem] font-bold tracking-[0.1em] text-[color:var(--color-ink-soft)]">EN</span>
            <p className="mt-3 font-[family-name:var(--font-display)] text-[0.85rem] font-semibold leading-tight text-[color:var(--color-ink)]">Chapter One — Origins</p>
            <div className="mt-2 space-y-1.5">
              <p className="text-[0.7rem] leading-snug text-[color:var(--color-ink-soft)]">She had been reading since the rain began.</p>
              <p className="text-[0.7rem] leading-snug text-[color:var(--color-ink-soft)]">The cat noticed first, then the lamp dimmed.</p>
            </div>
            <div className="mt-3 space-y-1">
              {[88, 76, 92, 68, 85].map((w, i) => (
                <div key={i} className="h-[2px] rounded-full bg-[color:var(--color-ink-soft)]/25" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>

          {/* Right page (translated, appears AFTER click on FR) */}
          <div className="relative p-3">
            <span
              className="demo-anim inline-block rounded-full bg-[color:var(--color-saffron)]/25 px-2 py-0.5 text-[0.55rem] font-bold tracking-[0.1em] text-[color:var(--color-saffron-deep)]"
              style={{ animation: "scale-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both", animationDelay: "1.7s" }}
            >
              FR
            </span>
            <div className="mt-3" dir="ltr">
              <p
                className="demo-anim font-[family-name:var(--font-display)] text-[0.85rem] font-semibold leading-tight text-[color:var(--color-ink)]"
                style={{ animation: "slide-up 0.5s ease-out both", animationDelay: "1.9s" }}
              >
                {RIGHT_PAGE_TEXT[0]}
              </p>
              <div className="mt-2 space-y-1.5">
                {RIGHT_PAGE_TEXT.slice(1).map((t, i) => (
                  <p
                    key={i}
                    className="demo-anim text-[0.72rem] leading-snug text-[color:var(--color-saffron-deep)]"
                    style={{ animation: "slide-up 0.5s ease-out both", animationDelay: `${2.1 + i * 0.15}s` }}
                  >
                    {t}
                  </p>
                ))}
              </div>
              <div className="mt-3 space-y-1">
                {[88, 76, 92, 68, 85].map((w, i) => (
                  <div
                    key={i}
                    className="demo-anim h-[2px] rounded-full bg-[color:var(--color-saffron-deep)]/30"
                    style={{
                      animation: "fill-bar 0.6s ease-out both",
                      animationDelay: `${2.4 + i * 0.08}s`,
                      maxWidth: `${w}%`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className="demo-anim absolute -right-2 -top-3 z-10"
          style={{ animation: "stamp 0.6s cubic-bezier(0.34,1.56,0.64,1) both", animationDelay: "5.0s" }}
        >
          <span className="inline-flex items-center gap-1 rounded-full border-[2px] border-[color:var(--color-sage-deep)] bg-[color:var(--color-paper)] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[color:var(--color-sage-deep)] shadow-md">
            ✓ Ready
          </span>
        </div>
      </div>

      {/* Right column — language list (cursor clicks Français) */}
      <div className="flex flex-col gap-2">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[color:var(--color-ink-soft)]">Languages</p>
        {LANGS.map((l, i) => {
          const isActive = i === 0;
          return (
            <div
              key={l.code}
              className={`demo-anim flex items-center gap-2.5 rounded-lg border ${isActive ? "border-[color:var(--color-saffron-deep)]" : "border-[color:var(--color-border)]"} bg-[color:var(--color-paper)] px-3 py-2 shadow-sm`}
              style={{
                animation: `slide-left 0.4s ease-out both${isActive ? ", input-glow 1.4s ease-in-out 1.2s both" : ""}`,
                animationDelay: `${0.2 + i * 0.1}s`,
              }}
            >
              <span className="text-base leading-none">{l.flag}</span>
              <span className="flex-1 truncate text-[0.8rem] font-semibold text-[color:var(--color-ink)]">{l.name}</span>
              {isActive ? (
                <span
                  className="demo-anim grid h-5 w-5 place-items-center rounded-full bg-[color:var(--color-sage)] text-white"
                  style={{ animation: "scale-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both", animationDelay: "1.55s" }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                </span>
              ) : (
                <span className="h-2 w-2 rounded-full bg-[color:var(--color-paper-3)]" />
              )}
            </div>
          );
        })}
        <p
          className="demo-anim mt-1 text-[0.65rem] italic text-[color:var(--color-ink-soft)]"
          style={{ animation: "slide-up 0.5s ease-out both", animationDelay: "3.5s" }}
        >
          Layout preserved · 14 scripts supported
        </p>
      </div>

      {/* Cursor — clicks Français */}
      <DemoCursor
        pathName="cursor-path-translate"
        clicks={[{ at: 1.4, caption: "Français" }]}
      />
    </div>
  );
}

/* ───────────────────────── Scene 03 — Chat ───────────────────────── */

const QUESTION = "Why does Jean Valjean steal bread?";

function ChatScene() {
  return (
    <div className="relative flex h-full flex-col gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-paper)]/80 p-4">
      <div className="flex items-center gap-2 border-b border-dashed border-[color:var(--color-border)] pb-2">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[color:var(--color-coral)]/15 text-[color:var(--color-coral-deep)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </span>
        <span className="font-[family-name:var(--font-display)] text-[0.85rem] font-semibold text-[color:var(--color-ink)]">chat with Les Misérables</span>
        <span className="ml-auto rounded-full bg-[color:var(--color-sage)]/20 px-2 py-0.5 text-[0.6rem] font-bold text-[color:var(--color-sage-deep)]">487 pages indexed</span>
      </div>

      {/* Chat history — empty until question is "sent" at 2.8s */}
      <div className="flex-1 space-y-3 overflow-hidden">
        {/* Question bubble — appears AFTER cursor clicks send */}
        <div
          className="demo-anim ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-[color:var(--color-ink)] px-3.5 py-2 text-[0.8rem] text-[color:var(--color-paper)] shadow-md"
          style={{ animation: "scale-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both", animationDelay: "2.85s" }}
        >
          {QUESTION}
        </div>

        {/* Thinking dots */}
        <div
          className="demo-anim flex items-center gap-1 px-2 text-[0.7rem] text-[color:var(--color-ink-soft)]"
          style={{ animation: "slide-right 0.4s ease-out both, fade-out 0.4s ease-in 4.4s forwards", animationDelay: "3.1s" }}
        >
          <span className="h-2 w-2 rounded-full bg-[color:var(--color-saffron)]" style={{ animation: "thinking-bounce 1s ease-in-out infinite" }} />
          <span className="h-2 w-2 rounded-full bg-[color:var(--color-saffron)]" style={{ animation: "thinking-bounce 1s ease-in-out infinite", animationDelay: "0.15s" }} />
          <span className="h-2 w-2 rounded-full bg-[color:var(--color-saffron)]" style={{ animation: "thinking-bounce 1s ease-in-out infinite", animationDelay: "0.3s" }} />
          <span className="ml-2 italic">flipping through pages…</span>
        </div>

        {/* Answer bubble */}
        <div
          className="demo-anim w-fit max-w-[92%] space-y-2 rounded-2xl rounded-bl-sm bg-[color:var(--color-paper-2)] px-4 py-3 text-[0.82rem] leading-relaxed text-[color:var(--color-ink)] shadow-sm"
          style={{ animation: "slide-right 0.5s ease-out both", animationDelay: "4.4s" }}
        >
          <p>To feed his sister&apos;s seven children — they were starving, and the bakery was closed. He spent nineteen years in the galleys for it.</p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { p: "23", delay: 5.0 },
              { p: "47", delay: 5.15 },
              { p: "112", delay: 5.3 },
            ].map((c) => (
              <span
                key={c.p}
                className="demo-anim inline-flex items-center gap-1 rounded-full bg-[color:var(--color-saffron)]/25 px-2 py-0.5 text-[0.65rem] font-bold text-[color:var(--color-saffron-deep)]"
                style={{ animation: "scale-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both", animationDelay: `${c.delay}s` }}
              >
                <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-[color:var(--color-saffron-deep)] text-[0.55rem] text-white">·</span>
                p. {c.p}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Input bar with typewriter — animates AS CURSOR CLICKS IT */}
      <div
        className="relative mt-1 flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-white/80 px-3 py-2"
        style={{
          animation: "input-glow 1.6s ease-in-out 0.85s both",
        }}
      >
        {/* Typewriter content & placeholder */}
        <div className="relative flex-1 overflow-hidden">
          {/* Placeholder — visible only before cursor clicks */}
          <span
            className="demo-anim block whitespace-nowrap text-[0.78rem] italic text-[color:var(--color-ink-soft)]"
            style={{ animation: "fade-out 0.25s ease-in 0.95s forwards" }}
          >
            Ask another question…
          </span>
          {/* Typed text — types after click */}
          <span
            className="demo-typewriter absolute inset-y-0 left-0 flex items-center text-[0.78rem] font-semibold text-[color:var(--color-ink)]"
            style={{
              ["--type-dur" as string]: "1.4s",
              ["--type-delay" as string]: "1.05s",
              ["--type-steps" as string]: `${QUESTION.length}`,
              animation: `typewriter 1.4s steps(${QUESTION.length}) 1.05s both, blink-caret 0.7s step-end 1.05s 5, fade-out 0.3s ease-in 2.85s forwards`,
              borderRightColor: "var(--color-saffron-deep)",
            }}
          >
            {QUESTION}
          </span>
        </div>

        {/* Send button */}
        <span
          className="ml-auto grid h-7 w-7 place-items-center rounded-full bg-[color:var(--color-saffron)] text-[color:var(--color-accent-foreground)] shadow-[0_2px_0_rgba(140,90,30,0.4)]"
          style={{
            animation: "scale-pop 0.3s cubic-bezier(0.34,1.56,0.64,1) 2.7s both",
            transformOrigin: "center",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>
        </span>
      </div>

      {/* Cursor — clicks input, types, clicks send */}
      <DemoCursor
        pathName="cursor-path-chat"
        clicks={[
          { at: 0.95, caption: "click to type" },
          { at: 2.7, caption: "send" },
        ]}
      />
    </div>
  );
}

/* ───────────────────────── Scene 04 — Quiz ───────────────────────── */

function QuizScene() {
  return (
    <div className="relative flex h-full flex-col gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-4">
      <div className="flex items-center justify-between">
        <span
          className="demo-anim badge-pill bg-[color:var(--color-coral)]/20 text-[color:var(--color-coral-deep)]"
          style={{ animation: "slide-right 0.4s ease-out both", animationDelay: "0.1s" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-coral)]" />
          Question 4 / 8
        </span>
        <span
          className="demo-anim text-[0.7rem] font-semibold text-[color:var(--color-ink-soft)]"
          style={{ animation: "slide-left 0.4s ease-out both", animationDelay: "0.2s" }}
        >
          ⏱ 0:42
        </span>
      </div>

      <div
        className="demo-anim h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--color-paper-3)]"
        style={{ animation: "slide-up 0.4s ease-out both", animationDelay: "0.3s" }}
      >
        <div
          className="demo-anim h-full bg-gradient-to-r from-[color:var(--color-coral)] to-[color:var(--color-saffron)]"
          style={{ animation: "fill-bar 1s cubic-bezier(0.4,0,0.2,1) both", animationDelay: "0.5s", maxWidth: "50%" }}
        />
      </div>

      <p
        className="demo-anim mt-1 font-[family-name:var(--font-display)] text-[1rem] font-semibold leading-snug text-[color:var(--color-ink)]"
        style={{ animation: "slide-up 0.5s ease-out both", animationDelay: "0.5s" }}
      >
        Why does Cosette&apos;s mother send her to live with the Thénardiers?
      </p>

      <div className="relative space-y-1.5">
        {[
          { l: "A", t: "She wants to remarry without a child", correct: false },
          { l: "B", t: "She believes they will care for her well", correct: true },
          { l: "C", t: "She is too sick to keep her", correct: false },
          { l: "D", t: "She is being arrested", correct: false },
        ].map((c, i) => {
          const inAt = 0.8 + i * 0.12;
          // Option B (the correct one) flips to "selected" appearance after click at 1.95s
          const selectedAnim = c.correct
            ? `, input-glow 1.4s ease-in-out 1.85s both`
            : "";
          return (
            <div
              key={c.l}
              className="demo-anim relative flex items-center gap-3 rounded-xl border-[1.5px] border-[color:var(--color-border)] bg-[color:var(--color-paper)] px-3 py-2 transition-colors"
              style={{
                animation: `slide-right 0.4s ease-out ${inAt}s both${selectedAnim}`,
                ...(c.correct
                  ? {
                      // After click, swap colors via animation-delay in inline style + class swap below
                    }
                  : {}),
              }}
            >
              <span
                className="grid h-7 w-7 place-items-center rounded-full bg-[color:var(--color-paper-3)] font-[family-name:var(--font-display)] text-[0.75rem] font-bold text-[color:var(--color-ink-soft)]"
                style={
                  c.correct
                    ? {
                        animation: "scale-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) 2.1s both",
                      }
                    : undefined
                }
              >
                {c.l}
              </span>
              <span className="text-[0.82rem] text-[color:var(--color-ink)]">{c.t}</span>
              {c.correct && (
                <>
                  {/* Sage tint that fades in after click */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-xl border-[1.5px] border-[color:var(--color-sage-deep)] bg-[color:var(--color-sage)]/15 opacity-0"
                    style={{
                      animation: "scale-pop 0.4s ease-out 2.05s both",
                    }}
                  />
                  <span
                    className="demo-anim relative ml-auto grid h-5 w-5 place-items-center rounded-full bg-[color:var(--color-sage)] text-white"
                    style={{ animation: "scale-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) 2.2s both" }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="relative mt-auto flex items-center justify-between gap-3">
        <span
          className="demo-anim font-[family-name:var(--font-display)] text-[0.85rem] italic text-[color:var(--color-sage-deep)]"
          style={{ animation: "slide-up 0.5s ease-out both", animationDelay: "2.6s" }}
        >
          Cited from p.{" "}
          <span className="rounded-full bg-[color:var(--color-saffron)]/30 px-1.5 py-0.5 text-[0.65rem] font-bold text-[color:var(--color-saffron-deep)]">142</span>
        </span>
        <div
          className="demo-anim relative inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-saffron)] px-4 py-1.5 text-[0.78rem] font-bold uppercase tracking-[0.12em] text-[color:var(--color-accent-foreground)] shadow-[0_8px_18px_-6px_rgba(200,137,62,0.55)]"
          style={{ animation: "badge-slam 0.7s cubic-bezier(0.34,1.56,0.64,1) both", animationDelay: "2.9s" }}
        >
          ★ +25 XP
          <Confetti />
        </div>
      </div>

      <span
        className="demo-anim absolute -right-2 -top-3 inline-flex items-center gap-1 rounded-full bg-[color:var(--color-coral)] px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-white shadow-[0_12px_22px_-8px_rgba(197,89,77,0.55)]"
        style={{ animation: "badge-slam 0.7s cubic-bezier(0.34,1.56,0.64,1) both", animationDelay: "3.5s" }}
      >
        ★ 8 / 10 — nice!
      </span>

      {/* Cursor — clicks option B */}
      <DemoCursor
        pathName="cursor-path-quiz"
        clicks={[{ at: 1.95, caption: "tap answer" }]}
      />
    </div>
  );
}

function Confetti() {
  const pieces = [
    { x: -40, y: -40, r: 220, c: "var(--color-saffron)", d: 3.0 },
    { x: 40, y: -50, r: 320, c: "var(--color-coral)", d: 3.05 },
    { x: -55, y: 10, r: 80, c: "var(--color-sage)", d: 3.1 },
    { x: 55, y: 5, r: 280, c: "var(--color-plum)", d: 3.0 },
    { x: 0, y: -60, r: 0, c: "var(--color-saffron-deep)", d: 2.95 },
    { x: -25, y: -50, r: 160, c: "var(--color-coral-deep)", d: 3.1 },
  ];
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 h-1.5 w-2 rounded-sm"
          style={{
            background: `var(${p.c.startsWith("var") ? p.c.slice(4, -1) : p.c})`,
            ["--cfx" as string]: `${p.x}px`,
            ["--cfy" as string]: `${p.y}px`,
            ["--cfr" as string]: `${p.r}deg`,
            animation: `confetti-fly 1.2s ease-out both`,
            animationDelay: `${p.d}s`,
          }}
        />
      ))}
    </span>
  );
}
