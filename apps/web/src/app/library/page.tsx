"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { BookCard } from "@/components/book-card";
import { UploadButton } from "@/components/upload-button";
import { YouTubeImportButton } from "@/components/youtube-import-button";
import { TrialBanner } from "@/components/trial-banner";
import { ConversionModal } from "@/components/conversion-modal";
import { FolderEditor } from "@/components/folder-editor";
import { me, logout, type User } from "@/lib/auth";
import { listBooks, moveBookToFolder, type Book } from "@/lib/books";
import { listFolders, folderColorToken, type Folder } from "@/lib/folders";
import {
  listAllHighlights,
  HIGHLIGHT_COLOR_CLASS,
  type Highlight,
} from "@/lib/highlights";
import { listBookProgress, type BookProgressListItem } from "@/lib/progress";
import { TranslifyMark } from "@/components/translify-mark";
import { getToken } from "@/lib/api";
import { LumiHud } from "@/components/lumi/lumi-hud";
import { LumiGuide } from "@/components/lumi/lumi-guide";
import { Lumi } from "@/components/lumi/lumi";
import { useLumi } from "@/components/lumi/lumi-context";
import { MilestoneToast } from "@/components/milestone-toast";
import { SocialNavBar } from "@/components/social-nav-bar";
import { useI18n } from "@/lib/i18n";

