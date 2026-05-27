"use client";

/**
 * Inline share form attached to a single highlight. Matches the existing
 * "Ask AI" expansion pattern in the highlights panel: collapsed by
 * default, expands below the highlight when invoked.
 *
 * V1 limits:
 *   - Source text is taken verbatim from the highlight (the text the user
 *     selected in the reader). source_lang/target_lang come from the parent
 *     page so the OG card can render the language pill.
 *   - We do not yet fetch the parallel-language passage. The share is
 *     "monolingual" in the post payload (source_text === target_text). The
 *     PostCard + OG card render gracefully in that case.
 *   - Picks the post type by source length: ≤ 280 chars → sentence,
 *     ≤ 500 → passage, > 500 → rejected with an inline error.
 */
import { useState } from "react";
import Link from "next/link";
import { ApiError, getToken } from "@/lib/api";
import {
  createPassagePost,
  createSentencePost,
  type Post,
} from "@/lib/social";

interface Props {
  highlightId: string;
  bookId: string;
  page: number;
  text: string;
  sourceLang?: string | null;
  targetLang?: string | null;
  onClose: () => void;
  onShared?: (post: Post) => void;
}

const SENTENCE_MAX = 280;
const PASSAGE_MAX = 500;

export function HighlightShare({
  highlightId,
  bookId,
  page,
  text,
  sourceLang,
  targetLang,
  onClose,
  onShared,
}: Props) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shared, setShared] = useState<Post | null>(null);

  const len = text.length;
  const tooLong = len > PASSAGE_MAX;
  const kind: "sentence" | "passage" = len <= SENTENCE_MAX ? "sentence" : "passage";
  const remainingNote = 280 - note.length;

  const onShare = async () => {
    if (tooLong) return;
    if (!getToken()) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const extras = {
        book_id: bookId,
        highlight_id: highlightId,
        source_lang: sourceLang ?? null,
        target_lang: targetLang ?? null,
        note: note.trim() || null,
      };
      // V1: source_text and target_text both carry the highlight verbatim.
      // The PostCard renders this as a single quote when they're equal.
      const post =
        kind === "sentence"
          ? await createSentencePost(
              { source_text: text, target_text: text },
              extras,
            )
          : await createPassagePost(
              { source_text: text, target_text: text, source_page: page },
              extras,
            );
      setShared(post);
      onShared?.(post);
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        window.location.href = "/onboarding";
        return;
      }
      if (err instanceof ApiError && err.status === 429) {
        const detail = (err.body as { detail?: string } | null)?.detail;
        setError(detail ?? "You've hit a sharing limit. Try again later.");
        return;
      }
      setError("Couldn't share that. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  if (shared) {
    return (
      <div
        className="mt-2 rounded-xl border border-[color:var(--color-sage-deep)]/30 bg-[color:var(--color-sage)]/8 px-3 py-2.5"
        role="status"
      >
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="grid h-6 w-6 place-items-center rounded-full bg-[color:var(--color-sage-deep)] text-white"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <p className="text-[0.78rem] font-semibold text-[color:var(--color-sage-deep)]">
            Shared to your timeline.
          </p>
        </div>
        <div className="mt-2 flex items-center gap-3 text-[0.74rem]">
          <Link
            href={`/p/${shared.share_slug}`}
            className="font-semibold text-[color:var(--color-ink)] underline decoration-[color:var(--color-saffron)] decoration-2 underline-offset-4"
          >
            View post
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="text-[color:var(--color-ink-soft)] underline decoration-dotted underline-offset-4 hover:text-[color:var(--color-ink)]"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 280))}
        rows={2}
        placeholder="Why this passage? (optional)"
        className="w-full resize-none rounded-lg border-[1.5px] border-[color:var(--color-border)] bg-white px-2.5 py-1.5 text-xs leading-relaxed outline-none transition-colors duration-150 focus:border-[color:var(--color-saffron-deep)]"
      />
      <div className="flex items-center justify-between text-[0.66rem] text-[color:var(--color-ink-soft)]">
        <span>
          {len} / {PASSAGE_MAX} chars · post type: <b>{kind}</b>
        </span>
        <span>{remainingNote} note chars left</span>
      </div>

      {tooLong && (
        <p className="rounded-md bg-[color:var(--color-destructive)]/10 px-2 py-1 text-[0.7rem] text-[color:var(--color-destructive)]">
          This passage is longer than {PASSAGE_MAX} characters. Shorten the
          highlight or share a single sentence from it.
        </p>
      )}

      {error && (
        <p className="rounded-md bg-[color:var(--color-destructive)]/10 px-2 py-1 text-[0.7rem] text-[color:var(--color-destructive)]">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-1.5">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-3 py-1 text-[0.7rem] font-semibold text-[color:var(--color-ink-soft)] transition-colors duration-150 hover:text-[color:var(--color-ink)]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onShare}
          disabled={busy || tooLong}
          className="rounded-full bg-[color:var(--color-saffron-deep)] px-3 py-1 text-[0.7rem] font-semibold text-white transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Sharing…" : "Share to timeline"}
        </button>
      </div>
    </div>
  );
}
