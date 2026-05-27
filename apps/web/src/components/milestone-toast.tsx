"use client";

/**
 * Surfaces pending milestones to the user one at a time and offers a
 * one-tap "Share?" action. Dismissed milestones are deleted server-side
 * (they were earned, they're just not interesting enough to share). Shared
 * milestones disappear from the queue once their Post is created.
 *
 * Mount once on any logged-in page where the user lands after an event
 * that might have produced a milestone. /library is the canonical place;
 * if the toast finds nothing pending it renders null and costs ~one API
 * call's worth of bandwidth.
 *
 * No global notification system needed: a single fetch on mount is
 * deliberate. Users who close the toast and reopen the page see the same
 * queue, which is the right behavior for important achievements.
 */
import { useEffect, useState } from "react";
import { ApiError, getToken } from "@/lib/api";
import {
  dismissMilestone,
  listPendingMilestones,
  shareMilestone,
  type Milestone,
} from "@/lib/social";

const KIND_META: Record<
  string,
  { label: string; icon: string; valueKey?: string }
> = {
  first_book_finished: { label: "First book finished", icon: "📖" },
  book_finished: { label: "Book finished", icon: "📖" },
  streak_7: { label: "7-day reading streak", icon: "🔥", valueKey: "days" },
  streak_30: { label: "30-day reading streak", icon: "🔥", valueKey: "days" },
  streak_100: { label: "100-day reading streak", icon: "🔥", valueKey: "days" },
  words_100: { label: "100 words translated", icon: "✦", valueKey: "count" },
  words_500: { label: "500 words translated", icon: "✦", valueKey: "count" },
  words_1000: { label: "1000 words translated", icon: "✦", valueKey: "count" },
  quiz_perfect: { label: "Perfect quiz score", icon: "★" },
  garden_bloom: { label: "Garden bloomed", icon: "❀" },
};

export function MilestoneToast() {
  const [pending, setPending] = useState<Milestone[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Anonymous accounts have no milestones to fetch.
    if (!getToken()) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await listPendingMilestones();
        if (!cancelled) setPending(list);
      } catch {
        // Silent: a failed milestone fetch is not worth surfacing.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const current = pending[0];

  if (!current) return null;

  const meta = KIND_META[current.kind] ?? {
    label: "Milestone",
    icon: "✦",
  };
  const value =
    meta.valueKey && typeof current.context[meta.valueKey] === "number"
      ? (current.context[meta.valueKey] as number)
      : null;
  const bookTitle =
    typeof current.context.book_title === "string"
      ? (current.context.book_title as string)
      : null;
  const labelLine = bookTitle ? `${meta.label}: ${bookTitle}` : meta.label;

  const advance = () => {
    setPending((q) => q.slice(1));
    setNote("");
    setError(null);
  };

  const onShare = async () => {
    setBusy(true);
    setError(null);
    try {
      await shareMilestone(current.id, { note: note.trim() || null });
      advance();
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        // Anonymous user. Bounce to onboarding.
        window.location.href = "/onboarding";
        return;
      }
      setError("Couldn't share that. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  const onDismiss = async () => {
    // Optimistic: pop locally first, then call the server. Either way the
    // user moves on; a network failure here doesn't matter.
    advance();
    try {
      await dismissMilestone(current.id);
    } catch {
      // Best-effort.
    }
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Milestone earned"
      className="lumi-bubble-in fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] -translate-x-1/2 sm:bottom-6 sm:left-auto sm:right-6 sm:w-[22rem] sm:translate-x-0"
    >
      <div
        className="overflow-hidden rounded-2xl border-[1.5px] border-[color:var(--color-saffron-deep)]/40 bg-gradient-to-br from-[#FFFBF0] to-[#FBE9C2] p-5 shadow-[var(--shadow-paper-lg)]"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[color:var(--color-saffron)]/25 text-[1.5rem]">
            {meta.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[color:var(--color-saffron-deep)]">
              Milestone unlocked
            </p>
            <p className="mt-0.5 truncate font-[family-name:var(--font-display)] text-[1.05rem] font-semibold leading-tight tracking-tight text-[color:var(--color-ink)]">
              {value !== null ? `${value} · ` : ""}
              {labelLine}
            </p>
          </div>
        </div>

        <p className="mt-4 text-[0.86rem] leading-snug text-[color:var(--color-ink-soft)]">
          Share this to your profile?
        </p>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 280))}
          rows={2}
          placeholder="Add a note (optional)"
          className="mt-2 w-full resize-none rounded-xl border-[1.5px] border-[color:var(--color-border)] bg-[color:var(--color-paper)] px-3 py-2 text-[0.86rem] leading-snug outline-none transition-colors duration-150 placeholder:text-[color:var(--color-ink-soft)]/55 focus:border-[color:var(--color-saffron-deep)]"
        />

        {error && (
          <p className="mt-2 text-[0.78rem] font-semibold text-[color:var(--color-destructive)]">
            {error}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onDismiss}
            disabled={busy}
            className="text-[0.84rem] font-semibold text-[color:var(--color-ink-soft)] underline decoration-dotted underline-offset-4 transition-colors duration-150 hover:text-[color:var(--color-ink)] disabled:opacity-40"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={onShare}
            disabled={busy}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[color:var(--color-ink)] px-5 text-[0.9rem] font-semibold text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4),0_8px_18px_-8px_rgba(20,16,8,0.4)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-[1px] active:scale-[0.97] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Sharing…" : "Share"}
          </button>
        </div>

        {pending.length > 1 && (
          <p className="mt-3 text-center text-[0.74rem] text-[color:var(--color-ink-soft)]">
            +{pending.length - 1} more milestone{pending.length - 1 === 1 ? "" : "s"} after this
          </p>
        )}
      </div>
    </div>
  );
}
