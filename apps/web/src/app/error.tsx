"use client";

// Route-segment error boundary. Catches unexpected exceptions in any child
// route and renders a recoverable page with a "try again" reset.
//
// Lumi appears sad — a small acknowledgment that something went wrong without
// blaming the user. A subtle digest is shown so support can correlate logs.

import { useEffect } from "react";
import Link from "next/link";
import { Lumi } from "@/components/lumi/lumi";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Send to console so it lands in browser devtools / Sentry replay if wired.
    // eslint-disable-next-line no-console
    console.error("[translify] route error", error);
  }, [error]);

  return (
    <main className="relative grid min-h-screen place-items-center px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[color:var(--color-coral)]/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[color:var(--color-sage)]/12 blur-3xl"
      />

      <div className="relative max-w-lg text-center">
        <div className="mx-auto mb-2 inline-block">
          <Lumi state="sad" size={180} animate />
        </div>

        <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-[color:var(--color-coral-deep)]">
          Something hooted wrong
        </p>

        <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.8rem,4vw,2.6rem)] font-semibold leading-[1.05] tracking-tight">
          Lumi dropped a page.
        </h1>

        <p className="mx-auto mt-4 max-w-md text-[0.95rem] leading-relaxed text-[color:var(--color-ink-soft)]">
          An unexpected error stopped this page from loading. Most of the time
          this is a hiccup — try again and we'll pick up where we left off.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-[color:var(--color-saffron)] px-5 font-semibold text-[color:var(--color-accent-foreground)] shadow-[0_2px_0_rgba(140,90,30,0.5),0_10px_22px_-8px_rgba(200,137,62,0.6)] transition-transform hover:-translate-y-[2px]"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-full border-[1.5px] border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)]/60 px-5 font-semibold text-[color:var(--color-ink)] hover:bg-[color:var(--color-paper-2)]"
          >
            Back to home
          </Link>
        </div>

        {error.digest && (
          <p className="mt-8 font-mono text-[0.7rem] tabular-nums text-[color:var(--color-ink-soft)]/60">
            ref: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
