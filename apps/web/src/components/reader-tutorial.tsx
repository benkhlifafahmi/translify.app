"use client";

import { useEffect, useState } from "react";
import { Lumi } from "@/components/lumi/lumi";

/**
 * In-reader tutorial — contextual coach-marks that unfold as the user reads.
 *
 * The tips fire one at a time, gated on what the user has actually done so
 * it never feels like a wall of upfront tooltips. Sequence:
 *
 *   1. on first open                → "Tap the right edge to flip, left to go back"
 *   2. after the first page turn    → "Select any sentence to highlight, note, or ask AI"
 *   3. after two more page turns    → "Open Chat to ask the book a question"
 *   4. after another two            → "Generate a Quiz to test what you've read"
 *
 * Each tip persists a "seen" flag in localStorage so reopens don't re-fire.
 * "Skip tour" suppresses every subsequent tip.
 */

type StepId = "tap-to-turn" | "select-to-act" | "open-chat" | "open-quiz";

interface Step {
  id: StepId;
  /** Page at or above which the tip becomes eligible to show. */
  showAtPage: number;
  /** Top-line — small caps eyebrow. */
  eyebrow: string;
  /** Body copy — keep under ~140 chars for the mobile sheet. */
  body: string;
  /** CTA button text. */
  cta: string;
  /** Optional Lumi mood. */
  lumi?: "waving" | "happy" | "excited" | "thinking" | "reading";
  /** Small chip indicating where the feature lives — drops a hint without
   *  needing an arrow / spotlight on a moving target. */
  pointer?: string;
}

const STEPS: Step[] = [
  {
    id: "tap-to-turn",
    showAtPage: 1,
    eyebrow: "How to read",
    body: "Tap the right edge of the page to flip forward. Tap the left edge to go back. Keyboard arrows work too.",
    cta: "Got it",
    lumi: "waving",
    pointer: "👉 Right edge → next   ·   👈 Left edge → back",
  },
  {
    id: "select-to-act",
    showAtPage: 2,
    eyebrow: "Try this",
    body: "Select any sentence to highlight it, take a note, or ask the AI to explain.",
    cta: "Nice",
    lumi: "happy",
    pointer: "✎ A toolbar pops up over your selection",
  },
  {
    id: "open-chat",
    showAtPage: 4,
    eyebrow: "Chat with the book",
    body: "Open the Chat tab to ask anything — Lumi answers with cited passages.",
    cta: "Got it",
    lumi: "thinking",
    pointer: "💬 Chat tab — top of the right pane",
  },
  {
    id: "open-quiz",
    showAtPage: 6,
    eyebrow: "Make it stick",
    body: "Generate a quick Quiz to test what you've read — it remembers what stuck and what didn't.",
    cta: "Cool",
    lumi: "excited",
    pointer: "🎯 Quiz tab — next to Chat",
  },
];

const SKIP_KEY = "translify.tutorial.skipped";
const SEEN_KEY = (id: StepId) => `translify.tutorial.seen.${id}`;

interface Props {
  /** Current 1-indexed page the reader has reached. */
  page: number;
  /** Suppress the tutorial entirely (used when the paywall modal is open
   *  so we don't stack popovers). */
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
    // Also stamp all remaining steps so a future "reset skip" doesn't
    // re-fire ones the user already saw.
    for (const s of STEPS) markSeen(s.id);
    setSkipped(true);
    setActiveStep(null);
  };

  return (
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
  );
}
