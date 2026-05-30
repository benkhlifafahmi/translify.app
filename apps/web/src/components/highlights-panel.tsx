"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
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
import { HighlightShare } from "@/components/highlight-share";
import { useI18n } from "@/lib/i18n";
import { Lumi } from "@/components/lumi/lumi";

export interface OpenHighlightState {
  id: string;
  /** Open the note editor immediately. */
  autoEditNote?: boolean;
  /** Open the Ask-AI input and focus the question textarea (does NOT submit). */
  autoAskAi?: boolean;
  /** Open the inline share form immediately. */
  autoShare?: boolean;
  /** Bumped each time to force re-trigger even when id is unchanged. */
  nonce: number;
}

interface Props {
  bookId: string;
  open: OpenHighlightState | null;
  onConsumed: () => void;
  onJumpToPage: (page: number) => void;
  /** The book's original language (e.g. "fr" for Du côté de chez Swann).
   * Used to tag shared sentence/passage posts with the language pair. */
  sourceLang?: string | null;
  /** The language the user is reading in. */
  targetLang?: string | null;
}

const COLORS: HighlightColor[] = ["yellow", "green", "blue", "pink"];

export function HighlightsPanel({ bookId, open, onConsumed, onJumpToPage, sourceLang, targetLang }: Props) {
  const qc = useQueryClient();
  const { t } = useI18n();
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
        {t("notes.loading")}
      </div>
    );
  }

  if (highlights.length === 0) {
    return <EmptyNotesState />;
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto px-3 py-3">
      <ExportNotesBar bookId={bookId} count={highlights.length} />
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
            autoShare={open?.id === h.id ? open : null}
            sourceLang={sourceLang}
            targetLang={targetLang}
            onConsumed={onConsumed}
            onJumpToPage={() => onJumpToPage(h.page)}
            onUpdated={(updated) => {
              qc.setQueryData<Highlight[]>(["highlights", bookId], (old) =>
                old ? old.map((x) => (x.id === updated.id ? updated : x)) : old,
              );
              // Defensive refetch so the saved note shows up even if optimistic
              // cache update is dropped by a concurrent refetch.
              qc.invalidateQueries({ queryKey: ["highlights", bookId] });
              qc.invalidateQueries({ queryKey: ["highlights", "all"] });
            }}
            onDeleted={() => {
              qc.setQueryData<Highlight[]>(["highlights", bookId], (old) =>
                old ? old.filter((x) => x.id !== h.id) : old,
              );
              qc.invalidateQueries({ queryKey: ["highlights", bookId] });
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
  autoShare: OpenHighlightState | null;
  sourceLang?: string | null;
  targetLang?: string | null;
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
    autoShare,
    sourceLang,
    targetLang,
    onConsumed,
    onJumpToPage,
    onUpdated,
    onDeleted,
  },
  ref,
) {
  const { t } = useI18n();
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState(highlight.note ?? "");
  const [askQuestion, setAskQuestion] = useState("");
  const [askExpanded, setAskExpanded] = useState(false);
  const [shareExpanded, setShareExpanded] = useState(false);
  const askInputRef = useRef<HTMLTextAreaElement | null>(null);
  const triggeredAskAi = useRef<number | null>(null);
  const triggeredShare = useRef<number | null>(null);

  const saveNote = useMutation({
    mutationFn: async (note: string | null) =>
      updateHighlight(highlight.id, { note }),
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

  // "Ask AI" from the PDF toolbar: open the question input + focus it.
  // The user types their question and submits — we never auto-fire the call.
  useEffect(() => {
    if (!autoAskAi?.autoAskAi) return;
    if (triggeredAskAi.current === autoAskAi.nonce) return;
    triggeredAskAi.current = autoAskAi.nonce;
    setAskExpanded(true);
    onConsumed();
    // Defer focus until after the textarea is in the DOM.
    requestAnimationFrame(() => askInputRef.current?.focus());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAskAi?.nonce, autoAskAi?.autoAskAi]);

  // "Share" from the PDF toolbar: expand the share form inline.
  useEffect(() => {
    if (!autoShare?.autoShare) return;
    if (triggeredShare.current === autoShare.nonce) return;
    triggeredShare.current = autoShare.nonce;
    setShareExpanded(true);
    onConsumed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoShare?.nonce, autoShare?.autoShare]);

  const onConfirmDelete = () => {
    if (!confirm(t("notes.deleteConfirm"))) return;
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
          {/* Lumi perches on top of the note block, animating as if she's writing alongside */}
          <div className="lumi-bubble-in -mb-1 flex items-end gap-1.5">
            <Lumi state="writing" size={56} animate />
            <span className="mb-1 rounded-full bg-[color:var(--color-saffron)]/15 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[color:var(--color-saffron-deep)]">
              writing with you
            </span>
          </div>
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder={t("notes.notePlaceholder")}
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
              {t("notes.cancel")}
            </button>
            <button
              type="button"
              onClick={() => saveNote.mutate(noteDraft.trim() || null)}
              disabled={saveNote.isPending}
              className="rounded-full bg-[color:var(--color-ink)] px-3 py-1 text-[0.7rem] font-semibold text-[color:var(--color-paper)] hover:opacity-90 disabled:opacity-50"
            >
              {saveNote.isPending ? t("notes.saving") : t("notes.saveNote")}
            </button>
          </div>
          {saveNote.isError && (
            <p className="rounded-md bg-[color:var(--color-destructive)]/10 px-2 py-1 text-[0.7rem] text-[color:var(--color-destructive)]">
              {saveNote.error instanceof ApiError
                ? saveNote.error.message
                : (saveNote.error as Error).message || t("notes.saveError")}
            </p>
          )}
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
            <span className="italic">{t("notes.addNote")}</span>
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
            {t("notes.askAiCta")}
          </button>
        ) : null}

        {askExpanded && !highlight.ai_answer && (
          <div className="flex flex-col gap-1.5">
            <textarea
              ref={askInputRef}
              value={askQuestion}
              onChange={(e) => setAskQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  if (!askAi.isPending) askAi.mutate(askQuestion.trim() || null);
                }
              }}
              placeholder={t("notes.askPlaceholder")}
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
                {t("notes.cancel")}
              </button>
              <button
                type="button"
                onClick={() => askAi.mutate(askQuestion.trim() || null)}
                disabled={askAi.isPending}
                className="rounded-full bg-[color:var(--color-coral-deep)] px-3 py-1 text-[0.7rem] font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {askAi.isPending ? t("notes.thinking") : t("notes.askSubmit")}
              </button>
            </div>
          </div>
        )}

        {askAi.isPending && !highlight.ai_answer && (
          <div className="lumi-bubble-in mt-2 flex items-center gap-2 rounded-lg bg-[color:var(--color-coral)]/10 px-2.5 py-1.5">
            <Lumi state="thinking" size={48} animate />
            <p className="text-[0.72rem] italic text-[color:var(--color-coral-deep)]">
              {t("notes.flipping")}
            </p>
          </div>
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
                {highlight.ai_question ? t("notes.aiQuestion") : t("notes.aiExplanation")}
              </p>
              <button
                type="button"
                onClick={() => askAi.mutate(askQuestion.trim() || null)}
                disabled={askAi.isPending}
                className="text-[0.65rem] font-semibold text-[color:var(--color-coral-deep)] hover:underline disabled:opacity-50"
              >
                {askAi.isPending ? t("notes.askAgainPending") : t("notes.askAgain")}
              </button>
            </div>
            {highlight.ai_question && (
              <p className="mb-1 text-[0.7rem] italic text-[color:var(--color-ink-soft)]">
                “{highlight.ai_question}”
              </p>
            )}
            <div className="prose-chat text-xs leading-relaxed text-[color:var(--color-ink)]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
              >
                {highlight.ai_answer}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Share — sits alongside Ask AI in the action row */}
        {!shareExpanded && (
          <button
            type="button"
            onClick={() => setShareExpanded(true)}
            className="ml-3 inline-flex items-center gap-1.5 text-[0.7rem] font-semibold text-[color:var(--color-saffron-deep)] hover:underline"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            Share to timeline
          </button>
        )}

        {shareExpanded && (
          <HighlightShare
            highlightId={highlight.id}
            bookId={highlight.book_id}
            page={highlight.page}
            text={highlight.text}
            sourceLang={sourceLang}
            targetLang={targetLang}
            onClose={() => setShareExpanded(false)}
          />
        )}
      </div>
    </div>
  );
});

