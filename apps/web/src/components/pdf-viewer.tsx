"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { useI18n } from "@/lib/i18n";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export interface Highlight {
  page: number;
  snippet: string;
  nonce: number;
}

export type SavedHighlightColor = "yellow" | "green" | "blue" | "pink";

export interface SavedHighlight {
  id: string;
  page: number;
  text: string;
  color: SavedHighlightColor;
  hasNote?: boolean;
  /** EPUB-only: CFI locator. PDF viewer ignores this. */
  cfi?: string;
}

export type HighlightAction = "save" | "note" | "ask-ai";

interface Props {
  fileUrl: string | null;
  emptyMessage?: string;
  /** A one-shot highlight to jump to (e.g. a chat citation). */
  highlight?: Highlight | null;
  /** All saved highlights for the book — rendered on their respective pages. */
  savedHighlights?: SavedHighlight[];
  /** Called when the user picks an action from the selection toolbar. */
  onSelectionAction?: (action: HighlightAction, page: number, text: string) => void;
  /** Optional handler for clicking an existing saved highlight (jump to / open). */
  onClickSavedHighlight?: (id: string) => void;
  /** Controlled current page (e.g. driven by "jump to highlight" from sidebar). */
  goToPage?: { page: number; nonce: number } | null;
}

const COLOR_TO_CLASS: Record<SavedHighlightColor, string> = {
  yellow: "translify-hl-yellow",
  green: "translify-hl-green",
  blue: "translify-hl-blue",
  pink: "translify-hl-pink",
};