type SortKey = "recent" | "added" | "title";
/** "all" = everything, "unsorted" = books with no folder, else a folder id. */
type FolderFilter = "all" | "unsorted" | (string & {});

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
      const anyPending = data.some(
        (b) => b.status === "uploaded" || b.status === "processing",
      );
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

  // book_id → last_read_at, for the "Recently read" sort.
  const lastReadByBook = useMemo(
    () => Object.fromEntries((progress ?? []).map((p) => [p.book_id, p.last_read_at] as const)),
    [progress],
  );

  // Continue-reading: progress rows joined with their Book, freshest first,
  // skipping orphans (book deleted, progress kept). Capped at 6 to keep the
  // strip glanceable; the rest are still reachable in the grid below.
  const continueItems = useMemo(() => {
    if (!progress || !books) return [];
    return progress
      .map((p) => ({ progress: p, book: bookById[p.book_id] }))
      .filter((x): x is { progress: BookProgressListItem; book: Book } =>
        !!x.book && x.book.status === "ready",
      )
      .slice(0, 6);
  }, [progress, books, bookById]);

  // ── Find + organise state ───────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [folderFilter, setFolderFilter] = useState<FolderFilter>("all");

  const orderedFolders = useMemo(
    () => (folders ?? []).slice().sort((a, b) => a.position - b.position || a.name.localeCompare(b.name)),
    [folders],
  );

  // Live counts per folder (from loaded books, not the cached book_count which
  // can lag a move). NULL folder → "unsorted".
  const countByFolder = useMemo(() => {
    const m: Record<string, number> = { all: 0, unsorted: 0 };
    for (const b of books ?? []) {
      m.all += 1;
      const k = b.folder_id ?? "unsorted";
      m[k] = (m[k] ?? 0) + 1;
    }
    return m;
  }, [books]);

  // A filter pointing at a now-deleted folder should fall back to "all".
  useEffect(() => {
    if (folderFilter === "all" || folderFilter === "unsorted") return;
    if (folders && !folders.some((f) => f.id === folderFilter)) setFolderFilter("all");
  }, [folders, folderFilter]);

  const visibleBooks = useMemo(() => {
    let list = books ?? [];
    if (folderFilter === "unsorted") list = list.filter((b) => !b.folder_id);
    else if (folderFilter !== "all") list = list.filter((b) => b.folder_id === folderFilter);

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
  }, [books, folderFilter, query, sort, lastReadByBook]);

  // Move-book mutation — shared by chip drops and each card's overflow menu.
  // Optimistic so the card leaves its shelf immediately.
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

  // Lumi achievement triggers — react to library state changes.
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

  // Folder editor state — null target == "create new".
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const openCreate = () => { setEditingFolder(null); setEditorOpen(true); };
  const openEdit = (f: Folder) => { setEditingFolder(f); setEditorOpen(true); };

  if (!mounted || userLoading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-[color:var(--color-ink-soft)]">{t("library.loading")}</p>
      </main>
    );
  }

  const greeting = pickGreeting(t);
  const name = user?.display_name || (user?.email ? user.email.split("@")[0] : t("library.unnamedReader"));
  const hasBooks = !!books && books.length > 0;
  const showFinder = (books?.length ?? 0) >= 6;
  const showChips = orderedFolders.length > 0;
  const activeFolder = folderFilter !== "all" && folderFilter !== "unsorted"
    ? orderedFolders.find((f) => f.id === folderFilter) ?? null
    : null;

  return (
    <main className="relative min-h-screen pb-24">
      <MilestoneToast />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-24 h-96 w-96 rounded-full bg-[color:var(--color-saffron)]/12 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-40 h-[24rem] w-[24rem] rounded-full bg-[color:var(--color-sage)]/10 blur-3xl"
      />

      <TrialBanner />
      <ConversionModal />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-10">
        <TranslifyMark href="/library" size={36} wordmarkClassName="text-xl" />

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <LumiHud />
          </div>
          <Link
            href="/garden"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-paper)] px-3.5 text-xs font-semibold text-[color:var(--color-ink)] transition-[transform,border-color] duration-150 hover:-translate-y-[1px] hover:border-[color:var(--color-sage)]"
          >
            <span aria-hidden>🌿</span> {t("bookCard.garden")}
          </Link>
          <Link
            href="/account"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-paper)] px-3.5 text-xs font-semibold text-[color:var(--color-ink)] transition-[transform,border-color] duration-150 hover:-translate-y-[1px] hover:border-[color:var(--color-border-strong)]"
          >
            <span aria-hidden>✦</span> {t("library.account")}
          </Link>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            {t("library.logOut")}
          </Button>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-2 lg:px-10">
        <SocialNavBar user={user} />
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-8 lg:px-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 inline-flex items-center gap-2 rounded-full bg-[color:var(--color-paper-3)] px-3 py-1 text-xs font-semibold text-[color:var(--color-ink-soft)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-sage)]" />
              {greeting}
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-[2.4rem] font-semibold leading-[1.05] tracking-tight sm:text-[2.8rem]">
              {(() => {
                const tpl = t("library.titleNamed", { name: "@@NAME@@" });
                const [before, after] = tpl.split("@@NAME@@");
                return (
                  <>
                    {before}
                    <em className="text-[color:var(--color-saffron-deep)]">{name}</em>
                    {after}
                  </>
                );
              })()}
            </h1>
            <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-[color:var(--color-ink-soft)]">
              {hasBooks ? t("library.subtitleWithBooks") : t("library.subtitleEmpty")}
            </p>
          </div>

          {/* Create actions: Upload is primary; folder + import are secondary. */}
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <UploadButton />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)] px-4 text-sm font-semibold text-[color:var(--color-ink)] transition-[transform,border-color,background-color] duration-150 hover:-translate-y-[1px] hover:border-[color:var(--color-saffron-deep)] hover:bg-[color:var(--color-paper-2)]"
              >
                <PlusIcon />
                {t("library.newFolder")}
              </button>
              <YouTubeImportButton />
            </div>
          </div>
        </div>

        {continueItems.length > 0 && <ContinueReadingStrip items={continueItems} />}

        {/* ── Your books ──────────────────────────────────────────────── */}
        <section className="mt-12">
          {hasBooks && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-baseline gap-2.5 font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
                  {t("library.yourBooks")}
                  <span className="text-sm font-medium text-[color:var(--color-ink-soft)]">
                    {visibleBooks.length}
                  </span>
                </h2>

                {showFinder && (
                  <div className="flex w-full items-center gap-2 sm:w-auto">
                    <SearchField value={query} onChange={setQuery} />
                    <SortMenu value={sort} onChange={setSort} />
                  </div>
                )}
              </div>

              {showChips && (
                <FolderChips
                  folders={orderedFolders}
                  counts={countByFolder}
                  active={folderFilter}
                  onSelect={setFolderFilter}
                  onDropBook={(bookId, folderId) => moveBook.mutate({ bookId, folderId })}
                  onNew={openCreate}
                  onEdit={openEdit}
                  activeFolder={activeFolder}
                />
              )}
            </div>
          )}

          <div className="mt-6">
            {booksLoading ? (
              <GridSkeleton />
            ) : !hasBooks ? (
              <EmptyLibrary />
            ) : visibleBooks.length === 0 ? (
              query.trim() ? (
                <NoResults onClear={() => setQuery("")} />
              ) : (
                <EmptyFolderState onShowAll={() => setFolderFilter("all")} />
              )
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          </div>
        </section>

        {recentHighlights.length > 0 && (
          <RecentNotesStrip highlights={recentHighlights} bookTitleById={bookTitleById} />
        )}
      </section>

      <FolderEditor
        folder={editingFolder}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
      />
    </main>
  );
}

