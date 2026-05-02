"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export interface Highlight {
  page: number;
  snippet: string;
  nonce: number;
}

interface Props {
  fileUrl: string | null;
  emptyMessage?: string;
  highlight?: Highlight | null;
}

export function PdfViewer({ fileUrl, emptyMessage, highlight }: Props) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [width, setWidth] = useState(720);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setNumPages(null);
    setPage(1);
    setError(null);
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

  const normalizedSnippet = useMemo(() => {
    if (!highlight) return null;
    return _normalize(highlight.snippet);
  }, [highlight]);

  const customTextRenderer = useMemo(() => {
    if (!normalizedSnippet || !highlight || highlight.page !== page) {
      return undefined;
    }
    return ({ str }: { str: string }) => {
      const trimmed = str.trim();
      if (trimmed.length < 3) return _escape(str);
      const candidate = _normalize(trimmed);
      if (candidate.length < 3) return _escape(str);
      if (normalizedSnippet.includes(candidate)) {
        return `<mark class="translify-cite-mark">${_escape(str)}</mark>`;
      }
      return _escape(str);
    };
  }, [normalizedSnippet, highlight, page]);

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

      <div className="flex-1 overflow-auto bg-gradient-to-b from-[color:var(--color-paper-2)]/50 to-[color:var(--color-paper-3)]/40 p-6">
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
                renderTextLayer={!!customTextRenderer}
                customTextRenderer={customTextRenderer}
              />
            </div>
          </Document>
        )}
      </div>
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
