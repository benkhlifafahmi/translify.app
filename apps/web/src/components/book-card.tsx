"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteBook, formatBytes, type Book } from "@/lib/books";

const STATUS_DOT: Record<Book["status"], string> = {
  uploaded: "bg-[color:var(--color-ink-soft)]/40",
  processing: "bg-[color:var(--color-saffron)] animate-pulse",
  ready: "bg-[color:var(--color-sage)]",
  failed: "bg-[color:var(--color-destructive)]",
};

const STATUS_LABEL: Record<Book["status"], string> = {
  uploaded: "Queued",
  processing: "Reading…",
  ready: "Ready",
  failed: "Hit a snag",
};

const SPINE_TONES = [
  { from: "#F4D6A2", to: "#E0A458", spine: "#C8893E" },
  { from: "#C9DCC8", to: "#7BA17C", spine: "#5F8763" },
  { from: "#F2BAB1", to: "#E2786C", spine: "#C5594D" },
  { from: "#D6CFE5", to: "#9B8FBE", spine: "#6B5B95" },
];

export function BookCard({ book, index = 0 }: { book: Book; index?: number }) {
  const queryClient = useQueryClient();
  const del = useMutation({
    mutationFn: () => deleteBook(book.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["books"] }),
  });

  const onDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Remove "${book.title}" from your shelf?`)) return;
    del.mutate();
  };

  const tone = SPINE_TONES[index % SPINE_TONES.length];
  const ready = book.status === "ready";

  return (
    <Link
      href={`/library/${book.id}`}
      className="group card-paper relative flex flex-col gap-4 overflow-hidden p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-paper-lg)]"
    >
      {/* Soft top tint based on tone */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-20 opacity-60 transition-opacity group-hover:opacity-90"
        style={{
          background: `linear-gradient(180deg, ${tone.from}50 0%, transparent 100%)`,
        }}
      />

      <div className="relative flex items-start gap-4">
        {/* Mini book spine illustration */}
        <div
          className="relative flex h-20 w-14 shrink-0 flex-col justify-between overflow-hidden rounded-md p-1.5 shadow-[0_8px_18px_-8px_rgba(60,40,15,0.35)] transition-transform duration-200 group-hover:rotate-[-3deg]"
          style={{
            background: `linear-gradient(160deg, ${tone.from} 0%, ${tone.to} 100%)`,
          }}
        >
          <div className="absolute inset-y-1 left-0 w-1 rounded-r" style={{ background: tone.spine }} />
          <div className="ml-2 space-y-1">
            <div className="h-[2px] w-6 rounded-full bg-white/70" />
            <div className="h-[2px] w-4 rounded-full bg-white/50" />
          </div>
          <div className="ml-2 text-[0.55rem] font-semibold uppercase tracking-widest text-white/80">
            {book.format}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-[family-name:var(--font-display)] text-lg font-semibold leading-tight tracking-tight text-[color:var(--color-ink)]">
            {book.title}
          </h3>
          {book.author && (
            <p className="mt-0.5 line-clamp-1 text-sm text-[color:var(--color-ink-soft)]">
              {book.author}
            </p>
          )}

          <div className="mt-3 flex items-center gap-2 text-xs text-[color:var(--color-ink-soft)]">
            <span className="badge-pill bg-[color:var(--color-paper-3)]/70 text-[color:var(--color-ink-soft)]">
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[book.status]}`} />
              {STATUS_LABEL[book.status]}
            </span>
            {book.page_count != null && (
              <span className="text-[0.7rem]">{book.page_count}p</span>
            )}
            <span className="text-[0.7rem]">{formatBytes(book.file_size_bytes)}</span>
          </div>
        </div>
      </div>

      {book.status === "failed" && book.error_message && (
        <p className="rounded-lg border border-[color:var(--color-destructive)]/25 bg-[color:var(--color-destructive)]/8 px-3 py-2 text-xs text-[color:var(--color-destructive)]">
          {book.error_message}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-dashed border-[color:var(--color-border)] pt-3 text-xs">
        <span className={`font-semibold ${ready ? "text-[color:var(--color-saffron-deep)]" : "text-[color:var(--color-ink-soft)]"}`}>
          {ready ? "Open →" : "Almost ready"}
        </span>
        <button
          type="button"
          onClick={onDelete}
          disabled={del.isPending}
          className="rounded-full px-2 py-1 text-[color:var(--color-ink-soft)] opacity-0 transition-opacity hover:bg-[color:var(--color-destructive)]/10 hover:text-[color:var(--color-destructive)] focus:opacity-100 group-hover:opacity-100 disabled:opacity-50"
          aria-label="Delete book"
        >
          {del.isPending ? "…" : "Remove"}
        </button>
      </div>
    </Link>
  );
}
