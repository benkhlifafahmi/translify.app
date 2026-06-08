"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { useI18n } from "@/lib/i18n";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Minimal structural view of the parts of pdf.js's document proxy we use.
// Declaring it locally (rather than importing PDFDocumentProxy) avoids a type
// clash between the pdfjs-dist version react-pdf bundles and the one pinned at
// the app level.
interface PdfDoc {
  numPages: number;
  getPage(n: number): Promise<{
    getViewport(opts: { scale: number }): { width: number; height: number };
    getTextContent(): Promise<{ items: Array<{ str?: string; type?: string }> }>;
  }>;
}

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

export type HighlightAction = "save" | "note" | "ask-ai" | "share";

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
  /** Restore-from-progress page — applied once after the doc loads, then ignored. */
  initialPage?: number | null;
  /** Fires whenever the visible page advances to a new high-water mark. */
  onPageReached?: (page: number) => void;
  /** Fires on every page change (forward or backward) — used by the
   *  resume-progress saver. Cheaper than re-deriving from onPageReached
   *  since it doesn't filter by high-water mark. */
  onLocationChange?: (loc: { page: number }) => void;
}

const COLOR_TO_CLASS: Record<SavedHighlightColor, string> = {
  yellow: "translify-hl-yellow",
  green: "translify-hl-green",
  blue: "translify-hl-blue",
  pink: "translify-hl-pink",
};

// US Letter portrait (11/8.5). Used as the page-height estimate for the
// virtual scroll before the real first-page aspect ratio resolves.
const DEFAULT_ASPECT = 11 / 8.5;
// Vertical gap rendered between consecutive pages, in CSS px.
const PAGE_GAP = 18;
// Pages to keep mounted above/below the viewport so scrolling never reveals
// a blank slot before its canvas paints.
const OVERSCAN = 2;

