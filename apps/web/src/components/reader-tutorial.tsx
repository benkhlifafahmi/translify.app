"use client";

import { useEffect, useState } from "react";
import { Lumi } from "@/components/lumi/lumi";

/**
 * In-reader tutorial — contextual coach-marks with a *visible* spotlight
 * for the element the tip is talking about.
 *
 * Each step has a `spotlight` mode:
 *   - "page-edges"  → pulsing arrows on the left + right page edges
 *   - "canvas-text" → an animated "select me" hand swiping the canvas
 *   - { anchor }    → pulses a real DOM element via querySelector
 *
 * The tip card itself stays bottom-anchored on every step so the spotlight
 * always sits in the visual centre while the explanation reads at the
 * bottom. State is persisted per-step in localStorage; "Skip tour"
 * suppresses every remaining tip.
 */

type StepId = "tap-to-turn" | "select-to-act" | "open-chat" | "open-quiz";

type Spotlight =
  | { kind: "canvas-text" }
  /** Pulse one or more DOM elements via querySelector. Multiple selectors
   *  fire in parallel — useful for "the prev *and* next arrow" type tips. */
  | { kind: "anchor"; selectors: string[] };

interface Step {
  id: StepId;
  showAtPage: number;
  eyebrow: string;
  body: string;
  cta: string;
  lumi?: "waving" | "happy" | "excited" | "thinking" | "reading";
  pointer?: string;
  spotlight: Spotlight;
}

const STEPS: Step[] = [
  {
    id: "tap-to-turn",
    showAtPage: 1,
    eyebrow: "How to read",
    body: "Tap the arrows in the top bar to flip forward and back. On a computer you can also tap the left or right edge of the page.",
    cta: "Got it",
    lumi: "waving",
    pointer: "⟵ ⟶ The two glowing arrows",
    spotlight: {
      kind: "anchor",
      selectors: ['[data-tutorial-anchor="topbar-prev"]', '[data-tutorial-anchor="topbar-next"]'],
    },
  },
  {
    id: "select-to-act",
    showAtPage: 2,
    eyebrow: "Try this",
    body: "Long-press any sentence — a toolbar pops up to highlight, take a note, or ask AI to explain.",
    cta: "Nice",
    lumi: "happy",
    pointer: "✎ Press and hold a word, then drag",
    spotlight: { kind: "canvas-text" },
  },
  {
    id: "open-chat",
    showAtPage: 4,
    eyebrow: "Chat with the book",
    body: "Open Chat to ask anything — Lumi answers with cited passages from this book.",
    cta: "Got it",
    lumi: "thinking",
    pointer: "💬 The glowing tab",
    spotlight: { kind: "anchor", selectors: ['[data-tutorial-anchor="chat-tab"]'] },
  },
  {
    id: "open-quiz",
    showAtPage: 6,
    eyebrow: "Make it stick",
    body: "Generate a quick Quiz to test what you've read.",
    cta: "Cool",
    lumi: "excited",
    pointer: "★ The glowing tab",
    spotlight: { kind: "anchor", selectors: ['[data-tutorial-anchor="quiz-tab"]'] },
  },
];

const SKIP_KEY = "translify.tutorial.skipped";
const SEEN_KEY = (id: StepId) => `translify.tutorial.seen.${id}`;

interface Props {
  /** Current 1-indexed page the reader has reached. */
  page: number;
  /** Suppress the tutorial entirely (used when the paywall or email-gate
   *  modal is open so we don't stack popovers). */
  disabled?: boolean;
}

