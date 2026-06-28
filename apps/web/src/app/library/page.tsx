"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookCard } from "@/components/book-card";
import { UploadButton } from "@/components/upload-button";
import { YouTubeImportButton } from "@/components/youtube-import-button";
import { TrialBanner } from "@/components/trial-banner";
import { ConversionModal } from "@/components/conversion-modal";
import { FolderEditor } from "@/components/folder-editor";
import { LibrarySidebar, type LibraryView } from "@/components/library/library-sidebar";
import { me, logout, type User } from "@/lib/auth";
import { listBooks, moveBookToFolder, type Book } from "@/lib/books";
import { listFolders, type Folder } from "@/lib/folders";
import {
  listAllHighlights,
  HIGHLIGHT_COLOR_CLASS,
  type Highlight,
} from "@/lib/highlights";
import { listBookProgress, type BookProgressListItem } from "@/lib/progress";
import { getToken } from "@/lib/api";
import { Lumi } from "@/components/lumi/lumi";
import { LumiGuide } from "@/components/lumi/lumi-guide";
import { useLumi } from "@/components/lumi/lumi-context";
import { MilestoneToast } from "@/components/milestone-toast";
import { useI18n } from "@/lib/i18n";

type SortKey = "recent" | "added" | "title";

const SPINE_TONES = [
  { from: "#F4D6A2", to: "#E0A458", spine: "#C8893E" },
  { from: "#C9DCC8", to: "#7BA17C", spine: "#5F8763" },
  { from: "#F2BAB1", to: "#E2786C", spine: "#C5594D" },
  { from: "#D6CFE5", to: "#9B8FBE", spine: "#6B5B95" },
];

