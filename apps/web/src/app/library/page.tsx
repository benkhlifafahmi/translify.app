"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { UploadButton } from "@/components/upload-button";
import { YouTubeImportButton } from "@/components/youtube-import-button";
import { TrialBanner } from "@/components/trial-banner";
import { ConversionModal } from "@/components/conversion-modal";
import { FolderShelf } from "@/components/folder-shelf";
import { FolderEditor } from "@/components/folder-editor";
import { me, logout, type User } from "@/lib/auth";
import { listBooks, moveBookToFolder, type Book } from "@/lib/books";
import { listFolders, type Folder } from "@/lib/folders";
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
import { useLumi } from "@/components/lumi/lumi-context";
import { MilestoneToast } from "@/components/milestone-toast";
import { SocialNavBar } from "@/components/social-nav-bar";
import { useI18n } from "@/lib/i18n";

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

  // Continue-reading: progress rows joined with their Book, freshest first,
  // skipping orphans (book deleted, progress kept). Capped at 6 to keep the
  // strip glanceable; the rest are still reachable via the shelves below.
  const continueItems = useMemo(() => {
    if (!progress || !books) return [];
    return progress
      .map((p) => ({ progress: p, book: bookById[p.book_id] }))
      .filter((x): x is { progress: BookProgressListItem; book: Book } =>
        !!x.book && x.book.status === "ready",
      )
      .slice(0, 6);
  }, [progress, books, bookById]);

  // Group books by their folder. NULL → "unsorted" key.
  const booksByFolder = useMemo(() => {
    const m: Record<string, Book[]> = { unsorted: [] };
    for (const b of books ?? []) {
      const k = b.folder_id ?? "unsorted";
      (m[k] ??= []).push(b);
    }
    return m;
  }, [books]);

  // Move-book mutation — used by both DnD drops and the "..." menu. We patch
  // the cache optimistically so the card jumps shelves immediately.
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
      // Roll back on failure so the UI doesn't show the wrong shelf.
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
  const orderedFolders = (folders ?? []).slice().sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));

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
        <TranslifyMark
          href="/library"
          size={36}
          wordmarkClassName="text-xl"
        />

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <LumiHud />
          </div>
          <span className="hidden rounded-full bg-[color:var(--color-paper-3)]/70 px-3 py-1.5 text-xs font-medium text-[color:var(--color-ink-soft)] lg:inline-flex">
            {user?.email}
          </span>
          <Link
            href="/garden"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-paper)] px-3.5 text-xs font-semibold text-[color:var(--color-ink)] transition-all hover:-translate-y-[1px] hover:border-[color:var(--color-sage)]"
          >
            <span aria-hidden>🌿</span> {t("bookCard.garden")}
          </Link>
          <Link
            href="/account"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-paper)] px-3.5 text-xs font-semibold text-[color:var(--color-ink)] transition-all hover:-translate-y-[1px] hover:border-[color:var(--color-border-strong)]"
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
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-[3rem]">
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
              {books && books.length > 0
                ? t("library.subtitleWithBooks")
                : t("library.subtitleEmpty")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border-2 px-4 text-sm font-semibold transition-all active:translate-y-1"
              style={{
                borderColor: "var(--color-border-strong)",
                background: "white",
                color: "var(--color-ink)",
                boxShadow: "0 3px 0 rgba(74,60,30,0.10)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {t("library.newFolder")}
            </button>
            <YouTubeImportButton />
            <UploadButton />
          </div>
        </div>

        {continueItems.length > 0 && (
          <ContinueReadingStrip items={continueItems} />
        )}

        {recentHighlights.length > 0 && (
          <RecentNotesStrip
            highlights={recentHighlights}
            bookTitleById={bookTitleById}
          />
        )}

        <div className="mt-10 flex flex-col gap-6">
          {booksLoading ? (
            <ShelfSkeleton />
          ) : !books || books.length === 0 ? (
            <EmptyLibrary />
          ) : (
            <>
              {/* Unsorted always at the top so new uploads are visible first.
                  We only render it if there's something in it OR there are
                  no folders yet (the user needs *something* to look at). */}
              {(booksByFolder.unsorted?.length ?? 0) > 0 || orderedFolders.length === 0 ? (
                <FolderShelf
                  folder={null}
                  books={booksByFolder.unsorted ?? []}
                  noteCountsByBook={noteCountsByBook}
                  otherFolders={orderedFolders}
                  onDropBook={(bookId) => moveBook.mutate({ bookId, folderId: null })}
                  onMoveBook={(bookId, fid) => moveBook.mutate({ bookId, folderId: fid })}
                />
              ) : null}

              {orderedFolders.map((f) => (
                <FolderShelf
                  key={f.id}
                  folder={f}
                  books={booksByFolder[f.id] ?? []}
                  noteCountsByBook={noteCountsByBook}
                  onEditFolder={openEdit}
                  otherFolders={orderedFolders}
                  onDropBook={(bookId) => moveBook.mutate({ bookId, folderId: f.id })}
                  onMoveBook={(bookId, fid) => moveBook.mutate({ bookId, folderId: fid })}
                />
              ))}

              {/* New-folder CTA at the bottom of the stack. */}
              <button
                type="button"
                onClick={openCreate}
                className="group flex items-center justify-center gap-3 rounded-3xl border-2 border-dashed py-6 text-[0.95rem] font-semibold transition-all hover:-translate-y-[2px]"
                style={{
                  borderColor: "var(--color-border-strong)",
                  background: "var(--color-paper)",
                  color: "var(--color-ink-soft)",
                }}
              >
                <span
                  className="grid h-9 w-9 place-items-center rounded-full transition-colors group-hover:bg-[color:var(--color-saffron-deep)] group-hover:text-white"
                  style={{ background: "var(--color-paper-3)", color: "var(--color-ink)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
                {t("library.addFolder")}
              </button>
            </>
          )}
        </div>
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

function ShelfSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="card-paper h-40 animate-pulse"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
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
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
          {t("library.continueReading") || "Continue reading"}
        </h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {items.map(({ progress, book }) => {
          const pct = pageCountPct(progress.current_page, book.page_count);
          return (
            <Link
              key={book.id}
              href={`/library/${book.id}`}
              className="group relative flex w-72 shrink-0 flex-col gap-3 rounded-2xl border-[1.5px] border-[color:var(--color-border)] bg-white/80 p-4 transition-all hover:-translate-y-[2px] hover:border-[color:var(--color-sage)] hover:shadow-[var(--shadow-paper-lg)]"
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
                      className="h-full rounded-full bg-[color:var(--color-sage)] transition-all"
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
    <section className="mt-10">
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
            className="group relative flex w-72 shrink-0 flex-col gap-2 rounded-2xl border-[1.5px] border-[color:var(--color-border)] bg-white/80 p-3 transition-all hover:-translate-y-[2px] hover:border-[color:var(--color-saffron)] hover:shadow-[var(--shadow-paper-lg)]"
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
              className={`line-clamp-3 rounded-md border-l-2 border-[color:var(--color-saffron)] py-1 pl-2 text-xs italic leading-relaxed text-[color:var(--color-ink)] ${HIGHLIGHT_COLOR_CLASS[h.color]}`}
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
          lines={[
            t("library.lumi.1"),
            t("library.lumi.2"),
            t("library.lumi.3"),
          ]}
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