export function PdfViewer({
  fileUrl,
  emptyMessage,
  highlight,
  savedHighlights,
  onSelectionAction,
  onClickSavedHighlight,
  goToPage,
  initialPage,
  onPageReached,
  onLocationChange,
}: Props) {
  const { t } = useI18n();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pdf, setPdf] = useState<PdfDoc | null>(null);
  const [aspect, setAspect] = useState(DEFAULT_ASPECT);
  const [width, setWidth] = useState(720);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [range, setRange] = useState<{ start: number; end: number }>({ start: 1, end: 1 });
  const [selection, setSelection] = useState<
    { text: string; page: number; top: number; left: number } | null
  >(null);

  // ── search state ──
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState(""); // committed, normalized
  const [matches, setMatches] = useState<number[]>([]);
  const [activeMatch, setActiveMatch] = useState(0);
  const [scanning, setScanning] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef(0);
  const restoredRef = useRef(false);
  const anchorPageRef = useRef(1);
  const pageInputFocused = useRef(false);
  const textCacheRef = useRef<Map<number, string>>(new Map());
  const searchRunRef = useRef(0);

  const renderWidth = Math.round(width * zoom);
  const pageH = renderWidth * aspect;
  const slotH = pageH + PAGE_GAP;
  const totalH = numPages ? numPages * slotH + PAGE_GAP : 0;

  // Reset everything when the file changes (translation switch, new book).
  useEffect(() => {
    setNumPages(null);
    setPdf(null);
    setAspect(DEFAULT_ASPECT);
    setCurrentPage(1);
    setPageInput("1");
    setRange({ start: 1, end: 1 });
    setError(null);
    setSelection(null);
    setSearchOpen(false);
    setSearchInput("");
    setQuery("");
    setMatches([]);
    setActiveMatch(0);
    setScanning(false);
    textCacheRef.current.clear();
    searchRunRef.current += 1;
    restoredRef.current = false;
    anchorPageRef.current = 1;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [fileUrl]);

  // Track the available render width from the scroll viewport.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setWidth(Math.max(280, el.clientWidth - 48));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fileUrl]);

  // Recompute the mounted window + current page from the scroll offset.
  const recompute = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !numPages) return;
    const st = el.scrollTop;
    const vh = el.clientHeight;
    const first = Math.max(1, Math.floor((st - PAGE_GAP) / slotH) + 1);
    const last = Math.min(numPages, Math.floor((st + vh) / slotH) + 1);
    setRange((prev) => {
      const start = Math.max(1, first - OVERSCAN);
      const end = Math.min(numPages, last + OVERSCAN);
      return prev.start === start && prev.end === end ? prev : { start, end };
    });
    // The page under the viewport's vertical centre.
    const center = st + vh / 2;
    const cp = Math.min(numPages, Math.max(1, Math.floor((center - PAGE_GAP) / slotH) + 1));
    anchorPageRef.current = cp;
    setCurrentPage((prev) => (prev === cp ? prev : cp));
  }, [numPages, slotH]);

  const onScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      recompute();
    });
  }, [recompute]);

  // Re-run when the document loads or the layout metrics change.
  useEffect(() => {
    recompute();
  }, [recompute]);

  // Keep the current page pinned when the slot height changes (zoom / resize),
  // so zooming doesn't fling the reader to a different part of the book.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !numPages) return;
    el.scrollTop = (anchorPageRef.current - 1) * slotH + PAGE_GAP;
  }, [slotH, numPages]);

  // Page-reached + location-change signals (1-indexed).
  useEffect(() => {
    if (currentPage > 0) onPageReached?.(currentPage);
  }, [currentPage, onPageReached]);
  useEffect(() => {
    if (currentPage > 0) onLocationChange?.({ page: currentPage });
  }, [currentPage, onLocationChange]);

  // Keep the page-number input in sync unless the user is editing it.
  useEffect(() => {
    if (!pageInputFocused.current) setPageInput(String(currentPage));
  }, [currentPage]);

  const scrollToPage = useCallback(
    (p: number, smooth = true) => {
      const el = scrollRef.current;
      if (!el || !numPages) return;
      const target = Math.min(numPages, Math.max(1, Math.round(p)));
      anchorPageRef.current = target;
      el.scrollTo({ top: (target - 1) * slotH + PAGE_GAP, behavior: smooth ? "smooth" : "auto" });
    },
    [numPages, slotH],
  );

  // One-shot restore of saved reading position.
  useEffect(() => {
    if (restoredRef.current) return;
    if (!numPages) return;
    restoredRef.current = true;
    if (initialPage && initialPage > 1) {
      // Defer one frame so the virtual height is in place before we jump.
      requestAnimationFrame(() => scrollToPage(initialPage, false));
    }
  }, [numPages, initialPage, scrollToPage]);

  // Jump to a chat citation.
  useEffect(() => {
    if (!highlight || !numPages) return;
    scrollToPage(highlight.page, true);
  }, [highlight, numPages, scrollToPage]);

  // Jump driven by the sidebar (saved-highlight "go to page").
  useEffect(() => {
    if (!goToPage || !numPages) return;
    scrollToPage(goToPage.page, true);
  }, [goToPage, numPages, scrollToPage]);

  const onDocLoad = useCallback((doc: PdfDoc) => {
    setNumPages(doc.numPages);
    setPdf(doc);
    setError(null);
    doc
      .getPage(1)
      .then((pg) => {
        const vp = pg.getViewport({ scale: 1 });
        if (vp.width > 0) setAspect(vp.height / vp.width);
      })
      .catch(() => {});
  }, []);

  // ── search ──
  const runSearch = useCallback(
    async (raw: string) => {
      const norm = raw.trim().toLowerCase();
      setQuery(norm);
      setActiveMatch(0);
      setMatches([]);
      if (!pdf || !numPages || norm.length < 2) {
        setScanning(false);
        return;
      }
      const runId = ++searchRunRef.current;
      setScanning(true);
      const found: number[] = [];
      for (let p = 1; p <= numPages; p++) {
        if (searchRunRef.current !== runId) return; // superseded / cancelled
        let text = textCacheRef.current.get(p);
        if (text == null) {
          try {
            const page = await pdf.getPage(p);
            const tc = await page.getTextContent();
            text = tc.items
              .map((it) => it.str ?? "")
              .join(" ")
              .toLowerCase();
          } catch {
            text = "";
          }
          textCacheRef.current.set(p, text);
        }
        if (text.includes(norm)) {
          found.push(p);
          if (found.length === 1) {
            // Surface + jump to the first hit immediately.
            setMatches([p]);
            setActiveMatch(0);
            scrollToPage(p, true);
          } else if (found.length % 8 === 0) {
            setMatches([...found]);
          }
        }
      }
      if (searchRunRef.current === runId) {
        setMatches([...found]);
        setScanning(false);
      }
    },
    [pdf, numPages, scrollToPage],
  );

  // Debounced search-as-you-type, decoupled from runSearch's identity so a
  // zoom mid-search doesn't restart the scan.
  const runSearchRef = useRef(runSearch);
  useEffect(() => {
    runSearchRef.current = runSearch;
  });
  useEffect(() => {
    if (!searchOpen) return;
    const id = window.setTimeout(() => runSearchRef.current(searchInput), 350);
    return () => window.clearTimeout(id);
  }, [searchInput, searchOpen]);

  const gotoMatch = useCallback(
    (idx: number) => {
      if (!matches.length) return;
      const n = ((idx % matches.length) + matches.length) % matches.length;
      setActiveMatch(n);
      scrollToPage(matches[n], true);
    },
    [matches, scrollToPage],
  );

  const closeSearch = useCallback(() => {
    searchRunRef.current += 1;
    setSearchOpen(false);
    setSearchInput("");
    setQuery("");
    setMatches([]);
    setActiveMatch(0);
    setScanning(false);
  }, []);

  const commitPageInput = useCallback(() => {
    const n = parseInt(pageInput, 10);
    if (!Number.isNaN(n) && numPages) {
      scrollToPage(Math.min(numPages, Math.max(1, n)), true);
    } else {
      setPageInput(String(currentPage));
    }
  }, [pageInput, numPages, currentPage, scrollToPage]);

  // Build the per-page text renderer for marks (saved highlights, citation,
  // live search). Returns undefined when a page has nothing to mark, so most
  // pages keep a stable prop and don't re-render their text layer on scroll.
  const makeTextRenderer = useCallback(
    (pageNumber: number) => {
      const saved = (savedHighlights ?? [])
        .filter((h) => h.page === pageNumber)
        .map((h) => ({ ...h, normalized: _normalize(h.text) }))
        .filter((h) => h.normalized.length >= 3);
      const cite =
        highlight && highlight.page === pageNumber ? _normalize(highlight.snippet) : null;
      const citeN = cite && cite.length >= 3 ? cite : null;
      const q = query.length >= 2 ? query : null;
      // Only attach the search renderer to pages that actually contain the term
      // (per the scan cache) so scrolling during a search doesn't re-render
      // every visible page's text layer. Un-scanned pages default to true.
      const searchPage = q ? (textCacheRef.current.get(pageNumber)?.includes(q) ?? true) : false;
      if (!saved.length && !citeN && !searchPage) return undefined;
      return ({ str }: { str: string }) => {
        const trimmed = str.trim();
        const candidate = _normalize(trimmed);
        if (candidate.length >= 3) {
          const match = saved.find((h) => h.normalized.includes(candidate));
          if (match) {
            const cls = COLOR_TO_CLASS[match.color];
            const noteDot = match.hasNote ? " has-note" : "";
            return `<mark class="translify-saved-mark ${cls}${noteDot}" data-hl-id="${_escape(match.id)}">${_escape(str)}</mark>`;
          }
          if (citeN && citeN.includes(candidate)) {
            return `<mark class="translify-cite-mark">${_escape(str)}</mark>`;
          }
        }
        if (q && searchPage && trimmed.toLowerCase().includes(q)) {
          return _markSearch(str, q);
        }
        return _escape(str);
      };
    },
    [savedHighlights, highlight, query],
  );

  // Click delegation for saved-highlight marks.
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

  // Text-selection → floating toolbar. selectionchange covers desktop drag
  // and mobile long-press-drag alike; debounced so we land after the gesture.
  useEffect(() => {
    let timer: number | null = null;
    const finalize = () => {
      const wrap = scrollRef.current;
      if (!wrap) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        setSelection(null);
        return;
      }
      const sRange = sel.getRangeAt(0);
      if (!wrap.contains(sRange.commonAncestorContainer)) return;
      const text = sel.toString().trim();
      if (text.length < 2) {
        setSelection(null);
        return;
      }
      // Which page did the selection land on?
      let node: Node | null = sRange.commonAncestorContainer;
      let pageEl: HTMLElement | null = null;
      while (node) {
        if (node instanceof HTMLElement && node.dataset.page) {
          pageEl = node;
          break;
        }
        node = node.parentNode;
      }
      const pageNum = pageEl ? parseInt(pageEl.dataset.page!, 10) : currentPage;
      const rect = sRange.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();
      setSelection({
        text,
        page: pageNum,
        top: rect.top - wrapRect.top + wrap.scrollTop,
        left: rect.left - wrapRect.left + rect.width / 2 + wrap.scrollLeft,
      });
    };
    const onSelChange = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(finalize, 180);
    };
    document.addEventListener("selectionchange", onSelChange);
    return () => {
      if (timer) window.clearTimeout(timer);
      document.removeEventListener("selectionchange", onSelChange);
    };
  }, [currentPage]);

  // Dismiss the toolbar on outside tap/click.
  useEffect(() => {
    if (!selection) return;
    const onOutsidePointer = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-translify-selection-toolbar]")) return;
      const wrap = scrollRef.current;
      if (wrap && target && wrap.contains(target)) return;
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
    onSelectionAction?.(action, selection.page, selection.text);
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

  const visiblePages: number[] = [];
  if (numPages) {
    for (let i = range.start; i <= range.end; i++) visiblePages.push(i);
  }

  const searchStatus = scanning
    ? t("viewer.search.searching") || "Searching…"
    : matches.length
      ? `${activeMatch + 1} / ${matches.length}`
      : query
        ? t("viewer.search.noResults") || "No results"
        : "";

  return (
    <div className="flex h-full flex-col">
      {/* ── Toolbar ── */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[color:var(--color-border)] bg-[color:var(--color-paper)]/60 px-3 py-2 backdrop-blur">
        <div className="flex items-center gap-1">
          <IconButton
            onClick={() => scrollToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            label={t("viewer.prevPage") || "Previous page"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m18 15-6-6-6 6" />
            </svg>
          </IconButton>
          <div className="flex items-center gap-1 rounded-full bg-[color:var(--color-paper-3)]/60 px-2.5 py-1.5 text-xs font-semibold tabular-nums text-[color:var(--color-ink)]">
            <input
              value={pageInput}
              inputMode="numeric"
              aria-label={t("viewer.pageNumber") || "Page number"}
              onFocus={(e) => {
                pageInputFocused.current = true;
                e.currentTarget.select();
              }}
              onBlur={() => {
                pageInputFocused.current = false;
                commitPageInput();
              }}
              onChange={(e) => setPageInput(e.target.value.replace(/[^0-9]/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              className="w-9 bg-transparent text-center tabular-nums outline-none focus:text-[color:var(--color-saffron-deep)]"
            />
            <span className="text-[color:var(--color-ink-soft)]">/</span>
            <span className="text-[color:var(--color-ink-soft)]">{numPages ?? "—"}</span>
          </div>
          <IconButton
            onClick={() => scrollToPage(currentPage + 1)}
            disabled={!numPages || currentPage >= numPages}
            label={t("viewer.nextPage") || "Next page"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </IconButton>
        </div>

        <div className="flex items-center gap-1">
          <IconButton
            onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
            active={searchOpen}
            label={t("viewer.search.label") || "Search in book"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </IconButton>
          <span aria-hidden className="mx-1 h-5 w-px bg-[color:var(--color-border)]" />
          <IconButton
            onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(2)))}
            disabled={zoom <= 0.6}
            label={t("viewer.zoomOut") || "Zoom out"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
            </svg>
          </IconButton>
          <span className="hidden rounded-full bg-[color:var(--color-paper-3)]/60 px-2.5 py-1.5 text-[0.7rem] font-semibold tabular-nums text-[color:var(--color-ink-soft)] sm:inline">
            {Math.round(zoom * 100)}%
          </span>
          <IconButton
            onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))}
            disabled={zoom >= 2}
            label={t("viewer.zoomIn") || "Zoom in"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5v14" />
            </svg>
          </IconButton>
        </div>
      </div>

      {/* ── Search bar ── */}
      {searchOpen && (
        <div className="flex shrink-0 items-center gap-2 border-b border-[color:var(--color-border)] bg-[color:var(--color-paper-2)]/50 px-3 py-2">
          <svg className="shrink-0 text-[color:var(--color-ink-soft)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            autoFocus
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (matches.length) gotoMatch(activeMatch + (e.shiftKey ? -1 : 1));
                else runSearchRef.current(searchInput);
              } else if (e.key === "Escape") {
                closeSearch();
              }
            }}
            placeholder={t("viewer.search.placeholder") || "Search in book"}
            className="min-w-0 flex-1 bg-transparent text-sm text-[color:var(--color-ink)] outline-none placeholder:text-[color:var(--color-ink-soft)]"
          />
          <span className="shrink-0 text-xs tabular-nums text-[color:var(--color-ink-soft)]">
            {searchStatus}
          </span>
          <IconButton
            onClick={() => gotoMatch(activeMatch - 1)}
            disabled={!matches.length}
            label={t("viewer.search.prev") || "Previous match"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m18 15-6-6-6 6" />
            </svg>
          </IconButton>
          <IconButton
            onClick={() => gotoMatch(activeMatch + 1)}
            disabled={!matches.length}
            label={t("viewer.search.next") || "Next match"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </IconButton>
          <IconButton onClick={closeSearch} label={t("viewer.search.close") || "Close search"}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </IconButton>
        </div>
      )}

      {/* ── Scrollable page stream ── */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        onClick={onPageClick}
        className="relative flex-1 overflow-auto bg-gradient-to-b from-[color:var(--color-paper-2)]/50 to-[color:var(--color-paper-3)]/40"
      >
        {error ? (
          <p className="p-6 text-sm text-[color:var(--color-destructive)]">{error}</p>
        ) : (
          <Document
            file={fileUrl}
            onLoadSuccess={onDocLoad}
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
            <div style={{ position: "relative", height: totalH, width: "100%" }}>
              {visiblePages.map((i) => (
                <div
                  key={i}
                  data-page={i}
                  className="absolute left-0 right-0 flex justify-center"
                  style={{ top: (i - 1) * slotH + PAGE_GAP, height: pageH }}
                >
                  <Page
                    pageNumber={i}
                    width={renderWidth}
                    renderAnnotationLayer={false}
                    renderTextLayer
                    customTextRenderer={makeTextRenderer(i)}
                    loading={
                      <div
                        className="translify-page-skeleton"
                        style={{ width: renderWidth, height: pageH }}
                      />
                    }
                  />
                </div>
              ))}
            </div>
          </Document>
        )}

        {selection && (
          <div
            data-translify-selection-toolbar
            className="absolute z-20 -translate-x-1/2 -translate-y-full"
            style={{ top: Math.max(0, selection.top - 8), left: selection.left }}
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
              <ToolbarButton
                onClick={() => triggerAction("share")}
                label={t("viewer.share")}
                tone="plum"
                icon={
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
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
        .translify-saved-mark,
        .translify-search-mark {
          color: transparent;
          border-radius: 2px;
          padding: 0 1px;
          mix-blend-mode: multiply;
        }
        .translify-cite-mark {
          background-color: rgba(224, 164, 88, 0.55);
        }
        .translify-search-mark {
          background-color: rgba(96, 165, 250, 0.5);
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
        .translify-page-skeleton {
          border-radius: 4px;
          background: linear-gradient(180deg, #fffdf6 0%, var(--color-paper-2) 100%);
          box-shadow: 0 8px 24px -16px rgba(60, 40, 10, 0.5);
        }
      `}</style>
    </div>
  );
}

function IconButton({
  onClick,
  disabled,
  label,
  active,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 place-items-center rounded-full border-[1.5px] transition-all hover:-translate-y-[1px] disabled:pointer-events-none disabled:opacity-40 ${
        active
          ? "border-[color:var(--color-saffron)] bg-[color:var(--color-saffron)]/15 text-[color:var(--color-saffron-deep)]"
          : "border-[color:var(--color-border)] bg-white/70 text-[color:var(--color-ink-soft)] hover:border-[color:var(--color-ink-soft)]/40 hover:bg-white hover:text-[color:var(--color-ink)]"
      }`}
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
  tone: "saffron" | "sage" | "coral" | "plum";
}) {
  const toneClass = {
    saffron: "text-[color:var(--color-saffron-deep)] hover:bg-[color:var(--color-saffron)]/15 active:bg-[color:var(--color-saffron)]/25",
    sage: "text-[color:var(--color-sage-deep)] hover:bg-[color:var(--color-sage)]/15 active:bg-[color:var(--color-sage)]/25",
    coral: "text-[color:var(--color-coral-deep)] hover:bg-[color:var(--color-coral)]/15 active:bg-[color:var(--color-coral)]/25",
    plum: "text-[color:var(--color-plum)] hover:bg-[color:var(--color-plum)]/15 active:bg-[color:var(--color-plum)]/25",
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

// Wrap every occurrence of `q` (already lowercased) inside `str` with a search
// mark, escaping the surrounding text. Returns an HTML string for the text layer.
function _markSearch(str: string, q: string): string {
  const lower = str.toLowerCase();
  let out = "";
  let i = 0;
  while (i < str.length) {
    const idx = lower.indexOf(q, i);
    if (idx === -1) {
      out += _escape(str.slice(i));
      break;
    }
    out += _escape(str.slice(i, idx));
    out += `<mark class="translify-search-mark">${_escape(str.slice(idx, idx + q.length))}</mark>`;
    i = idx + q.length;
  }
  return out;
}
