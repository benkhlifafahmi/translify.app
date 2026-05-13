"use client";

import { useState } from "react";
import { BookCard } from "@/components/book-card";
import { Lumi } from "@/components/lumi/lumi";
import type { Book } from "@/lib/books";
import type { Folder } from "@/lib/folders";

/**
 * One "shelf" — a folder header + a horizontal strip of book cards.
 *
 * Acts as a drag-and-drop drop-target: dragging a book card onto this
 * shelf calls ``onDropBook(bookId)`` with the parent's mutation. The
 * parent is responsible for the actual move + cache invalidation.
 *
 * Folders without books still render so users can see their organisation
 * scaffold; the empty state offers a soft drop hint instead of pretending
 * the folder isn't there.
 */
interface Props {
  /** ``null`` = the synthetic "Unsorted" shelf. */
  folder: Folder | null;
  books: Book[];
  noteCountsByBook: Record<string, number>;
  onEditFolder?: (folder: Folder) => void;
  onDropBook: (bookId: string) => void;
  /** Move-to-folder action surfaced from each book card's "..." menu. */
  onMoveBook: (bookId: string, targetFolderId: string | null) => void;
  /** All other folders this book could be moved into (excluding the current one). */
  otherFolders: Folder[];
}

export type ColorToken = {
  gradient: string;
  ring: string;
  ink: string;
  badgeBg: string;
};

/** Translate a folder colour token into a gradient + ring + ink pair. Used
 *  by both the shelf header and the folder editor. */
export function folderColorToken(color: string): ColorToken {
  const t: Record<string, ColorToken> = {
    saffron: { gradient: "linear-gradient(135deg,#F4D6A2,#D09040)",  ring: "#D09040", ink: "var(--color-saffron-deep)", badgeBg: "rgba(224,164,80,0.18)" },
    sage:    { gradient: "linear-gradient(135deg,#C9DCC8,#5A8C5A)",  ring: "#5A8C5A", ink: "var(--color-sage-deep)",    badgeBg: "rgba(123,161,124,0.18)" },
    plum:    { gradient: "linear-gradient(135deg,#D6CFE5,#6B5B95)",  ring: "#6B5B95", ink: "var(--color-plum)",          badgeBg: "rgba(107,91,149,0.18)" },
    coral:   { gradient: "linear-gradient(135deg,#F2BAB1,#C0604A)",  ring: "#C0604A", ink: "var(--color-coral-deep)",    badgeBg: "rgba(226,120,108,0.18)" },
    ink:     { gradient: "linear-gradient(135deg,#5C5C70,#20283A)",  ring: "#20283A", ink: "#20283A",                    badgeBg: "rgba(32,40,58,0.18)" },
    ocean:   { gradient: "linear-gradient(135deg,#A6CBD8,#3F6F86)",  ring: "#3F6F86", ink: "#2F546A",                    badgeBg: "rgba(63,111,134,0.18)" },
    rose:    { gradient: "linear-gradient(135deg,#F8C8D6,#B85775)",  ring: "#B85775", ink: "#9A3F5C",                    badgeBg: "rgba(184,87,117,0.18)" },
    honey:   { gradient: "linear-gradient(135deg,#FBE08C,#C99325)",  ring: "#C99325", ink: "#8E6710",                    badgeBg: "rgba(201,147,37,0.20)" },
  };
  return t[color] ?? t.saffron;
}

