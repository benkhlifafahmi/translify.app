"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  askAiAboutHighlight,
  deleteHighlight,
  listBookHighlights,
  updateHighlight,
  HIGHLIGHT_COLOR_CLASS,
  type Highlight,
  type HighlightColor,
} from "@/lib/highlights";
import { ApiError } from "@/lib/api";
import { parseQuotaError } from "@/lib/quota";
import { UpgradeNudge } from "@/components/upgrade-nudge";

export interface OpenHighlightState {
  id: string;
  /** Open the note editor immediately. */
  autoEditNote?: boolean;
  /** Trigger Ask-AI on mount. */
  autoAskAi?: boolean;
  /** Bumped each time to force re-trigger even when id is unchanged. */
  nonce: number;
}

interface Props {
  bookId: string;
  open: OpenHighlightState | null;
  onConsumed: () => void;
  onJumpToPage: (page: number) => void;
}

const COLORS: HighlightColor[] = ["yellow", "green", "blue", "pink"];

export function HighlightsPanel({ bookId, open, onConsumed, onJumpToPage }: Props) {
  const qc = useQueryClient();
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const { data: highlights = [], isLoading } = useQuery<Highlight[]>({
    queryKey: ["highlights", bookId],
    queryFn: () => listBookHighlights(bookId),
  });

  useEffect(() => {
    if (!open) return;
    const el = itemRefs.current[open.id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [open, highlights]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[color:var(--color-ink-soft)]">
        Loading notes…
      </div>
    );
  }

  if (highlights.length === 0) {
    return <EmptyNotesState />;
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto px-3 py-3">
      <div className="flex flex-col gap-2.5">
        {highlights.map((h) => (
          <HighlightCard
            key={h.id}
            ref={(el) => {
              itemRefs.current[h.id] = el;
            }}
            highlight={h}
            isOpen={open?.id === h.id}
            autoEditNote={open?.id === h.id && !!open.autoEditNote}
            autoAskAi={open?.id === h.id ? open : null}
            onConsumed={onConsumed}
            onJumpToPage={() => onJumpToPage(h.page)}
            onUpdated={(updated) => {
              qc.setQueryData<Highlight[]>(["highlights", bookId], (old) =>
                old ? old.map((x) => (x.id === updated.id ? updated : x)) : old,
              );
              qc.invalidateQueries({ queryKey: ["highlights", "all"] });
            }}
            onDeleted={() => {
              qc.setQueryData<Highlight[]>(["highlights", bookId], (old) =>
                old ? old.filter((x) => x.id !== h.id) : old,
              );
              qc.invalidateQueries({ queryKey: ["highlights", "all"] });
            }}
          />
        ))}
      </div>
    </div>
  );
}

interface CardProps {
  highlight: Highlight;
  isOpen: boolean;
  autoEditNote: boolean;
  autoAskAi: OpenHighlightState | null;
  onConsumed: () => void;
  onJumpToPage: () => void;
  onUpdated: (h: Highlight) => void;
  onDeleted: () => void;
}

const HighlightCard = forwardRef<HTMLDivElement, CardProps>(function HighlightCard(
  {
    highlight,
    isOpen,
    autoEditNote,
    autoAskAi,
    onConsumed,
    onJumpToPage,
    onUpdated,
    onDeleted,
  },
  ref,
) {
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState(highlight.note ?? "");
  const [askQuestion, setAskQuestion] = useState("");
  const [askExpanded, setAskExpanded] = useState(false);
  const triggeredAskAi = useRef<number | null>(null);

  const saveNote = useMutation({
    mutationFn: async () =>
      updateHighlight(highlight.id, { note: noteDraft.trim() || null }),
    onSuccess: (h) => {
      onUpdated(h);
      setEditingNote(false);
    },
  });

  const setColor = useMutation({
    mutationFn: async (color: HighlightColor) =>
      updateHighlight(highlight.id, { color }),
    onSuccess: (h) => onUpdated(h),
  });

  const remove = useMutation({
    mutationFn: async () => deleteHighlight(highlight.id),
    onSuccess: () => onDeleted(),
  });

  const askAi = useMutation({
    mutationFn: async (q: string | null) =>
      askAiAboutHighlight(highlight.id, q),
    onSuccess: (h) => {
      onUpdated(h);
      setAskQuestion("");
    },
  });

  useEffect(() => {
    if (autoEditNote) setEditingNote(true);
  }, [autoEditNote]);

  useEffect(() => {
    if (!autoAskAi?.autoAskAi) return;
    if (triggeredAskAi.current === autoAskAi.nonce) return;
    triggeredAskAi.current = autoAskAi.nonce;
    setAskExpanded(true);
    askAi.mutate(null);
    onConsumed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAskAi?.nonce, autoAskAi?.autoAskAi]);

  const onConfirmDelete = () => {
    if (!confirm("Delete this highlight?")) return;
    remove.mutate();
  };

  return (
    <div
      ref={ref}
      className={`relative rounded-2xl border-[1.5px] bg-white/80 p-3 transition-all ${
        isOpen
          ? "border-[color:var(--color-saffron)] shadow-[var(--shadow-paper-lg)]"
          : "border-[color:var(--color-border)]"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onJumpToPage}
          className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-paper-3)]/70 px-2.5 py-1 text-[0.7rem] font-semibold text-[color:var(--color-ink-soft)] transition-colors hover:bg-[color:var(--color-saffron)]/15 hover:text-[color:var(--color-saffron-deep)]"
          title={`Jump to page ${highlight.page}`}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
          page {highlight.page}
        </button>
        <div className="flex items-center gap-0.5">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor.mutate(c)}
              aria-label={`Set color ${c}`}
              title={c}
              className={`h-4 w-4 rounded-full border transition-transform ${
                HIGHLIGHT_COLOR_CLASS[c]
              } ${
                highlight.color === c
                  ? "scale-110 border-[color:var(--color-ink)]"
                  : "border-[color:var(--color-border)] hover:scale-110"
              }`}
            />
          ))}
          <button
            type="button"
            onClick={onConfirmDelete}
            disabled={remove.isPending}
            className="ml-1 grid h-6 w-6 place-items-center rounded-full text-[color:var(--color-ink-soft)] transition-colors hover:bg-[color:var(--color-destructive)]/10 hover:text-[color:var(--color-destructive)] disabled:opacity-40"
            aria-label="Delete highlight"
            title="Delete"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      <blockquote
        className={`mb-2 rounded-md border-l-2 border-[color:var(--color-saffron)] py-1 pl-2.5 text-sm italic leading-relaxed text-[color:var(--color-ink)] ${
          HIGHLIGHT_COLOR_CLASS[highlight.color]
        }`}
      >
        “{highlight.text}”
      </blockquote>

      {editingNote ? (
        <div className="mb-2 flex flex-col gap-1.5">
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Write a note about this passage…"
            rows={3}
            autoFocus
            className="w-full resize-none rounded-lg border-[1.5px] border-[color:var(--color-border)] bg-white px-2.5 py-1.5 text-xs leading-relaxed focus:border-[color:var(--color-saffron)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-saffron)]/25"
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => {
                setNoteDraft(highlight.note ?? "");
                setEditingNote(false);
              }}
              className="rounded-full px-3 py-1 text-[0.7rem] font-semibold text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => saveNote.mutate()}
              disabled={saveNote.isPending}
              className="rounded-full bg-[color:var(--color-ink)] px-3 py-1 text-[0.7rem] font-semibold text-[color:var(--color-paper)] hover:opacity-90 disabled:opacity-50"
            >
              {saveNote.isPending ? "Saving…" : "Save note"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setNoteDraft(highlight.note ?? "");
            setEditingNote(true);
          }}
          className="mb-2 block w-full rounded-lg border border-dashed border-[color:var(--color-border)] px-2.5 py-1.5 text-left text-xs leading-relaxed text-[color:var(--color-ink-soft)] transition-colors hover:border-[color:var(--color-sage)] hover:bg-[color:var(--color-sage)]/8 hover:text-[color:var(--color-sage-deep)]"
        >
          {highlight.note ? (
            <span className="whitespace-pre-wrap text-[color:var(--color-ink)]">
              {highlight.note}
            </span>
          ) : (
            <span className="italic">+ Add a note</span>
          )}
        </button>
      )}

      <div className="border-t border-dashed border-[color:var(--color-border)] pt-2">
        {!highlight.ai_answer && !askExpanded ? (
          <button
            type="button"
            onClick={() => setAskExpanded(true)}
            className="inline-flex items-center gap-1.5 text-[0.7rem] font-semibold text-[color:var(--color-coral-deep)] hover:underline"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3.5" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
            Ask AI about this passage
          </button>
        ) : null}

        {askExpanded && !highlight.ai_answer && (
          <div className="flex flex-col gap-1.5">
            <textarea
              value={askQuestion}
              onChange={(e) => setAskQuestion(e.target.value)}
              placeholder="What do you want to know? (leave blank to just explain)"
              rows={2}
              className="w-full resize-none rounded-lg border-[1.5px] border-[color:var(--color-border)] bg-white px-2.5 py-1.5 text-xs leading-relaxed focus:border-[color:var(--color-coral)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-coral)]/25"
            />
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setAskExpanded(false);
                  setAskQuestion("");
                }}
                className="rounded-full px-3 py-1 text-[0.7rem] font-semibold text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => askAi.mutate(askQuestion.trim() || null)}
                disabled={askAi.isPending}
                className="rounded-full bg-[color:var(--color-coral-deep)] px-3 py-1 text-[0.7rem] font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {askAi.isPending ? "Thinking…" : "Ask AI →"}
              </button>
            </div>
          </div>
        )}

        {askAi.isPending && !highlight.ai_answer && (
          <p className="mt-1.5 text-[0.7rem] italic text-[color:var(--color-ink-soft)]">
            flipping pages for context…
          </p>
        )}

        {askAi.isError &&
          (() => {
            const quota = parseQuotaError(askAi.error);
            if (quota) return <UpgradeNudge error={quota} kind="chat" />;
            return (
              <p className="mt-1.5 rounded-md bg-[color:var(--color-destructive)]/10 px-2 py-1 text-[0.7rem] text-[color:var(--color-destructive)]">
                {askAi.error instanceof ApiError
                  ? askAi.error.message
                  : (askAi.error as Error).message || "Ask AI failed"}
              </p>
            );
          })()}

        {highlight.ai_answer && (
          <div className="mt-1 rounded-xl bg-[color:var(--color-coral)]/10 p-2.5">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-[color:var(--color-coral-deep)]">
                AI · {highlight.ai_question ? "your question" : "explanation"}
              </p>
              <button
                type="button"
                onClick={() => askAi.mutate(askQuestion.trim() || null)}
                disabled={askAi.isPending}
                className="text-[0.65rem] font-semibold text-[color:var(--color-coral-deep)] hover:underline disabled:opacity-50"
              >
                {askAi.isPending ? "asking…" : "ask again"}
              </button>
            </div>
            {highlight.ai_question && (
              <p className="mb-1 text-[0.7rem] italic text-[color:var(--color-ink-soft)]">
                “{highlight.ai_question}”
              </p>
            )}
            <div className="prose-chat text-xs leading-relaxed text-[color:var(--color-ink)]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {highlight.ai_answer}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

function EmptyNotesState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-3xl bg-[color:var(--color-saffron)]/15 text-[color:var(--color-saffron-deep)]">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 11-6 6v3h3l6-6" />
          <path d="m13 8 6-6 3 3-6 6" />
          <path d="m18 5-9 9" />
        </svg>
      </div>
      <h4 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
        Highlight to remember.
      </h4>
      <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-[color:var(--color-ink-soft)]">
        Select any text in the book to save it, add a note, or ask AI to
        explain. Your highlights live here and on your shelf.
      </p>
    </div>
  );
}
