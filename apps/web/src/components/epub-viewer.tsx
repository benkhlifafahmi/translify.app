"use client";

// Translify EPUB viewer.
//
// Aesthetic: a typeset book, not a document. Paginated by default, true
// page-turn navigation, serif body, paper background. The paper-spine
// progress indicator on the right edge sits like the spine of a physical
// book — you can see where you are without checking a page number.
//
// Feature parity with the PDF viewer for highlights: selection raises a
// torn-paper toolbar with Highlight / Note / Ask AI; saved highlights are
// rendered inline via epubjs's annotation API; clicking a saved highlight
// jumps to / opens it in the right-panel notes drawer.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import ePub, { Book, Rendition, Contents } from "epubjs";
import type { Highlight as CitationHighlight, SavedHighlight, HighlightAction } from "./pdf-viewer";
import { useI18n } from "@/lib/i18n";

export interface EpubViewerProps {
  fileUrl: string | null;
  emptyMessage?: string;
  /** Chat citation highlight (one-shot jump + flash). */
  highlight?: CitationHighlight | null;
  /** All saved highlights for the book, rendered inline. */
  savedHighlights?: SavedHighlight[];
  /** Selection-toolbar callback. EPUBs don't have page numbers in the PDF
   * sense; we pass the readable position as `page` (CFI start position),
   * fall back to 1 if unavailable. The text is still the source of truth. */
  onSelectionAction?: (action: HighlightAction, page: number, text: string, cfi?: string) => void;
  /** Click handler for an existing saved highlight mark. */
  onClickSavedHighlight?: (id: string) => void;
  /** Imperative jump from outside (e.g. clicking a citation). */
  goToPage?: { page: number; nonce: number } | null;
}

type Theme = "paper" | "sepia" | "night";

const THEMES: Record<Theme, { bg: string; ink: string; accent: string }> = {
  paper:  { bg: "#FAF6EE", ink: "#20283A", accent: "#C8893E" },
  sepia:  { bg: "#F0E2C2", ink: "#3A2A18", accent: "#A26B22" },
  night:  { bg: "#1B1916", ink: "#E8DECB", accent: "#E0A458" },
};

const HL_COLORS: Record<SavedHighlight["color"], string> = {
  yellow: "rgba(253, 230, 138, 0.55)",
  green:  "rgba(187, 247, 208, 0.55)",
  blue:   "rgba(191, 219, 254, 0.55)",
  pink:   "rgba(251, 207, 232, 0.55)",
};

const DEFAULT_FONT_SIZE = 110; // percent
const FONT_SIZE_MIN = 80;
const FONT_SIZE_MAX = 180;
const FONT_SIZE_STEP = 10;

const DEFAULT_LINE_HEIGHT = 1.65;
const LINE_HEIGHTS = [1.4, 1.55, 1.65, 1.8, 2.0] as const;

const FONT_CHOICES: Array<{ id: string; label: string; stack: string }> = [
  { id: "fraunces",  label: "Fraunces (default)", stack: "var(--font-fraunces), ui-serif, Georgia, serif" },
  { id: "iowan",     label: "Iowan Old Style",    stack: "'Iowan Old Style', 'Palatino Linotype', Palatino, serif" },
  { id: "georgia",   label: "Georgia",            stack: "Georgia, 'Times New Roman', serif" },
  { id: "system",    label: "System sans",        stack: "var(--font-hanken), system-ui, sans-serif" },
];