export function FolderShelf({
  folder,
  books,
  noteCountsByBook,
  onEditFolder,
  onDropBook,
  onMoveBook,
  otherFolders,
}: Props) {
  const [isDragOver, setIsDragOver] = useState(false);

  const token = folder ? folderColorToken(folder.color) : null;
  const isUnsorted = folder === null;

  const onDragOver = (e: React.DragEvent) => {
    // Accept the drop only if it's actually one of our book cards.
    if (e.dataTransfer.types.includes("application/x-translify-book")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (!isDragOver) setIsDragOver(true);
    }
  };

  const onDragLeave = (e: React.DragEvent) => {
    // Only clear if the cursor actually left the shelf, not when crossing
    // over a child element.
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const bookId = e.dataTransfer.getData("application/x-translify-book");
    if (!bookId) return;
    // Don't fire the move if the book was already in this shelf.
    const alreadyHere = books.some((b) => b.id === bookId);
    if (alreadyHere) return;
    onDropBook(bookId);
  };

  return (
    <section
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className="relative overflow-hidden rounded-3xl border-2 transition-all"
      style={{
        borderColor: isDragOver
          ? token?.ring ?? "var(--color-saffron-deep)"
          : "var(--color-border)",
        background: "white",
        boxShadow: isDragOver
          ? `0 0 0 4px ${token?.ring ?? "var(--color-saffron-deep)"}22, 0 6px 0 rgba(74,60,30,0.10)`
          : "0 4px 0 rgba(74,60,30,0.08)",
      }}
    >
      {/* Header — colour band + cover, emoji, name, book count, edit button. */}
      {isUnsorted ? (
        <header className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl text-[1.3rem]" style={{ background: "var(--color-paper-3)" }}>
              📥
            </span>
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-[1.1rem] font-semibold tracking-tight" style={{ color: "var(--color-ink)" }}>
                Unsorted
              </h2>
              <p className="text-[0.78rem]" style={{ color: "var(--color-ink-soft)" }}>
                Drop books into a folder below to file them, or leave them here.
              </p>
            </div>
          </div>
          <span className="rounded-full px-3 py-1 text-[0.74rem] font-bold" style={{ background: "var(--color-paper-3)", color: "var(--color-ink-soft)" }}>
            {books.length}
          </span>
        </header>
      ) : (
        <header
          className="relative px-5 py-4"
          style={{
            background: folder!.cover_url
              ? `center/cover no-repeat url("${folder!.cover_url}"), ${token!.gradient}`
              : token!.gradient,
          }}
        >
          {folder!.cover_url && (
            <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.35) 100%)" }} />
          )}
          <div className="relative flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/85 text-[1.4rem] shadow-md backdrop-blur-sm">
                {folder!.emoji}
              </span>
              <div className="min-w-0">
                <h2 className="truncate font-[family-name:var(--font-display)] text-[1.15rem] font-semibold tracking-tight text-white drop-shadow-md">
                  {folder!.name}
                </h2>
                <p className="text-[0.78rem] text-white/85">
                  {books.length === 0 ? "Empty — drop a book in" : `${books.length} book${books.length === 1 ? "" : "s"}`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onEditFolder?.(folder!)}
              aria-label="Edit folder"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/85 text-[color:var(--color-ink)] backdrop-blur-sm transition-all active:scale-90"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
              </svg>
            </button>
          </div>
        </header>
      )}

      {/* Book strip — drag-over hint covers this when active. */}
      <div className="relative p-4">
        {isDragOver && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-2 grid place-items-center rounded-2xl border-2 border-dashed text-[0.88rem] font-semibold animate-float-in"
            style={{
              borderColor: token?.ring ?? "var(--color-saffron-deep)",
              background: token?.badgeBg ?? "rgba(224,164,80,0.10)",
              color: token?.ink ?? "var(--color-saffron-deep)",
            }}
          >
            Drop to {isUnsorted ? "unfile" : `move to ${folder!.name}`}
          </div>
        )}

        {books.length === 0 ? (
          <EmptyShelfState isUnsorted={isUnsorted} folderName={folder?.name} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book, i) => (
              <DraggableBookCard
                key={book.id}
                book={book}
                index={i}
                noteCount={noteCountsByBook[book.id] ?? 0}
                otherFolders={otherFolders.filter((f) => f.id !== book.folder_id)}
                currentFolderId={book.folder_id}
                onMove={(folderId) => onMoveBook(book.id, folderId)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyShelfState({ isUnsorted, folderName }: { isUnsorted: boolean; folderName?: string }) {
  return (
    <div className="grid place-items-center gap-2 py-8 text-center">
      <Lumi state="sleepy" size={56} animate />
      <p className="text-[0.86rem]" style={{ color: "var(--color-ink-soft)" }}>
        {isUnsorted
          ? "Everything is filed away — nice work."
          : `${folderName ?? "This folder"} is waiting — drop a book in from another shelf.`}
      </p>
    </div>
  );
}

/**
 * BookCard wrapper that exposes drag-source behaviour and a "..." move-to
 * menu. The menu doubles as the mobile path since touch devices don't
 * dispatch native drag events.
 */
function DraggableBookCard({
  book,
  index,
  noteCount,
  otherFolders,
  currentFolderId,
  onMove,
}: {
  book: Book;
  index: number;
  noteCount: number;
  otherFolders: Folder[];
  currentFolderId: string | null;
  onMove: (folderId: string | null) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/x-translify-book", book.id);
    setIsDragging(true);
  };
  const onDragEnd = () => setIsDragging(false);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="group relative"
      style={{ opacity: isDragging ? 0.4 : 1, cursor: "grab" }}
    >
      <BookCard book={book} index={index} noteCount={noteCount} />

      {/* Move-to-folder menu — tap on the dots, primarily for mobile. */}
      <button
        type="button"
        aria-label="Move to folder"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen((o) => !o); }}
        className="absolute end-3 top-3 grid h-7 w-7 place-items-center rounded-full opacity-0 transition-all group-hover:opacity-100 focus:opacity-100"
        style={{ background: "white", color: "var(--color-ink)", border: "1.5px solid var(--color-border)", boxShadow: "0 2px 0 rgba(74,60,30,0.10)" }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
        </svg>
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
          <div
            role="menu"
            className="absolute end-3 top-12 z-40 w-56 overflow-hidden rounded-xl border-2 animate-float-in"
            style={{ background: "white", borderColor: "var(--color-border-strong)", boxShadow: "0 10px 30px -10px rgba(20,16,8,0.30)" }}
          >
            <p className="px-3 py-2 text-[0.7rem] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--color-ink-soft)", borderBottom: "1px solid var(--color-border)" }}>
              Move to
            </p>
            <ul className="max-h-[40vh] overflow-y-auto py-1">
              {currentFolderId !== null && (
                <li>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onMove(null); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-start text-[0.86rem] transition-colors hover:bg-[color:var(--color-paper-3)]"
                    style={{ color: "var(--color-ink)" }}
                  >
                    <span className="text-[1.05rem]">📥</span> Unsorted
                  </button>
                </li>
              )}
              {otherFolders.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onMove(f.id); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-start text-[0.86rem] transition-colors hover:bg-[color:var(--color-paper-3)]"
                    style={{ color: "var(--color-ink)" }}
                  >
                    <span className="text-[1.05rem]">{f.emoji}</span>
                    <span className="truncate">{f.name}</span>
                  </button>
                </li>
              ))}
              {otherFolders.length === 0 && currentFolderId === null && (
                <li className="px-3 py-3 text-[0.82rem]" style={{ color: "var(--color-ink-soft)" }}>
                  Create a folder first to move this book into one.
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