function pickGreeting(t: (key: string) => string) {
  const hour = new Date().getHours();
  if (hour < 5) return t("library.greet.late");
  if (hour < 12) return t("library.greet.morning");
  if (hour < 18) return t("library.greet.afternoon");
  return t("library.greet.evening");
}

/* ── Find + sort controls ─────────────────────────────────────────────── */

function SearchField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useI18n();
  return (
    <div className="relative flex-1 sm:w-64 sm:flex-none">
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-[color:var(--color-ink-soft)]">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
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
        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-paper)] px-3.5 text-sm font-medium text-[color:var(--color-ink)] transition-[border-color,background-color] duration-150 hover:border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-paper-2)]"
      >
        <svg aria-hidden width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h13M3 12h9M3 18h5" />
        </svg>
        <span className="hidden sm:inline text-[color:var(--color-ink-soft)]">{t("library.sort.label")}:</span>
        <span>{current.label}</span>
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

/* ── Folder filter chips (also drop targets) ──────────────────────────── */

function FolderChips({
  folders,
  counts,
  active,
  onSelect,
  onDropBook,
  onNew,
  onEdit,
  activeFolder,
}: {
  folders: Folder[];
  counts: Record<string, number>;
  active: FolderFilter;
  onSelect: (f: FolderFilter) => void;
  onDropBook: (bookId: string, folderId: string | null) => void;
  onNew: () => void;
  onEdit: (f: Folder) => void;
  activeFolder: Folder | null;
}) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Chip
        label={t("library.allBooks")}
        count={counts.all ?? 0}
        selected={active === "all"}
        onClick={() => onSelect("all")}
      />
      <Chip
        emoji="📥"
        label={t("library.unsorted")}
        count={counts.unsorted ?? 0}
        selected={active === "unsorted"}
        onClick={() => onSelect("unsorted")}
        onDropBook={(bookId) => onDropBook(bookId, null)}
      />
      {folders.map((f) => (
        <Chip
          key={f.id}
          emoji={f.emoji}
          label={f.name}
          count={counts[f.id] ?? 0}
          color={folderColorToken(f.color).ring}
          selected={active === f.id}
          onClick={() => onSelect(f.id)}
          onDropBook={(bookId) => onDropBook(bookId, f.id)}
        />
      ))}
      <button
        type="button"
        onClick={onNew}
        aria-label={t("library.newFolder")}
        title={t("library.newFolder")}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-dashed border-[color:var(--color-border-strong)] text-[color:var(--color-ink-soft)] transition-colors duration-150 hover:border-[color:var(--color-saffron-deep)] hover:text-[color:var(--color-saffron-deep)]"
      >
        <PlusIcon />
      </button>

      {/* Edit affordance for the currently-filtered folder, kept out of the
          chip itself so the chip stays a single tap target. */}
      {activeFolder && (
        <button
          type="button"
          onClick={() => onEdit(activeFolder)}
          className="ml-1 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-[color:var(--color-ink-soft)] transition-colors duration-150 hover:bg-[color:var(--color-paper-3)] hover:text-[color:var(--color-ink)]"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
          </svg>
          {t("library.editFolder")}
        </button>
      )}
    </div>
  );
}