export function PdfViewer({
  fileUrl,
  emptyMessage,
  highlight,
  savedHighlights,
  onSelectionAction,
  onClickSavedHighlight,
  goToPage,
}: Props) {
  const { t } = useI18n();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [width, setWidth] = useState(720);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [selection, setSelection] = useState<
    { text: string; top: number; left: number } | null
  >(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setNumPages(null);
    setPage(1);
    setError(null);
    setSelection(null);
  }, [fileUrl]);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => setWidth(Math.max(280, el.clientWidth - 32));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!highlight) return;
    if (numPages != null) {
      setPage(Math.max(1, Math.min(numPages, highlight.page)));
    } else {
      setPage(highlight.page);
    }
  }, [highlight, numPages]);

  useEffect(() => {
    if (!goToPage) return;
    if (numPages != null) {
      setPage(Math.max(1, Math.min(numPages, goToPage.page)));
    } else {
      setPage(goToPage.page);
    }
  }, [goToPage, numPages]);

  // Saved highlights on the current page, normalized for substring matching.
  const pageHighlights = useMemo(() => {
    if (!savedHighlights) return [];
    return savedHighlights
      .filter((h) => h.page === page)
      .map((h) => ({
        ...h,
        normalized: _normalize(h.text),
      }))
      .filter((h) => h.normalized.length >= 3);
  }, [savedHighlights, page]);

  const citationNormalized = useMemo(() => {
    if (!highlight || highlight.page !== page) return null;
    const n = _normalize(highlight.snippet);
    return n.length >= 3 ? n : null;
  }, [highlight, page]);

  const customTextRenderer = useMemo(() => {
    const hasAny = pageHighlights.length > 0 || citationNormalized != null;
    if (!hasAny) return undefined;
    return ({ str }: { str: string }) => {
      const trimmed = str.trim();
      if (trimmed.length < 3) return _escape(str);
      const candidate = _normalize(trimmed);
      if (candidate.length < 3) return _escape(str);

      // Saved-highlight match: pick the first matching highlight.
      const match = pageHighlights.find((h) => h.normalized.includes(candidate));
      if (match) {
        const cls = COLOR_TO_CLASS[match.color];
        const noteDot = match.hasNote ? " has-note" : "";
        return `<mark class="translify-saved-mark ${cls}${noteDot}" data-hl-id="${_escape(match.id)}">${_escape(str)}</mark>`;
      }

      if (citationNormalized && citationNormalized.includes(candidate)) {
        return `<mark class="translify-cite-mark">${_escape(str)}</mark>`;
      }
      return _escape(str);
    };
  }, [pageHighlights, citationNormalized]);

  // Click handler delegated on the page wrapper to catch clicks on saved marks.
  const onPageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onClickSavedHighlight) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const mark = target.closest("mark.translify-saved-mark");
      if (!mark) return;
      const id = mark.getAttribute("data-hl-id");
      if (id) onClickSavedHighlight(id);
    },
    [onClickSavedHighlight],
  );

  // Detect text selection — uses selectionchange so it fires consistently
  // for both desktop mouse-drag and mobile long-press-and-drag flows.
  // (onMouseUp alone misses the mobile path entirely.)
  // Debounced so we only show the toolbar after the user stops dragging.
  useEffect(() => {
    let timer: number | null = null;
    const finalize = () => {
      const wrap = pageWrapRef.current;
      if (!wrap) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        setSelection(null);
        return;
      }
      const range = sel.getRangeAt(0);
      if (!wrap.contains(range.commonAncestorContainer)) {
        // Selection happened outside the page area — ignore, don't clobber.
        return;
      }
      const text = sel.toString().trim();
      if (text.length < 2) {
        setSelection(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();
      setSelection({
        text,
        top: rect.top - wrapRect.top + wrap.scrollTop,
        left: rect.left - wrapRect.left + rect.width / 2 + wrap.scrollLeft,
      });
    };
    const onSelChange = () => {
      if (timer) window.clearTimeout(timer);
      // Wait ~180ms so we land after the user finishes dragging the handles
      // on mobile; on desktop mouse-up this still feels instant.
      timer = window.setTimeout(finalize, 180);
    };
    document.addEventListener("selectionchange", onSelChange);
    return () => {
      if (timer) window.clearTimeout(timer);
      document.removeEventListener("selectionchange", onSelChange);
    };
  }, []);

  // Dismiss the toolbar when the user taps/clicks anywhere outside it.
  // Listening to both pointerdown variants so this covers desktop + mobile.
  useEffect(() => {
    if (!selection) return;
    const onOutsidePointer = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("[data-translify-selection-toolbar]")) return;
      // If the user is starting a fresh selection inside the page, leave it
      // alone — selectionchange will reset us shortly anyway.
      const wrap = pageWrapRef.current;
      if (wrap && t && wrap.contains(t)) return;
      setSelection(null);
    };
    document.addEventListener("mousedown", onOutsidePointer);
    document.addEventListener("touchstart", onOutsidePointer, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onOutsidePointer);
      document.removeEventListener("touchstart", onOutsidePointer);
    };
  }, [selection]);

  const triggerAction = (action: HighlightAction) => {
    if (!selection) return;
    onSelectionAction?.(action, page, selection.text);
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  if (!fileUrl) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center">
        <div>
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-2 border-dashed border-[color:var(--color-border-strong)]" />
          <p className="text-sm text-[color:var(--color-ink-soft)]">
            {emptyMessage ?? "No document loaded."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[color:var(--color-border)] bg-[color:var(--color-paper)]/60 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-1">
          <PageButton
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            label="Previous"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </PageButton>
          <div className="flex items-center gap-1 rounded-full bg-[color:var(--color-paper-3)]/60 px-3 py-1.5 text-xs font-semibold tabular-nums text-[color:var(--color-ink)]">
            <span>{page}</span>
            <span className="text-[color:var(--color-ink-soft)]">/</span>
            <span className="text-[color:var(--color-ink-soft)]">{numPages ?? "—"}</span>
          </div>
          <PageButton
            onClick={() => setPage((p) => Math.min(numPages ?? p, p + 1))}
            disabled={!numPages || page >= numPages}
            label="Next"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </PageButton>
        </div>

        <div className="flex items-center gap-1">
          <PageButton
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
            disabled={zoom <= 0.6}
            label="Zoom out"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
            </svg>
          </PageButton>
          <span className="rounded-full bg-[color:var(--color-paper-3)]/60 px-2.5 py-1.5 text-[0.7rem] font-semibold tabular-nums text-[color:var(--color-ink-soft)]">
            {Math.round(zoom * 100)}%
          </span>
          <PageButton
            onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
            disabled={zoom >= 2}
            label="Zoom in"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5v14" />
            </svg>
          </PageButton>
        </div>
      </div>

      <div
        ref={pageWrapRef}
        className="relative flex-1 overflow-auto bg-gradient-to-b from-[color:var(--color-paper-2)]/50 to-[color:var(--color-paper-3)]/40 p-6"
        onClick={onPageClick}
      >
        {error ? (
          <p className="text-sm text-[color:var(--color-destructive)]">{error}</p>
        ) : (
          <Document
            file={fileUrl}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            onLoadError={(err) => setError(err.message || "Failed to load document")}
            loading={
              <div className="flex flex-col items-center gap-3 py-12">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[color:var(--color-saffron)]/15 text-[color:var(--color-saffron-deep)]">
                  <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.2-8.5" />
                  </svg>
                </div>
                <p className="text-sm text-[color:var(--color-ink-soft)]">
                  Opening your book…
                </p>
              </div>
            }
          >
            <div className="flex justify-center">
              <Page
                pageNumber={page}
                width={width * zoom}
                renderAnnotationLayer={false}
                renderTextLayer={!!customTextRenderer || !!onSelectionAction}
                customTextRenderer={customTextRenderer}
              />
            </div>
          </Document>
        )}

        {selection && (
          <div
            data-translify-selection-toolbar
            className="absolute z-20 -translate-x-1/2 -translate-y-full"
            style={{
              top: Math.max(0, selection.top - 8),
              left: selection.left,
            }}
          >
            <div className="flex items-center gap-1 rounded-full border border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)] px-1.5 py-1 shadow-[var(--shadow-paper-lg)]">
              <ToolbarButton
                onClick={() => triggerAction("save")}
                label={t("viewer.highlight")}
                tone="saffron"
                icon={
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 11-6 6v3h3l6-6" />
                    <path d="m13 8 6-6 3 3-6 6" />
                    <path d="m18 5-9 9" />
                  </svg>
                }
              />
              <ToolbarButton
                onClick={() => triggerAction("note")}
                label={t("viewer.addNote")}
                tone="sage"
                icon={
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                }
              />
              <ToolbarButton
                onClick={() => triggerAction("ask-ai")}
                label={t("viewer.askAi")}
                tone="coral"
                icon={
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v3" />
                    <path d="M19 12h3" />
                    <path d="M12 22v-3" />
                    <path d="M2 12h3" />
                    <path d="m17 7 2-2" />
                    <path d="m5 19 2-2" />
                    <path d="m17 17 2 2" />
                    <path d="m5 5 2 2" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                }
              />
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        /* The text layer renders text transparently on top of the canvas image
           so users can select it. <mark> defaults to color: black, which
           re-reveals the text-layer copy and double-renders it on top of the
           canvas — looks blurry. Force the mark text transparent like the
           surrounding spans, so only the canvas pixels show through. */
        .translify-cite-mark,
        .translify-saved-mark {
          color: transparent;
          border-radius: 2px;
          padding: 0 1px;
          mix-blend-mode: multiply;
        }
        .translify-cite-mark {
          background-color: rgba(224, 164, 88, 0.55);
        }
        .translify-saved-mark {
          cursor: pointer;
          transition: filter 120ms ease;
        }
        .translify-saved-mark:hover {
          filter: brightness(0.94);
        }
        .translify-saved-mark.has-note {
          box-shadow: inset 0 -2px 0 rgba(60, 40, 15, 0.45);
        }
        .translify-hl-yellow { background-color: rgba(253, 230, 138, 0.85); }
        .translify-hl-green  { background-color: rgba(187, 247, 208, 0.85); }
        .translify-hl-blue   { background-color: rgba(191, 219, 254, 0.85); }
        .translify-hl-pink   { background-color: rgba(251, 207, 232, 0.85); }
      `}</style>
    </div>
  );
}

function PageButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid h-8 w-8 place-items-center rounded-full border-[1.5px] border-[color:var(--color-border)] bg-white/70 text-[color:var(--color-ink-soft)] transition-all hover:-translate-y-[1px] hover:border-[color:var(--color-ink-soft)]/40 hover:bg-white hover:text-[color:var(--color-ink)] disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function ToolbarButton({
  onClick,
  label,
  icon,
  tone,
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  tone: "saffron" | "sage" | "coral";
}) {
  const toneClass = {
    saffron: "text-[color:var(--color-saffron-deep)] hover:bg-[color:var(--color-saffron)]/15 active:bg-[color:var(--color-saffron)]/25",
    sage: "text-[color:var(--color-sage-deep)] hover:bg-[color:var(--color-sage)]/15 active:bg-[color:var(--color-sage)]/25",
    coral: "text-[color:var(--color-coral-deep)] hover:bg-[color:var(--color-coral)]/15 active:bg-[color:var(--color-coral)]/25",
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      // Prevent the browser from clearing our text selection (which would
      // collapse the range and zero out our toolbar's payload) before the
      // click handler fires. Touch on iOS Safari is the worst offender.
      onMouseDown={(e) => e.preventDefault()}
      onTouchStart={(e) => e.preventDefault()}
      aria-label={label}
      title={label}
      // Larger touch targets on mobile: 36px+ tall, generous horizontal
      // padding. Desktop stays tighter via the sm: breakpoint.
      className={`flex min-h-[40px] touch-manipulation items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-semibold transition-colors sm:min-h-0 sm:px-2.5 sm:py-1 sm:text-[11px] ${toneClass}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function _escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function _normalize(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}