function EmptyNotesState() {
  const { t } = useI18n();
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
        {t("notes.empty.title")}
      </h4>
      <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-[color:var(--color-ink-soft)]">
        {t("notes.empty.body")}
      </p>
    </div>
  );
}

// Header strip above the highlight cards: count + Markdown export.
// Backend gates the route on the Scholar/Family `annotated_export` quota and
// returns 402 otherwise — we let the user click and surface the upgrade
// message inline rather than hiding the affordance entirely.
function ExportNotesBar({ bookId, count }: { bookId: string; count: number }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onExport = async () => {
    setBusy(true);
    setErr(null);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("translify_jwt")
          : null;
      const res = await fetch(`${apiUrl}/books/${bookId}/annotations.md`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.status === 402) {
        setErr("Annotated export is a Scholar / Family feature. Upgrade to download your notes.");
        return;
      }
      if (!res.ok) {
        setErr(`Export failed (${res.status}). Try again in a moment.`);
        return;
      }
      const blob = await res.blob();
      // Try to honour the server's Content-Disposition filename; fall back
      // to a generic one if the header is missing or not parseable.
      const dispo = res.headers.get("Content-Disposition") || "";
      const match = /filename="([^"]+)"/.exec(dispo);
      const filename = match?.[1] ?? `annotations-${bookId}.md`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setErr("Network error while exporting. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-paper-2)]/40 px-3 py-2">
      <span className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[color:var(--color-ink-soft)]">
        <span className="tabular-nums text-[color:var(--color-ink)]">{count}</span>{" "}
        {count === 1 ? "annotation" : "annotations"}
      </span>
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={onExport}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-ink)] px-3 py-1 text-[0.72rem] font-semibold text-[color:var(--color-paper)] transition-transform hover:-translate-y-[1px] disabled:opacity-50"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {busy ? "Preparing…" : "Export .md"}
        </button>
        {err && (
          <span className="text-[0.65rem] leading-tight text-[color:var(--color-coral-deep)]">
            {err}
          </span>
        )}
      </div>
    </div>
  );
}