function Chip({
  label,
  count,
  selected,
  onClick,
  emoji,
  color,
  onDropBook,
}: {
  label: string;
  count: number;
  selected: boolean;
  onClick: () => void;
  emoji?: string;
  color?: string;
  onDropBook?: (bookId: string) => void;
}) {
  const [over, setOver] = useState(false);
  const droppable = !!onDropBook;
  // Drop-target highlight: a deterministic ring keyed to the folder colour
  // (or saffron for Unsorted), driven inline so it never depends on Tailwind's
  // ring CSS variables.
  const ringColor = color ?? "var(--color-saffron-deep)";
  return (
    <button
      type="button"
      onClick={onClick}
      onDragOver={droppable ? (e) => {
        if (!e.dataTransfer.types.includes("application/x-translify-book")) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!over) setOver(true);
      } : undefined}
      onDragLeave={droppable ? () => setOver(false) : undefined}
      onDrop={droppable ? (e) => {
        e.preventDefault();
        setOver(false);
        const bookId = e.dataTransfer.getData("application/x-translify-book");
        if (bookId) onDropBook!(bookId);
      } : undefined}
      aria-pressed={selected}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[0.84rem] font-medium transition-[transform,background-color,border-color,box-shadow] duration-150 ${
        selected
          ? "border-transparent bg-[color:var(--color-ink)] text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4)]"
          : "border-[color:var(--color-border)] bg-[color:var(--color-paper)] text-[color:var(--color-ink)] hover:-translate-y-[1px] hover:border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-paper-2)]"
      }`}
      style={over ? { borderColor: ringColor, boxShadow: `0 0 0 3px color-mix(in oklab, ${ringColor} 35%, transparent)` } : undefined}
    >
      {emoji ? (
        <span aria-hidden className="text-[0.95rem] leading-none">{emoji}</span>
      ) : color === undefined ? null : (
        <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: color }} />
      )}
      <span className="max-w-[12rem] truncate">{label}</span>
      <span className={selected ? "text-[color:var(--color-paper)]/70" : "text-[color:var(--color-ink-soft)]"}>
        {count}
      </span>
    </button>
  );
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/* ── States ───────────────────────────────────────────────────────────── */

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="card-paper h-44 animate-pulse"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}

function NoResults({ onClear }: { onClear: () => void }) {
  const { t } = useI18n();
  return (
    <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-[color:var(--color-border-strong)] py-14 text-center">
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
    <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-[color:var(--color-border-strong)] py-14 text-center">
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
    <section className="mt-10">
      <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
        {t("library.continueReading")}
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {items.map(({ progress, book }) => {
          const pct = pageCountPct(progress.current_page, book.page_count);
          return (
            <Link
              key={book.id}
              href={`/library/${book.id}`}
              className="group relative flex w-72 shrink-0 flex-col gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-4 transition-[transform,border-color,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-[2px] hover:border-[color:var(--color-sage)] hover:shadow-[var(--shadow-paper-lg)]"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 font-[family-name:var(--font-display)] text-sm font-semibold leading-snug tracking-tight">
                  {book.title}
                </h3>
                <span aria-hidden className="text-base">📖</span>
              </div>
              {book.author && (
                <p className="-mt-2 line-clamp-1 text-xs text-[color:var(--color-ink-soft)]">
                  {book.author}
                </p>
              )}
              {pct != null && (
                <div className="mt-auto flex flex-col gap-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--color-paper-3)]">
                    <div
                      className="h-full rounded-full bg-[color:var(--color-sage)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[0.7rem] font-semibold text-[color:var(--color-ink-soft)]">
                    <span>
                      {progress.current_page != null && book.page_count != null
                        ? `p. ${progress.current_page} / ${book.page_count}`
                        : progress.current_page != null
                          ? `p. ${progress.current_page}`
                          : ""}
                    </span>
                    <span>{pct}%</span>
                  </div>
                </div>
              )}
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
    <section className="mt-12">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
          {t("library.recentNotes")}
        </h2>
        <span className="text-xs text-[color:var(--color-ink-soft)]">
          {t("library.latest", { n: highlights.length })}
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {highlights.map((h) => (
          <Link
            key={h.id}
            href={`/library/${h.book_id}?highlight=${h.id}`}
            className="group relative flex w-72 shrink-0 flex-col gap-2 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-3 transition-[transform,border-color,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-[2px] hover:border-[color:var(--color-saffron)] hover:shadow-[var(--shadow-paper-lg)]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="line-clamp-1 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[color:var(--color-ink-soft)]">
                {bookTitleById[h.book_id] ?? t("library.unnamedBook")}
              </span>
              <span className="shrink-0 rounded-full bg-[color:var(--color-paper-3)]/70 px-2 py-0.5 text-[0.65rem] font-semibold text-[color:var(--color-ink-soft)]">
                p. {h.page}
              </span>
            </div>
            <blockquote
              className={`line-clamp-3 rounded-md px-2 py-1.5 text-xs italic leading-relaxed text-[color:var(--color-ink)] ${HIGHLIGHT_COLOR_CLASS[h.color]}`}
            >
              “{h.text}”
            </blockquote>
            {h.note && (
              <p className="line-clamp-2 text-xs leading-relaxed text-[color:var(--color-ink-soft)]">
                {h.note}
              </p>
            )}
            {h.ai_answer && (
              <p className="line-clamp-1 text-[0.7rem] font-semibold text-[color:var(--color-coral-deep)]">
                {t("library.aiExplained")}
              </p>
            )}
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
      <div
        aria-hidden
        className="pointer-events-none absolute -left-12 -top-12 h-44 w-44 rounded-full bg-[color:var(--color-saffron)]/20 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -bottom-12 h-44 w-44 rounded-full bg-[color:var(--color-sage)]/15 blur-2xl"
      />

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