export function EpubViewer({
  fileUrl,
  emptyMessage,
  highlight,
  savedHighlights,
  onSelectionAction,
  onClickSavedHighlight,
  goToPage,
}: EpubViewerProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bookRef = useRef<Book | null>(null);
  const renditionRef = useRef<Rendition | null>(null);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reading state
  const [progress, setProgress] = useState(0); // 0..1
  const [chapterLabel, setChapterLabel] = useState<string>("");
  const [chapterMinutesLeft, setChapterMinutesLeft] = useState<number | null>(null);

  // Type tray state
  const [trayOpen, setTrayOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("paper");
  const [fontSize, setFontSize] = useState<number>(DEFAULT_FONT_SIZE);
  const [lineHeight, setLineHeight] = useState<number>(DEFAULT_LINE_HEIGHT);
  const [fontStack, setFontStack] = useState<string>(FONT_CHOICES[0].stack);

  // Selection toolbar state
  const [selection, setSelection] = useState<{
    text: string;
    cfi: string;
    top: number;
    left: number;
  } | null>(null);

  // ───────────── Book load + initial render ─────────────

  useEffect(() => {
    if (!fileUrl || !containerRef.current) return;

    setReady(false);
    setError(null);
    setSelection(null);

    const book = ePub(fileUrl, { openAs: "epub" });
    bookRef.current = book;

    const rendition = book.renderTo(containerRef.current, {
      width: "100%",
      height: "100%",
      flow: "paginated",
      spread: "auto",
      manager: "default",
      allowScriptedContent: false,
    });
    renditionRef.current = rendition;

    // Display the cover / first locatable section.
    rendition
      .display()
      .then(() => {
        setReady(true);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("EPUB display error", err);
        setError("Couldn't open this book. The file may be malformed.");
      });

    // Generate locations for accurate progress reporting. ~1024 chars per
    // location is the epubjs default sweet spot for accuracy vs speed.
    book.ready.then(() =>
      book.locations.generate(1024).then(() => {
        setReady(true);
      }),
    );

    // Cleanup on unmount / fileUrl change
    return () => {
      try {
        rendition.destroy();
      } catch {
        /* noop */
      }
      try {
        book.destroy();
      } catch {
        /* noop */
      }
      bookRef.current = null;
      renditionRef.current = null;
    };
  }, [fileUrl]);

  // ───────────── Theme + typography (re-applies on change) ─────────────

  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;
    const t = THEMES[theme];

    rendition.themes.override("body", `background: ${t.bg} !important;`);
    rendition.themes.override("html", `background: ${t.bg} !important;`);
    rendition.themes.override("*", `color: ${t.ink};`);
    rendition.themes.override("a", `color: ${t.accent}; text-decoration-color: ${t.accent}`);
    rendition.themes.override("p, li, dd, dt", `line-height: ${lineHeight}; font-family: ${fontStack};`);
    rendition.themes.override("h1, h2, h3, h4, h5, h6", `font-family: ${fontStack};`);
    rendition.themes.override(
      "::selection",
      `background: rgba(224, 164, 88, 0.45); color: ${t.ink};`,
    );
    rendition.themes.fontSize(`${fontSize}%`);
  }, [theme, fontSize, lineHeight, fontStack, ready]);

  // ───────────── Selection toolbar wiring ─────────────

  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;

    const onSelected = (cfiRange: string, contents: Contents) => {
      const sel = (contents.window as Window).getSelection?.();
      if (!sel || sel.isCollapsed) {
        setSelection(null);
        return;
      }
      const text = sel.toString().trim();
      if (text.length < 2) {
        setSelection(null);
        return;
      }
      // Position the toolbar relative to the host container, not the iframe —
      // we read the iframe's offset within our container and add the selection
      // rect from inside the iframe.
      const host = containerRef.current;
      if (!host) return;
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const iframe = (contents.window as Window).frameElement as HTMLIFrameElement | null;
      const ifRect = iframe?.getBoundingClientRect();
      const hostRect = host.getBoundingClientRect();
      const top = (ifRect?.top ?? 0) + rect.top - hostRect.top;
      const left = (ifRect?.left ?? 0) + rect.left - hostRect.left + rect.width / 2;
      setSelection({ text, cfi: cfiRange, top: Math.max(8, top - 8), left });
    };

    rendition.on("selected", onSelected);
    return () => {
      rendition.off("selected", onSelected);
    };
  }, [ready]);

  // ───────────── Saved highlights rendering ─────────────

  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;
    const annotations = rendition.annotations;
    if (!annotations) return;

    // Clear any prior annotations first. epubjs doesn't have a "clear all"
    // — we track ours and remove individually.
    const cfis: string[] = [];

    (savedHighlights ?? []).forEach((h) => {
      // CFI is required to render inline. PDF highlights have no CFI; older
      // EPUB highlights created before migration 0005 also won't have one
      // (they'll still show in the Notes panel — just not inline).
      if (!h.cfi) return;
      cfis.push(h.cfi);
      annotations.add(
        "highlight",
        h.cfi,
        { id: h.id },
        () => onClickSavedHighlight?.(h.id),
        "translify-epub-mark",
        { fill: HL_COLORS[h.color] },
      );
    });

    return () => {
      cfis.forEach((cfi) => {
        try {
          annotations.remove(cfi, "highlight");
        } catch {
          /* noop */
        }
      });
    };
  }, [savedHighlights, onClickSavedHighlight, ready]);

  // ───────────── Citation highlight (one-shot jump + flash) ─────────────

  useEffect(() => {
    if (!highlight) return;
    const rendition = renditionRef.current;
    if (!rendition) return;
    // The CitationHighlight carries `snippet`; for EPUB we treat the snippet
    // as a CFI if it starts with "epubcfi(", otherwise as a search term.
    const target = highlight.snippet;
    if (target.startsWith("epubcfi(")) {
      rendition.display(target).catch(() => {});
      return;
    }
    // Fallback: search the book for the snippet and jump to the first match.
    const book = bookRef.current;
    if (!book) return;
    book.ready.then(async () => {
      const spine = book.spine as unknown as {
        each: (cb: (item: { href: string; load: (req: unknown) => Promise<unknown>; find: (q: string) => { cfi: string }[] }) => void) => void;
      };
      let foundCfi: string | null = null;
      const searchTasks: Promise<void>[] = [];
      spine.each((item) => {
        if (foundCfi) return;
        const task = item
          .load(book.load.bind(book))
          .then(() => {
            const matches = item.find(target);
            if (matches.length > 0 && !foundCfi) foundCfi = matches[0].cfi;
          })
          .catch(() => undefined);
        searchTasks.push(task as Promise<void>);
      });
      await Promise.all(searchTasks);
      if (foundCfi) {
        rendition.display(foundCfi).catch(() => {});
      }
    });
  }, [highlight]);

  // External goToPage — interpreted as "go to location N out of total locations".
  useEffect(() => {
    if (!goToPage) return;
    const rendition = renditionRef.current;
    const book = bookRef.current;
    if (!rendition || !book) return;
    book.ready.then(() => {
      const total = book.locations.length();
      if (!total) return;
      const idx = Math.max(0, Math.min(total - 1, goToPage.page - 1));
      const cfi = book.locations.cfiFromLocation(idx);
      if (cfi) rendition.display(cfi).catch(() => {});
    });
  }, [goToPage]);

  // ───────────── Progress + chapter tracking ─────────────

  useEffect(() => {
    const rendition = renditionRef.current;
    const book = bookRef.current;
    if (!rendition || !book) return;

    const onRelocated = (location: {
      start: { cfi: string; percentage?: number; href?: string };
      end?: { cfi: string };
    }) => {
      const p = location.start.percentage ?? 0;
      setProgress(p);

      // Look up chapter label from spine + nav.
      const href = location.start.href;
      if (!href) return;
      book.loaded.navigation.then((nav) => {
        // Walk nav tree to find the toc item matching this href.
        const all = flattenNav(nav.toc);
        const item = all.find((t) => href.includes(t.href) || t.href.includes(href));
        if (item) {
          setChapterLabel(item.label.trim());
        }
      });

      // Crude reading-time-left estimate: characters remaining in the chapter
      // ÷ ~1100 chars per minute (~250 wpm × 4.4 chars/word).
      try {
        const totalLoc = book.locations.length();
        if (totalLoc > 0) {
          const currentLoc = Number(book.locations.locationFromCfi(location.start.cfi) ?? 0);
          const remaining = Math.max(0, totalLoc - currentLoc);
          // Each location is ~1024 chars by our generate() call.
          const minutes = Math.max(1, Math.round((remaining * 1024) / 1100));
          // Cap chapter estimate to "the rest of the book" — close enough.
          setChapterMinutesLeft(minutes);
        }
      } catch {
        /* noop */
      }
    };

    rendition.on("relocated", onRelocated);
    return () => {
      rendition.off("relocated", onRelocated);
    };
  }, [ready]);

  // ───────────── Keyboard nav (←/→/space/PageUp/PageDown) ─────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const r = renditionRef.current;
      if (!r) return;
      if (e.key === "ArrowRight" || e.key === "PageDown" || (e.key === " " && !e.shiftKey)) {
        e.preventDefault();
        r.next();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp" || (e.key === " " && e.shiftKey)) {
        e.preventDefault();
        r.prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const next = useCallback(() => renditionRef.current?.next(), []);
  const prev = useCallback(() => renditionRef.current?.prev(), []);

  const fireAction = (action: HighlightAction) => {
    if (!selection) return;
    // Page is computed from current location as 1-based location index;
    // the chat panel uses this for citation display.
    const book = bookRef.current;
    let page = 1;
    if (book) {
      try {
        page = Number(book.locations.locationFromCfi(selection.cfi) ?? 0) + 1;
      } catch {
        page = 1;
      }
    }
    onSelectionAction?.(action, page, selection.text, selection.cfi);
    setSelection(null);
    // Clear the selection inside the iframe.
    try {
      const iframes = containerRef.current?.querySelectorAll("iframe");
      iframes?.forEach((f) => f.contentWindow?.getSelection()?.removeAllRanges());
    } catch {
      /* noop */
    }
  };

  const progressPct = Math.max(0, Math.min(100, Math.round(progress * 100)));

  if (!fileUrl) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center">
        <div>
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-2 border-dashed border-[color:var(--color-border-strong)]" />
          <p className="text-sm text-[color:var(--color-ink-soft)]">
            {emptyMessage ?? "No book loaded."}
          </p>
        </div>
      </div>
    );
  }

  const themeBg = THEMES[theme].bg;
  const themeInk = THEMES[theme].ink;

  return (
    <div
      className="relative flex h-full flex-col"
      style={{ "--epub-bg": themeBg, "--epub-ink": themeInk } as CSSProperties}
    >
      {/* Top bar — minimal; the spine carries most of the navigation hints */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[color:var(--color-border)] bg-[color:var(--color-paper)]/60 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-1">
          <PageButton onClick={prev} label="Previous page">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </PageButton>
          <div className="flex min-w-0 items-center gap-2 rounded-full bg-[color:var(--color-paper-3)]/60 px-3 py-1.5">
            <span className="truncate text-xs font-semibold tabular-nums text-[color:var(--color-ink)]">
              {chapterLabel || "Reading"}
            </span>
            {chapterMinutesLeft != null && (
              <>
                <span className="text-[color:var(--color-ink-soft)]">·</span>
                <span className="shrink-0 text-[0.7rem] text-[color:var(--color-ink-soft)]">
                  {chapterMinutesLeft} min left
                </span>
              </>
            )}
          </div>
          <PageButton onClick={next} label="Next page">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </PageButton>
        </div>

        <button
          type="button"
          onClick={() => setTrayOpen((v) => !v)}
          aria-pressed={trayOpen}
          aria-label="Type"
          title="Type"
          className={`grid h-8 w-8 place-items-center rounded-full border-[1.5px] text-[color:var(--color-ink-soft)] transition-colors ${
            trayOpen
              ? "border-[color:var(--color-saffron)] bg-[color:var(--color-saffron)]/10 text-[color:var(--color-saffron-deep)]"
              : "border-[color:var(--color-border)] bg-white/70 hover:border-[color:var(--color-ink-soft)]/40 hover:text-[color:var(--color-ink)]"
          }`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2" />
            <path d="M9 20h6" />
            <path d="M12 4v16" />
          </svg>
        </button>
      </div>

      {/* Book canvas */}
      <div
        className="relative flex-1 overflow-hidden"
        style={{ background: themeBg }}
      >
        {error ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <p className="text-sm text-[color:var(--color-destructive)]">{error}</p>
          </div>
        ) : (
          <>
            <div
              ref={containerRef}
              className="absolute inset-0"
              style={{ paddingRight: "28px" /* room for spine */ }}
            />

            {/* Hover-zones for click-to-page-turn (desktop) */}
            <button
              type="button"
              onClick={prev}
              aria-label="Previous page"
              className="absolute inset-y-0 left-0 hidden w-16 cursor-w-resize md:block"
              style={{ background: "transparent" }}
            />
            <button
              type="button"
              onClick={next}
              aria-label="Next page"
              className="absolute inset-y-0 right-7 hidden w-16 cursor-e-resize md:block"
              style={{ background: "transparent" }}
            />

            {/* The paper spine — vertical progress on the right edge */}
            <Spine progressPct={progressPct} theme={theme} />

            {!ready && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[color:var(--color-saffron)]/15 text-[color:var(--color-saffron-deep)]">
                  <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.2-8.5" />
                  </svg>
                </div>
                <p className="text-sm text-[color:var(--color-ink-soft)]">
                  Setting the type…
                </p>
              </div>
            )}
          </>
        )}

        {/* Selection toolbar — torn-paper slip */}
        {selection && (
          <div
            className="absolute z-30 -translate-x-1/2 -translate-y-full"
            style={{ top: selection.top, left: selection.left }}
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
          >
            <div className="translify-paper-slip">
              <ToolbarBtn onClick={() => fireAction("save")} label={t("viewer.highlight")} tone="saffron"
                icon={
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 11-6 6v3h3l6-6" />
                    <path d="m13 8 6-6 3 3-6 6" />
                  </svg>
                }
              />
              <ToolbarBtn onClick={() => fireAction("note")} label={t("viewer.addNote")} tone="sage"
                icon={
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                }
              />
              <ToolbarBtn onClick={() => fireAction("ask-ai")} label={t("viewer.askAi")} tone="coral"
                icon={
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3.5" />
                    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                  </svg>
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* Type tray — collapsible, slides up from below the top bar */}
      <TypeTray
        open={trayOpen}
        theme={theme}
        setTheme={setTheme}
        fontSize={fontSize}
        setFontSize={setFontSize}
        lineHeight={lineHeight}
        setLineHeight={setLineHeight}
        fontStack={fontStack}
        setFontStack={setFontStack}
      />

      <style jsx global>{`
        /* The mark color is set per-annotation via fill; this just adds the
           subtle "ink soaking into paper" effect via multiply. */
        .translify-epub-mark {
          mix-blend-mode: multiply;
        }

        /* Selection slip — torn-paper feel using mask layers. */
        .translify-paper-slip {
          position: relative;
          display: inline-flex;
          gap: 4px;
          padding: 6px 10px;
          background: #FFFDF5;
          border: 1px solid rgba(74, 60, 30, 0.18);
          border-radius: 4px;
          box-shadow:
            0 1px 0 rgba(74, 60, 30, 0.04),
            0 12px 28px -12px rgba(74, 60, 30, 0.35),
            inset 0 0 0 1px rgba(255, 255, 255, 0.4);
          transform: rotate(-0.6deg);
        }
        .translify-paper-slip::before,
        .translify-paper-slip::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          height: 4px;
          background: inherit;
          /* Torn-paper edge via a noisy SVG mask. Subtle but unmistakable. */
          mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 4' preserveAspectRatio='none'><path d='M0 1 Q 4 0 8 1.5 T 16 0.6 T 24 1.8 T 32 0.2 T 40 1.6 T 48 0.8 T 56 1.2 T 64 0.3 T 72 1.7 T 80 0.5 T 88 1.4 T 96 0.7 T 100 1 V 4 H 0 Z' fill='black'/></svg>");
          mask-size: 100% 100%;
          mask-repeat: no-repeat;
        }
        .translify-paper-slip::before { top: -3px; transform: scaleY(-1); }
        .translify-paper-slip::after  { bottom: -3px; }
      `}</style>
    </div>
  );
}

// ───────────────────────── Sub-components ─────────────────────────

function Spine({ progressPct, theme }: { progressPct: number; theme: Theme }) {
  // The "spine" sits in the 28px gutter on the right edge of the book canvas.
  // It's a vertical paper-textured bar with a saffron progress mark that moves
  // as you read — visually echoing where your bookmark would be in a physical
  // book.
  const spineBg =
    theme === "night"
      ? "linear-gradient(180deg, #2A2622 0%, #1F1B17 100%)"
      : theme === "sepia"
        ? "linear-gradient(180deg, #DCC394 0%, #C9AA77 100%)"
        : "linear-gradient(180deg, #EFE5CF 0%, #D4C29C 100%)";
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-3 right-2 w-3 overflow-hidden rounded-full"
      style={{
        background: spineBg,
        boxShadow: "inset 0 0 0 1px rgba(74, 60, 30, 0.18), inset 2px 0 4px -2px rgba(74, 60, 30, 0.3)",
      }}
    >
      {/* Decorative paper-edge ticks every 10% */}
      {Array.from({ length: 9 }).map((_, i) => (
        <span
          key={i}
          className="absolute left-1/2 h-px w-1.5 -translate-x-1/2 bg-[color:var(--color-ink)]/15"
          style={{ top: `${(i + 1) * 10}%` }}
        />
      ))}
      {/* The bookmark — a tiny saffron flag indicating your position */}
      <span
        className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-sm shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-[top] duration-300"
        style={{
          top: `${progressPct}%`,
          background: "linear-gradient(180deg, #E0A458 0%, #C8893E 100%)",
        }}
      />
    </div>
  );
}

