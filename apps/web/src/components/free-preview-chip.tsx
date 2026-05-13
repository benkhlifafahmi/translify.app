"use client";

/**
 * Tiny non-blocking chip that surfaces how many free pages a Free reader has
 * left on a seed book before the paywall modal fires. Renders as a small
 * floating pill at the bottom-left of the reader; sits *under* the reader
 * tutorial / email-gate / paywall so it never stacks visually.
 *
 * Visibility rules (all must be true):
 *   • user is on a seed book (`book.is_seed`)
 *   • their plan is page-capped (Free has cap=10, paid plans are UNLIMITED)
 *   • they're within ``threshold`` pages of the cap
 *   • the paywall hasn't already fired
 *
 * Once they hit the cap the PaywallModal takes over; the chip just gets
 * out of the way.
 */
interface Props {
  /** Current 1-indexed page reached. */
  page: number;
  /** Inclusive cap — paywall fires when ``page > cap``. */
  cap: number;
  /** Show only when remaining pages are ≤ this many. Default 3. */
  threshold?: number;
  /** Hide when the paywall is already showing. */
  hidden?: boolean;
}

export function FreePreviewChip({ page, cap, threshold = 3, hidden }: Props) {
  if (hidden) return null;
  if (!Number.isFinite(cap)) return null;
  const remaining = cap - page;
  if (remaining < 0) return null;       // already over — paywall handles it
  if (remaining > threshold) return null; // too early — no nag yet

  const urgent = remaining <= 1;
  const label =
    remaining === 0
      ? "Last free page"
      : remaining === 1
        ? "1 free page left"
        : `${remaining} free pages left`;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-3 left-3 z-40 animate-float-in sm:bottom-4 sm:left-4"
    >
      <div
        className="pointer-events-auto flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.78rem] font-semibold backdrop-blur-md"
        style={{
          background: urgent ? "rgba(197,89,77,0.95)" : "rgba(255,255,255,0.92)",
          color: urgent ? "white" : "var(--color-ink)",
          border: urgent
            ? "1.5px solid rgba(197,89,77,1)"
            : "1.5px solid var(--color-border-strong)",
          boxShadow: "0 4px 12px -4px rgba(20,16,8,0.30)",
        }}
        title="Upgrade to keep reading after the free preview"
      >
        <span
          aria-hidden
          className={urgent ? "" : "text-[color:var(--color-saffron-deep)]"}
        >
          ✦
        </span>
        {label}
      </div>
    </div>
  );
}
