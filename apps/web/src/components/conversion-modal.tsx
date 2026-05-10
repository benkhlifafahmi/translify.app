"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSubscription, type Subscription } from "@/lib/billing";
import { listBooks, type Book } from "@/lib/books";
import { getToken } from "@/lib/api";

const SHOWN_KEY = "translify_conversion_modal_shown_v1";

/**
 * One-shot upsell modal that fires the first time a Free user has at least
 * one ready book. The thinking: the user has just experienced the translation
 * working; that's the moment they're most likely to convert.
 *
 * Stored per-browser via localStorage so we don't pester repeatedly.
 */
export function ConversionModal() {
  const [open, setOpen] = useState(false);
  const enabled = typeof window !== "undefined" && !!getToken();

  const { data: sub } = useQuery<Subscription>({
    queryKey: ["subscription"],
    queryFn: getSubscription,
    enabled,
    staleTime: 60_000,
  });

  const { data: books } = useQuery<Book[]>({
    queryKey: ["books"],
    queryFn: listBooks,
    enabled,
    refetchInterval: 4000,
  });

  useEffect(() => {
    if (!sub || !books) return;
    if (sub.plan !== "free") return;
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(SHOWN_KEY) === "1") return;

    const hasReady = books.some((b) => b.status === "ready");
    if (hasReady) {
      setOpen(true);
      window.localStorage.setItem(SHOWN_KEY, "1");
    }
  }, [sub, books]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="conversion-modal-title"
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 animate-fade-in"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-[color:var(--color-ink)]/45 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-[1.6rem] border-[1.5px] border-[color:var(--color-border-strong)] bg-gradient-to-br from-[#FFFCF3] via-[#F8E9C5] to-[#EFD8A6] p-7 shadow-[var(--shadow-paper-lg)] animate-pop-in">
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full bg-white/60 text-[color:var(--color-ink-soft)] transition-colors hover:text-[color:var(--color-ink)]"
        >
          ×
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-coral)]/22 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[color:var(--color-coral-deep)]">
          ★ Your trial is live
        </span>
        <h2
          id="conversion-modal-title"
          className="mt-3 font-[family-name:var(--font-display)] text-[2rem] font-semibold leading-[1.05] tracking-tight text-[color:var(--color-ink)]"
        >
          That was the easy part.
        </h2>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-[color:var(--color-ink-soft)]">
          You just translated 2 pages. That's the demo. The whole point is to
          read <em>full books</em> — chat with them, quiz yourself on them,
          finish a syllabus a week. Pick a plan and we'll keep going.
        </p>
        <ul className="mt-5 space-y-2 text-[0.9rem] text-[color:var(--color-ink)]">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[color:var(--color-sage)]/25 text-[color:var(--color-sage-deep)]">
              ✓
            </span>
            <span>2,000 pages a month — about 8 novels or one fat textbook</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[color:var(--color-sage)]/25 text-[color:var(--color-sage-deep)]">
              ✓
            </span>
            <span>Chat with citations and quiz yourself on every book</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[color:var(--color-sage)]/25 text-[color:var(--color-sage-deep)]">
              ✓
            </span>
            <span>Cancel any time, refund within 30 days</span>
          </li>
        </ul>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link
            href="/account?upgrade=trial"
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[color:var(--color-ink)] px-6 font-semibold text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4),0_10px_22px_-8px_rgba(20,16,8,0.4)] transition-transform hover:-translate-y-[1px]"
            onClick={() => setOpen(false)}
          >
            Pick a plan — from €11/mo
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-[0.8rem] font-medium text-[color:var(--color-ink-soft)] underline decoration-dotted underline-offset-4 hover:text-[color:var(--color-ink)]"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