export function ReaderTutorial({ page, disabled }: Props) {
  const [activeStep, setActiveStep] = useState<Step | null>(null);
  const [skipped, setSkipped] = useState(false);

  // Hydrate the skipped flag from localStorage on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(SKIP_KEY) === "1") setSkipped(true);
    } catch { /* ignore */ }
  }, []);

  // Pick the next eligible step every time the page changes.
  useEffect(() => {
    if (skipped || disabled) { setActiveStep(null); return; }
    if (typeof window === "undefined") return;
    if (activeStep !== null) return; // don't replace an open tip

    let storage: Storage | null = null;
    try { storage = window.localStorage; } catch { /* ignore */ }

    for (const step of STEPS) {
      if (page < step.showAtPage) continue;
      const seen = storage?.getItem(SEEN_KEY(step.id)) === "1";
      if (seen) continue;
      // Defer ~600ms so the tip doesn't slam in over the page-turn anim.
      const timeout = window.setTimeout(() => setActiveStep(step), 600);
      return () => window.clearTimeout(timeout);
    }
  }, [page, skipped, disabled, activeStep]);

  // For "anchor" spotlights, find each target DOM node and toggle a data
  // attribute on it that CSS uses to drive a pulse. Multiple selectors
  // are pulsed in parallel (e.g. step 1 spotlights both top-bar arrows).
  // Cleanup removes the attribute when the tip dismisses, when the anchor
  // changes, or when the component unmounts.
  useEffect(() => {
    if (!activeStep || activeStep.spotlight.kind !== "anchor") return;
    if (typeof document === "undefined") return;
    const found: HTMLElement[] = [];
    for (const selector of activeStep.spotlight.selectors) {
      const el = document.querySelector<HTMLElement>(selector);
      if (el) {
        el.setAttribute("data-tutorial-spotlight", "");
        found.push(el);
      }
    }
    return () => {
      for (const el of found) el.removeAttribute("data-tutorial-spotlight");
    };
  }, [activeStep]);

  if (!activeStep || skipped || disabled) return null;

  const markSeen = (id: StepId) => {
    try { window.localStorage.setItem(SEEN_KEY(id), "1"); } catch { /* ignore */ }
  };

  const onDismiss = () => {
    markSeen(activeStep.id);
    setActiveStep(null);
  };

  const onSkipAll = () => {
    try { window.localStorage.setItem(SKIP_KEY, "1"); } catch { /* ignore */ }
    for (const s of STEPS) markSeen(s.id);
    setSkipped(true);
    setActiveStep(null);
  };

  return (
    <>
      {/* Spotlight layer — sits behind the tip card so the user looks at
          the highlighted element first. Click-through (pointer-events:
          none on the wrapper) so the user can still hit the underlying
          control while the spotlight is up. */}
      <SpotlightLayer kind={activeStep.spotlight.kind} />

      {/* The tip card */}
      <div
        role="dialog"
        aria-modal="false"
        aria-label={activeStep.eyebrow}
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:px-6"
      >
        <div
          className="pointer-events-auto w-full max-w-md animate-float-in overflow-hidden rounded-2xl"
          style={{
            background: "white",
            border: "2px solid var(--color-border-strong)",
            boxShadow: "0 16px 40px -12px rgba(20,16,8,0.35), 0 6px 0 rgba(74,60,30,0.10)",
          }}
        >
          <div
            className="h-1"
            style={{ background: "linear-gradient(90deg,#EDB86A,#D09040)" }}
          />
          <div className="flex items-start gap-3 px-4 py-3.5">
            <div className="shrink-0">
              <Lumi state={activeStep.lumi ?? "happy"} size={48} animate />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-[0.66rem] font-bold uppercase tracking-[0.18em]"
                style={{ color: "var(--color-saffron-deep)" }}
              >
                {activeStep.eyebrow}
              </p>
              <p
                className="mt-0.5 text-[0.92rem] leading-snug"
                style={{ color: "var(--color-ink)" }}
              >
                {activeStep.body}
              </p>
              {activeStep.pointer && (
                <p
                  className="mt-1.5 text-[0.74rem] font-medium"
                  style={{ color: "var(--color-ink-soft)" }}
                >
                  {activeStep.pointer}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onDismiss}
              aria-label={activeStep.cta}
              className="ms-1 grid h-9 shrink-0 place-items-center self-center rounded-xl px-3.5 font-[family-name:var(--font-display)] text-[0.84rem] font-bold text-white transition-all active:translate-y-1"
              style={{
                background: "linear-gradient(to bottom,#EDB86A,#D09040)",
                boxShadow: "0 3px 0 rgba(152,96,24,0.50)",
              }}
            >
              {activeStep.cta}
            </button>
          </div>
          <button
            type="button"
            onClick={onSkipAll}
            className="block w-full border-t border-dashed py-2 text-[0.74rem] font-semibold transition-colors hover:bg-[color:var(--color-paper-3)]"
            style={{ borderColor: "var(--color-border)", color: "var(--color-ink-soft)" }}
          >
            Skip tour
          </button>
        </div>
      </div>

      {/* Spotlight CSS. Kept inline (next to the component) rather than
          globals so adding/removing a step doesn't leave dead styles in
          the global sheet. */}
      <style jsx global>{`
        /* Pulsing ring for any element flagged via querySelector. The
           data-attribute is set/cleared by the effect above. */
        [data-tutorial-spotlight] {
          position: relative;
          z-index: 51;
          animation: tutorial-pulse-ring 1.6s ease-in-out infinite;
          border-radius: 12px;
        }
        @keyframes tutorial-pulse-ring {
          0%, 100% {
            box-shadow:
              0 0 0 0 rgba(208, 144, 64, 0.55),
              0 0 0 4px rgba(208, 144, 64, 0.10);
          }
          50% {
            box-shadow:
              0 0 0 8px rgba(208, 144, 64, 0.00),
              0 0 0 12px rgba(208, 144, 64, 0.18);
          }
        }
        @keyframes tutorial-finger-swipe {
          0%   { transform: translate(-50%, -50%) translateX(-40%); opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translate(-50%, -50%) translateX(40%);  opacity: 0; }
        }
        @keyframes tutorial-underline-grow {
          0%   { transform: scaleX(0); opacity: 0; }
          15%  { opacity: 1; }
          100% { transform: scaleX(1); opacity: 0.85; }
        }
      `}</style>
    </>
  );
}

function SpotlightLayer({ kind }: { kind: Spotlight["kind"] }) {
  if (kind === "anchor") {
    // The pulse is rendered on the actual element via the data-attribute
    // effect — nothing extra to draw here.
    return null;
  }

  if (kind === "canvas-text") {
    // Animated finger swiping across the centre of the canvas + a
    // growing underline. Together they read as "press and hold here, drag
    // across to select." Click-through (pointer-events: none) so the user
    // can actually do the gesture while the demo plays.
    return (
      <div className="pointer-events-none fixed inset-0 z-40 grid place-items-center">
        <div
          aria-hidden
          className="relative"
          style={{ width: "min(72vw, 320px)", height: "44px" }}
        >
          {/* Underline that grows L→R, mimicking a drag-select */}
          <span
            className="absolute bottom-0 left-0 right-0 block h-1 origin-left rounded-full"
            style={{
              background: "rgba(208, 144, 64, 0.55)",
              boxShadow: "0 0 0 2px rgba(208,144,64,0.18)",
              animation: "tutorial-underline-grow 1.6s ease-out infinite",
            }}
          />
          {/* Finger emoji that swipes across */}
          <span
            className="absolute top-1/2 left-1/2 text-3xl"
            style={{
              animation: "tutorial-finger-swipe 1.6s ease-out infinite",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.18))",
            }}
          >
            👆
          </span>
        </div>
      </div>
    );
  }

  return null;
}