function TypeTray({
  open,
  theme,
  setTheme,
  fontSize,
  setFontSize,
  lineHeight,
  setLineHeight,
  fontStack,
  setFontStack,
}: {
  open: boolean;
  theme: Theme;
  setTheme: (t: Theme) => void;
  fontSize: number;
  setFontSize: (n: number) => void;
  lineHeight: number;
  setLineHeight: (n: number) => void;
  fontStack: string;
  setFontStack: (s: string) => void;
}) {
  return (
    <div
      className={`grid shrink-0 overflow-hidden border-b border-[color:var(--color-border)] bg-[color:var(--color-paper)]/80 backdrop-blur transition-[grid-template-rows] duration-200 ${
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className="min-h-0">
        <div className="flex flex-wrap items-center gap-4 px-4 py-3 text-sm">
          {/* Theme */}
          <div className="flex items-center gap-1.5">
            <span className="text-[0.7rem] uppercase tracking-[0.12em] text-[color:var(--color-ink-soft)]">Paper</span>
            {(["paper", "sepia", "night"] as Theme[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                aria-pressed={theme === t}
                className={`h-6 w-6 rounded-full border-[1.5px] transition-transform ${
                  theme === t ? "scale-110 border-[color:var(--color-ink)]" : "border-[color:var(--color-border)] hover:scale-105"
                }`}
                style={{ background: THEMES[t].bg }}
                title={t}
              />
            ))}
          </div>

          <Divider />

          {/* Size */}
          <div className="flex items-center gap-1.5">
            <span className="text-[0.7rem] uppercase tracking-[0.12em] text-[color:var(--color-ink-soft)]">Size</span>
            <StepBtn
              onClick={() => setFontSize(Math.max(FONT_SIZE_MIN, fontSize - FONT_SIZE_STEP))}
              disabled={fontSize <= FONT_SIZE_MIN}
              label="Smaller"
              symbol="A−"
            />
            <span className="w-12 text-center font-mono text-xs tabular-nums text-[color:var(--color-ink)]">
              {fontSize}%
            </span>
            <StepBtn
              onClick={() => setFontSize(Math.min(FONT_SIZE_MAX, fontSize + FONT_SIZE_STEP))}
              disabled={fontSize >= FONT_SIZE_MAX}
              label="Larger"
              symbol="A+"
            />
          </div>

          <Divider />

          {/* Line height */}
          <div className="flex items-center gap-1.5">
            <span className="text-[0.7rem] uppercase tracking-[0.12em] text-[color:var(--color-ink-soft)]">Leading</span>
            {LINE_HEIGHTS.map((lh) => (
              <button
                key={lh}
                type="button"
                onClick={() => setLineHeight(lh)}
                aria-pressed={lineHeight === lh}
                className={`flex h-6 w-7 flex-col items-center justify-center gap-[2px] rounded-md border-[1.5px] transition-colors ${
                  lineHeight === lh
                    ? "border-[color:var(--color-ink)] bg-[color:var(--color-paper-3)]/70"
                    : "border-[color:var(--color-border)] hover:bg-[color:var(--color-paper-2)]/60"
                }`}
                title={`Line height ${lh}`}
              >
                <span className="h-px w-3 bg-[color:var(--color-ink)]" />
                <span className="h-px w-3 bg-[color:var(--color-ink)]" style={{ marginTop: `${(lh - 1.2) * 4}px` }} />
              </button>
            ))}
          </div>

          <Divider />

          {/* Font family */}
          <div className="flex items-center gap-1.5">
            <span className="text-[0.7rem] uppercase tracking-[0.12em] text-[color:var(--color-ink-soft)]">Type</span>
            <select
              value={fontStack}
              onChange={(e) => setFontStack(e.target.value)}
              className="rounded-full border-[1.5px] border-[color:var(--color-border)] bg-white/70 px-3 py-1 text-xs font-medium text-[color:var(--color-ink)] focus:border-[color:var(--color-saffron)] focus:outline-none"
            >
              {FONT_CHOICES.map((f) => (
                <option key={f.id} value={f.stack}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

function Divider() {
  return <span aria-hidden className="h-5 w-px bg-[color:var(--color-border)]" />;
}

function StepBtn({
  onClick, disabled, label, symbol,
}: { onClick: () => void; disabled?: boolean; label: string; symbol: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid h-6 w-7 place-items-center rounded-md border-[1.5px] border-[color:var(--color-border)] bg-white/70 font-[family-name:var(--font-display)] text-[0.7rem] font-semibold text-[color:var(--color-ink-soft)] transition-colors hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)] disabled:pointer-events-none disabled:opacity-40"
    >
      {symbol}
    </button>
  );
}

function PageButton({
  onClick, disabled, label, children,
}: { onClick: () => void; disabled?: boolean; label: string; children: React.ReactNode }) {
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

function ToolbarBtn({
  onClick, label, icon, tone,
}: { onClick: () => void; label: string; icon: React.ReactNode; tone: "saffron" | "sage" | "coral" }) {
  const toneClass = {
    saffron: "text-[color:var(--color-saffron-deep)] hover:bg-[color:var(--color-saffron)]/15 active:bg-[color:var(--color-saffron)]/25",
    sage: "text-[color:var(--color-sage-deep)] hover:bg-[color:var(--color-sage)]/15 active:bg-[color:var(--color-sage)]/25",
    coral: "text-[color:var(--color-coral-deep)] hover:bg-[color:var(--color-coral)]/15 active:bg-[color:var(--color-coral)]/25",
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      onTouchStart={(e) => e.preventDefault()}
      aria-label={label}
      title={label}
      className={`flex min-h-[40px] touch-manipulation items-center gap-1.5 rounded-md px-3.5 py-2 text-[12px] font-semibold transition-colors sm:min-h-0 sm:px-2.5 sm:py-1 sm:text-[11px] ${toneClass}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// Tiny utility: flatten epubjs navigation tree
function flattenNav(toc: { label: string; href: string; subitems?: unknown[] }[]): { label: string; href: string }[] {
  const out: { label: string; href: string }[] = [];
  const walk = (items: { label: string; href: string; subitems?: unknown[] }[]) => {
    items.forEach((it) => {
      out.push({ label: it.label, href: it.href });
      if (it.subitems && Array.isArray(it.subitems) && it.subitems.length > 0) {
        walk(it.subitems as { label: string; href: string; subitems?: unknown[] }[]);
      }
    });
  };
  walk(toc);
  return out;
}
