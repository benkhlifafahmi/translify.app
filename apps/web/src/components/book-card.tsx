"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteBook, isMediaBook, type Book } from "@/lib/books";
import type { Folder } from "@/lib/folders";
import { formatDuration } from "@/lib/media";
import { useI18n } from "@/lib/i18n";

const STATUS_DOT: Record<Book["status"], string> = {
  uploaded: "bg-[color:var(--color-ink-soft)]/40",
  processing: "bg-[color:var(--color-saffron)] animate-pulse",
  ready: "bg-[color:var(--color-sage)]",
  failed: "bg-[color:var(--color-destructive)]",
};

const STATUS_KEY: Record<Book["status"], string> = {
  uploaded: "bookCard.status.uploaded",
  processing: "bookCard.status.processing",
  ready: "bookCard.status.ready",
  failed: "bookCard.status.failed",
};

const SPINE_TONES = [
  { from: "#F4D6A2", to: "#E0A458", spine: "#C8893E" },
  { from: "#C9DCC8", to: "#7BA17C", spine: "#5F8763" },
  { from: "#F2BAB1", to: "#E2786C", spine: "#C5594D" },
  { from: "#D6CFE5", to: "#9B8FBE", spine: "#6B5B95" },
];

/**
 * One book on the library shelf.
 *
 * Self-contained: it's the drag *source* (drop targets are the folder chips
 * in the toolbar), and it owns a single overflow menu that consolidates every
 * per-book action — move to a folder, open the garden, remove. Keeping all
 * actions behind one "…" keeps the card face calm and the affordances
 * consistent with the rest of the workspace.
 */
export function BookCard({
  book,
  index = 0,
  noteCount = 0,
  folders = [],
  onMove,
}: {
  book: Book;
  index?: number;
  noteCount?: number;
  /** Folders this book can be filed into (current folder already excluded). */
  folders?: Folder[];
  /** Move-to-folder action; null = unfile back to Unsorted. */
  onMove?: (folderId: string | null) => void;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const del = useMutation({
    mutationFn: () => deleteBook(book.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["books"] }),
  });

  const onDelete = () => {
    setMenuOpen(false);
    if (!confirm(t("bookCard.deleteConfirm", { title: book.title }))) return;
    del.mutate();
  };

  const tone = SPINE_TONES[index % SPINE_TONES.length];
  const ready = book.status === "ready";
  const media = isMediaBook(book);
  const href = media ? `/watch/${book.id}` : `/library/${book.id}`;
  const canUnfile = book.folder_id !== null;
  const hasMoveTargets = !!onMove && (canUnfile || folders.length > 0);

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/x-translify-book", book.id);
    setIsDragging(true);
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={() => setIsDragging(false)}
      className="group relative"
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <Link
        href={href}
        className="card-paper relative flex flex-col gap-4 overflow-hidden p-5 transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 hover:shadow-[var(--shadow-paper-lg)]"
      >
        {/* Soft top tint keyed to the book's spine tone. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-20 opacity-60 transition-opacity group-hover:opacity-90"
          style={{ background: `linear-gradient(180deg, ${tone.from}50 0%, transparent 100%)` }}
        />

        <div className="relative flex items-start gap-4">
          {/* Mini book-spine illustration. */}
          <div
            className="relative flex h-20 w-14 shrink-0 flex-col justify-between overflow-hidden rounded-md p-1.5 shadow-[0_8px_18px_-8px_rgba(60,40,15,0.35)] transition-transform duration-200 group-hover:rotate-[-3deg]"
            style={{ background: `linear-gradient(160deg, ${tone.from} 0%, ${tone.to} 100%)` }}
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
            {/* Reserve room on the right so long titles never collide with the "…". */}
            <h3 className="line-clamp-2 pr-7 font-[family-name:var(--font-display)] text-lg font-semibold leading-tight tracking-tight text-[color:var(--color-ink)]">
              {book.title}
            </h3>
            {book.author && (
              <p className="mt-0.5 line-clamp-1 text-sm text-[color:var(--color-ink-soft)]">
                {book.author}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[color:var(--color-ink-soft)]">
              <span className="badge-pill bg-[color:var(--color-paper-3)]/70 text-[color:var(--color-ink-soft)]">
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[book.status]}`} />
                {t(STATUS_KEY[book.status])}
              </span>
              {media
                ? book.duration_seconds != null && (
                    <span className="text-[0.7rem]">{formatDuration(book.duration_seconds)}</span>
                  )
                : book.page_count != null && (
                    <span className="text-[0.7rem]">{book.page_count}p</span>
                  )}
              {noteCount > 0 && (
                <span
                  className="badge-pill bg-[color:var(--color-saffron)]/15 text-[color:var(--color-saffron-deep)]"
                  title={`${noteCount} highlight${noteCount === 1 ? "" : "s"}`}
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 11-6 6v3h3l6-6" />
                    <path d="m13 8 6-6 3 3-6 6" />
                  </svg>
                  {noteCount}
                </span>
              )}
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
            {ready ? t("bookCard.open") : t("bookCard.almostReady")}
          </span>
        </div>
      </Link>

      {/* Single overflow menu — every per-book action lives here. */}
      <button
        type="button"
        aria-label={t("bookCard.more")}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen((o) => !o); }}
        className="absolute end-3 top-3 grid h-7 w-7 place-items-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-paper)]/90 text-[color:var(--color-ink-soft)] opacity-0 backdrop-blur-sm transition-[opacity,color,border-color] duration-150 hover:text-[color:var(--color-ink)] focus-visible:opacity-100 group-hover:opacity-100 data-[open=true]:opacity-100"
        data-open={menuOpen}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
        </svg>
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
          <div
            role="menu"
            className="absolute end-3 top-11 z-40 w-56 overflow-hidden rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)] shadow-[0_14px_36px_-12px_rgba(20,16,8,0.32)] animate-float-in"
          >
            {hasMoveTargets && (
              <>
                <p className="px-3 pb-1 pt-2.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[color:var(--color-ink-soft)]">
                  {t("library.moveTo")}
                </p>
                <ul className="max-h-[38vh] overflow-y-auto pb-1">
                  {canUnfile && (
                    <MenuItem
                      icon={<span className="text-[1.05rem] leading-none">📥</span>}
                      label={t("library.unsorted")}
                      onClick={() => { setMenuOpen(false); onMove?.(null); }}
                    />
                  )}
                  {folders.map((f) => (
                    <MenuItem
                      key={f.id}
                      icon={<span className="text-[1.05rem] leading-none">{f.emoji}</span>}
                      label={f.name}
                      onClick={() => { setMenuOpen(false); onMove?.(f.id); }}
                    />
                  ))}
                </ul>
                <div className="my-1 h-px bg-[color:var(--color-border)]" />
              </>
            )}

            <MenuItem
              icon={<span aria-hidden className="text-[1.05rem] leading-none">🌿</span>}
              label={t("bookCard.garden")}
              onClick={() => { setMenuOpen(false); router.push(`/garden/${book.id}`); }}
            />
            <MenuItem
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                </svg>
              }
              label={del.isPending ? "…" : t("bookCard.remove")}
              onClick={onDelete}
              tone="destructive"
            />
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  tone?: "default" | "destructive";
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-start text-[0.86rem] transition-colors hover:bg-[color:var(--color-paper-2)] ${
        tone === "destructive"
          ? "text-[color:var(--color-destructive)] hover:bg-[color:var(--color-destructive)]/8"
          : "text-[color:var(--color-ink)]"
      }`}
    >
      <span className="grid w-5 shrink-0 place-items-center">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}