export default function LibraryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !getToken()) router.replace("/login");
  }, [mounted, router]);

  const enabled = mounted && !!getToken();

  const { data: user, isLoading: userLoading, isError: userError } = useQuery<User>({
    queryKey: ["me"],
    queryFn: me,
    enabled,
  });

  const { data: books, isLoading: booksLoading } = useQuery<Book[]>({
    queryKey: ["books"],
    queryFn: listBooks,
    enabled,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      const anyPending = data.some((b) => b.status === "uploaded" || b.status === "processing");
      return anyPending ? 3000 : false;
    },
  });

  const { data: folders } = useQuery<Folder[]>({
    queryKey: ["folders"],
    queryFn: listFolders,
    enabled,
  });

  const { data: highlights } = useQuery<Highlight[]>({
    queryKey: ["highlights", "all"],
    queryFn: listAllHighlights,
    enabled,
  });

  const { data: progress } = useQuery<BookProgressListItem[]>({
    queryKey: ["book-progress", "all"],
    queryFn: listBookProgress,
    enabled,
  });

  const noteCountsByBook = useMemo(() => (
    (highlights ?? []).reduce<Record<string, number>>((acc, h) => {
      acc[h.book_id] = (acc[h.book_id] ?? 0) + 1;
      return acc;
    }, {})
  ), [highlights]);

  const recentHighlights = (highlights ?? []).slice(0, 6);
  const bookTitleById = useMemo(
    () => Object.fromEntries((books ?? []).map((b) => [b.id, b.title] as const)),
    [books],
  );
  const bookById = useMemo(
    () => Object.fromEntries((books ?? []).map((b) => [b.id, b] as const)),
    [books],
  );
  const lastReadByBook = useMemo(
    () => Object.fromEntries((progress ?? []).map((p) => [p.book_id, p.last_read_at] as const)),
    [progress],
  );

  const continueItems = useMemo(() => {
    if (!progress || !books) return [];
    return progress
      .map((p) => ({ progress: p, book: bookById[p.book_id] }))
      .filter((x): x is { progress: BookProgressListItem; book: Book } =>
        !!x.book && x.book.status === "ready",
      )
      .slice(0, 6);
  }, [progress, books, bookById]);

  // ── View + find state ───────────────────────────────────────────────────
  const [view, setView] = useState<LibraryView>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [mobileNav, setMobileNav] = useState(false);

  const orderedFolders = useMemo(
    () => (folders ?? []).slice().sort((a, b) => a.position - b.position || a.name.localeCompare(b.name)),
    [folders],
  );

  const countByFolder = useMemo(() => {
    const m: Record<string, number> = { all: 0, unsorted: 0 };
    for (const b of books ?? []) {
      m.all += 1;
      const k = b.folder_id ?? "unsorted";
      m[k] = (m[k] ?? 0) + 1;
    }
    return m;
  }, [books]);

  // A view pointing at a deleted folder falls back to "all".
  useEffect(() => {
    if (view === "all" || view === "unsorted") return;
    if (folders && !folders.some((f) => f.id === view)) setView("all");
  }, [folders, view]);

  const activeFolder = view !== "all" && view !== "unsorted"
    ? orderedFolders.find((f) => f.id === view) ?? null
    : null;

  const visibleBooks = useMemo(() => {
    let list = books ?? [];
    if (view === "unsorted") list = list.filter((b) => !b.folder_id);
    else if (view !== "all") list = list.filter((b) => b.folder_id === view);

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (b) => b.title.toLowerCase().includes(q) || (b.author ?? "").toLowerCase().includes(q),
      );
    }

    return [...list].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "added") return b.created_at.localeCompare(a.created_at);
      const ra = lastReadByBook[a.id] ?? a.created_at;
      const rb = lastReadByBook[b.id] ?? b.created_at;
      return rb.localeCompare(ra);
    });
  }, [books, view, query, sort, lastReadByBook]);

  const moveBook = useMutation({
    mutationFn: ({ bookId, folderId }: { bookId: string; folderId: string | null }) =>
      moveBookToFolder(bookId, folderId),
    onMutate: async ({ bookId, folderId }) => {
      await queryClient.cancelQueries({ queryKey: ["books"] });
      const prev = queryClient.getQueryData<Book[]>(["books"]);
      queryClient.setQueryData<Book[]>(["books"], (old) =>
        old?.map((b) => b.id === bookId ? { ...b, folder_id: folderId } : b),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["books"], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  useEffect(() => {
    if (userError) router.replace("/login");
  }, [userError, router]);

  const { award } = useLumi();
  useEffect(() => {
    if (!user) return;
    award("welcome");
  }, [user, award]);
  useEffect(() => {
    if (!books) return;
    if (books.length >= 1) award("first-upload");
    if (books.length >= 5) award("five-books");
    if (books.some((b) => b.status === "ready")) award("first-translation");
  }, [books, award]);

  const onLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const openCreate = () => { setEditingFolder(null); setEditorOpen(true); };
  const openEdit = (f: Folder) => { setEditingFolder(f); setEditorOpen(true); };

  if (!mounted || userLoading) {
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <p className="text-[color:var(--color-ink-soft)]">{t("library.loading")}</p>
      </main>
    );
  }

  const hasBooks = !!books && books.length > 0;
  const viewTitle = view === "all"
    ? t("library.allBooks")
    : view === "unsorted"
      ? t("library.unsorted")
      : activeFolder?.name ?? t("library.allBooks");
  const isAllView = view === "all";

  return (
    <div className="relative min-h-screen bg-[color:var(--color-paper)]">
      <MilestoneToast />
      <ConversionModal />

      <div className="flex">
        <LibrarySidebar
          user={user}
          folders={orderedFolders}
          counts={countByFolder}
          activeView={view}
          onSelectView={setView}
          onNewFolder={openCreate}
          onEditFolder={openEdit}
          onDropBook={(bookId, folderId) => moveBook.mutate({ bookId, folderId })}
          onLogout={onLogout}
          upload={
            <div className="flex flex-col gap-2">
              <UploadButton />
              <YouTubeImportButton />
            </div>
          }
          mobileOpen={mobileNav}
          onMobileClose={() => setMobileNav(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <TrialBanner />

          {/* Sticky content header */}
          <header className="sticky top-0 z-20 border-b border-[color:var(--color-border)] bg-[color:var(--color-paper)]/85 backdrop-blur-md">
            <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
              <button
                type="button"
                onClick={() => setMobileNav(true)}
                aria-label={t("library.openNav")}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[color:var(--color-border)] text-[color:var(--color-ink)] transition-colors hover:bg-[color:var(--color-paper-2)] lg:hidden"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M3 6h18M3 12h18M3 18h18" />
                </svg>
              </button>

              <div className="flex min-w-0 items-baseline gap-2.5">
                <h1 className="truncate font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-[color:var(--color-ink)] sm:text-[1.6rem]">
                  {viewTitle}
                </h1>
                {hasBooks && (
                  <span className="shrink-0 text-sm font-medium text-[color:var(--color-ink-soft)]">
                    {visibleBooks.length}
                  </span>
                )}
              </div>

              <div className="ms-auto flex items-center gap-2">
                {hasBooks && (
                  <>
                    <SearchField value={query} onChange={setQuery} />
                    <SortMenu value={sort} onChange={setSort} />
                  </>
                )}
                {activeFolder && (
                  <button
                    type="button"
                    onClick={() => openEdit(activeFolder)}
                    className="hidden h-10 items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-paper)] px-3.5 text-sm font-medium text-[color:var(--color-ink-soft)] transition-colors hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-ink)] sm:inline-flex"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
                    </svg>
                    {t("library.editFolder")}
                  </button>
                )}
              </div>
            </div>
          </header>

          <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {/* soft warm wash, kept very subtle */}
            <div aria-hidden className="pointer-events-none absolute -right-10 -top-6 h-72 w-72 rounded-full bg-[color:var(--color-sage)]/8 blur-3xl" />

            {booksLoading ? (
              <GridSkeleton />
            ) : !hasBooks ? (
              <EmptyLibrary />
            ) : (
              <>
                {isAllView && continueItems.length > 0 && (
                  <ContinueReadingStrip items={continueItems} />
                )}

                {visibleBooks.length === 0 ? (
                  query.trim() ? (
                    <NoResults onClear={() => setQuery("")} />
                  ) : (
                    <EmptyFolderState onShowAll={() => setView("all")} />
                  )
                ) : (
                  <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 ${isAllView && continueItems.length > 0 ? "mt-8" : ""}`}>
                    {visibleBooks.map((book, i) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        index={i}
                        noteCount={noteCountsByBook[book.id] ?? 0}
                        folders={orderedFolders.filter((f) => f.id !== book.folder_id)}
                        onMove={(folderId) => moveBook.mutate({ bookId: book.id, folderId })}
                      />
                    ))}
                  </div>
                )}

                {isAllView && recentHighlights.length > 0 && (
                  <RecentNotesStrip highlights={recentHighlights} bookTitleById={bookTitleById} />
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <FolderEditor folder={editingFolder} open={editorOpen} onClose={() => setEditorOpen(false)} />
    </div>
  );
}

/* ── Find + sort controls ─────────────────────────────────────────────── */

function SearchField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useI18n();
  return (
    <div className="relative w-36 sm:w-60">
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-[color:var(--color-ink-soft)]">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("library.search.placeholder")}
        aria-label={t("library.search.placeholder")}
        className="h-10 w-full rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-paper)] pl-9 pr-9 text-sm text-[color:var(--color-ink)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[color:var(--color-ink-soft)]/70 focus:border-[color:var(--color-saffron-deep)] focus:ring-2 focus:ring-[color:var(--color-saffron)]/25 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label={t("library.search.clear")}
          onClick={() => onChange("")}
          className="absolute inset-y-0 right-2.5 grid place-items-center text-[color:var(--color-ink-soft)] transition-colors hover:text-[color:var(--color-ink)]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

function SortMenu({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const options: { key: SortKey; label: string }[] = [
    { key: "recent", label: t("library.sort.recent") },
    { key: "added", label: t("library.sort.added") },
    { key: "title", label: t("library.sort.title") },
  ];
  const current = options.find((o) => o.key === value) ?? options[0];
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={t("library.sort.label")}
        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-paper)] px-3 text-sm font-medium text-[color:var(--color-ink)] transition-[border-color,background-color] duration-150 hover:border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-paper-2)]"
      >
        <svg aria-hidden width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h13M3 12h9M3 18h5" />
        </svg>
        <span className="hidden md:inline">{current.label}</span>
        <svg aria-hidden width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute end-0 top-12 z-40 w-44 overflow-hidden rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)] py-1 shadow-[0_14px_36px_-12px_rgba(20,16,8,0.32)] animate-float-in"
          >
            {options.map((o) => (
              <button
                key={o.key}
                type="button"
                role="menuitemradio"
                aria-checked={o.key === value}
                onClick={() => { onChange(o.key); setOpen(false); }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-start text-[0.86rem] transition-colors hover:bg-[color:var(--color-paper-2)] ${
                  o.key === value ? "font-semibold text-[color:var(--color-ink)]" : "text-[color:var(--color-ink-soft)]"
                }`}
              >
                {o.label}
                {o.key === value && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="text-[color:var(--color-saffron-deep)]">
                    <path d="m20 6-11 11-5-5" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── States ───────────────────────────────────────────────────────────── */

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="card-paper h-44 animate-pulse" style={{ animationDelay: `${i * 70}ms` }} />
      ))}
    </div>
  );
}

function NoResults({ onClear }: { onClear: () => void }) {
  const { t } = useI18n();
  return (
    <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-[color:var(--color-border-strong)] py-16 text-center">
      <Lumi state="thinking" size={68} animate />
      <div>
        <p className="font-[family-name:var(--font-display)] text-base font-semibold text-[color:var(--color-ink)]">
          {t("library.noResultsTitle")}
        </p>
        <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">{t("library.noResultsBody")}</p>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex h-9 items-center rounded-full bg-[color:var(--color-ink)] px-4 text-xs font-semibold text-[color:var(--color-paper)] transition-transform duration-150 hover:-translate-y-[1px] active:scale-[0.97]"
      >
        {t("library.search.clear")}
      </button>
    </div>
  );
}

function EmptyFolderState({ onShowAll }: { onShowAll: () => void }) {
  const { t } = useI18n();
  return (
    <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-[color:var(--color-border-strong)] py-16 text-center">
      <Lumi state="sleepy" size={64} animate />
      <p className="max-w-xs text-sm text-[color:var(--color-ink-soft)]">{t("library.folderEmpty")}</p>
      <button
        type="button"
        onClick={onShowAll}
        className="inline-flex h-9 items-center rounded-full border border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)] px-4 text-xs font-semibold text-[color:var(--color-ink)] transition-[transform,border-color] duration-150 hover:-translate-y-[1px] hover:border-[color:var(--color-saffron-deep)]"
      >
        {t("library.allBooks")}
      </button>
    </div>
  );
}

function ContinueReadingStrip({
  items,
}: {
  items: Array<{ progress: BookProgressListItem; book: Book }>;
}) {
  const { t } = useI18n();
  return (
    <section>
      <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-semibold tracking-tight text-[color:var(--color-ink)]">
        {t("library.continueReading")}
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {items.map(({ progress, book }, i) => {
          const pct = pageCountPct(progress.current_page, book.page_count);
          const tone = SPINE_TONES[i % SPINE_TONES.length];
          return (
            <Link
              key={book.id}
              href={`/library/${book.id}`}
              className="group flex w-72 shrink-0 items-center gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-3 transition-[transform,border-color,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-[2px] hover:border-[color:var(--color-sage)] hover:shadow-[var(--shadow-paper-lg)]"
            >
              <div
                className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md shadow-[0_6px_14px_-6px_rgba(60,40,15,0.4)]"
                style={{ background: `linear-gradient(160deg, ${tone.from}, ${tone.to})` }}
              >
                <div className="absolute inset-y-1 left-0 w-1 rounded-r" style={{ background: tone.spine }} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h3 className="line-clamp-2 font-[family-name:var(--font-display)] text-sm font-semibold leading-snug tracking-tight">
                  {book.title}
                </h3>
                {pct != null ? (
                  <div className="mt-0.5 flex flex-col gap-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--color-paper-3)]">
                      <div className="h-full rounded-full bg-[color:var(--color-sage)]" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[0.7rem] font-semibold text-[color:var(--color-ink-soft)]">
                      <span>
                        {progress.current_page != null && book.page_count != null
                          ? `p. ${progress.current_page} / ${book.page_count}`
                          : progress.current_page != null ? `p. ${progress.current_page}` : ""}
                      </span>
                      <span>{pct}%</span>
                    </div>
                  </div>
                ) : (
                  book.author && <p className="line-clamp-1 text-xs text-[color:var(--color-ink-soft)]">{book.author}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function pageCountPct(current: number | null, total: number | null): number | null {
  if (!current || !total || total <= 0) return null;
  return Math.max(1, Math.min(100, Math.round((current / total) * 100)));
}

function RecentNotesStrip({
  highlights,
  bookTitleById,
}: {
  highlights: Highlight[];
  bookTitleById: Record<string, string>;
}) {
  const { t } = useI18n();
  return (
    <section className="mt-12 border-t border-[color:var(--color-border)] pt-8">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-base font-semibold tracking-tight text-[color:var(--color-ink)]">
          {t("library.recentNotes")}
        </h2>
        <span className="text-xs text-[color:var(--color-ink-soft)]">{t("library.latest", { n: highlights.length })}</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {highlights.map((h) => (
          <Link
            key={h.id}
            href={`/library/${h.book_id}?highlight=${h.id}`}
            className="group flex w-72 shrink-0 flex-col gap-2 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-3 transition-[transform,border-color,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-[2px] hover:border-[color:var(--color-saffron)] hover:shadow-[var(--shadow-paper-lg)]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="line-clamp-1 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[color:var(--color-ink-soft)]">
                {bookTitleById[h.book_id] ?? t("library.unnamedBook")}
              </span>
              <span className="shrink-0 rounded-full bg-[color:var(--color-paper-3)]/70 px-2 py-0.5 text-[0.65rem] font-semibold text-[color:var(--color-ink-soft)]">
                p. {h.page}
              </span>
            </div>
            <blockquote className={`line-clamp-3 rounded-md px-2 py-1.5 text-xs italic leading-relaxed text-[color:var(--color-ink)] ${HIGHLIGHT_COLOR_CLASS[h.color]}`}>
              “{h.text}”
            </blockquote>
            {h.note && <p className="line-clamp-2 text-xs leading-relaxed text-[color:var(--color-ink-soft)]">{h.note}</p>}
            {h.ai_answer && <p className="line-clamp-1 text-[0.7rem] font-semibold text-[color:var(--color-coral-deep)]">{t("library.aiExplained")}</p>}
          </Link>
        ))}
      </div>
    </section>
  );
}

function EmptyLibrary() {
  const { t } = useI18n();
  return (
    <div className="card-paper-lifted relative mx-auto max-w-3xl overflow-hidden p-8 sm:p-12">
      <div aria-hidden className="pointer-events-none absolute -left-12 -top-12 h-44 w-44 rounded-full bg-[color:var(--color-saffron)]/20 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -right-12 -bottom-12 h-44 w-44 rounded-full bg-[color:var(--color-sage)]/15 blur-2xl" />
      <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-2">
        <LumiGuide
          state="waving"
          size={160}
          lines={[t("library.lumi.1"), t("library.lumi.2"), t("library.lumi.3")]}
          bubblePosition="right"
        />
      </div>
      <div className="relative mt-8 border-t border-dashed border-[color:var(--color-border-strong)] pt-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-ink-soft)]">
          {t("library.dragHere")}
        </p>
      </div>
    </div>
  );
}
