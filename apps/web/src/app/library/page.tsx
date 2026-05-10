"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { BookCard } from "@/components/book-card";
import { UploadButton } from "@/components/upload-button";
import { TrialBanner } from "@/components/trial-banner";
import { ConversionModal } from "@/components/conversion-modal";
import { me, logout, type User } from "@/lib/auth";
import { listBooks, type Book } from "@/lib/books";
import {
  listAllHighlights,
  HIGHLIGHT_COLOR_CLASS,
  type Highlight,
} from "@/lib/highlights";
import { TranslifyMark } from "@/components/translify-mark";
import { getToken } from "@/lib/api";

export default function LibraryPage() {
  const router = useRouter();
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

  const { data: highlights } = useQuery<Highlight[]>({
    queryKey: ["highlights", "all"],
    queryFn: listAllHighlights,
    enabled,
  });

  const countsByBook = (highlights ?? []).reduce<Record<string, number>>(
    (acc, h) => {
      acc[h.book_id] = (acc[h.book_id] ?? 0) + 1;
      return acc;
    },
    {},
  );
  const recentHighlights = (highlights ?? []).slice(0, 6);
  const bookTitleById = Object.fromEntries(
    (books ?? []).map((b) => [b.id, b.title] as const),
  );

  useEffect(() => {
    if (userError) router.replace("/login");
  }, [userError, router]);

  const onLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (!mounted || userLoading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-[color:var(--color-ink-soft)]">Opening your shelf…</p>
      </main>
    );
  }

  const greeting = pickGreeting();
  const name = user?.display_name || (user?.email ? user.email.split("@")[0] : "reader");

  return (
    <main className="relative min-h-screen pb-24">
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
          <span className="hidden rounded-full bg-[color:var(--color-paper-3)]/70 px-3 py-1.5 text-xs font-medium text-[color:var(--color-ink-soft)] sm:inline-flex">
            {user?.email}
          </span>
          <Link
            href="/account"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-paper)] px-3.5 text-xs font-semibold text-[color:var(--color-ink)] transition-all hover:-translate-y-[1px] hover:border-[color:var(--color-border-strong)]"
          >
            <span aria-hidden>✦</span> Account
          </Link>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            Log out
          </Button>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-6 lg:px-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 inline-flex items-center gap-2 rounded-full bg-[color:var(--color-paper-3)] px-3 py-1 text-xs font-semibold text-[color:var(--color-ink-soft)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-sage)]" />
              {greeting}
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-[3rem]">
              Your shelf,{" "}
              <em className="text-[color:var(--color-saffron-deep)]">{name}</em>.
            </h1>
            <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-[color:var(--color-ink-soft)]">
              {books && books.length > 0
                ? "Pick a book to keep going, or drop in a new one — we'll do the heavy lifting."
                : "Start by adding a book. PDF or EPUB — whatever you've got."}
            </p>
          </div>

          <UploadButton />
        </div>

        {recentHighlights.length > 0 && (
          <RecentNotesStrip
            highlights={recentHighlights}
            bookTitleById={bookTitleById}
          />
        )}

        <div className="mt-10">
          {booksLoading ? (
            <BooksSkeleton />
          ) : !books || books.length === 0 ? (
            <EmptyShelf />
          ) : (
            <div className="grid grid-cols-1 gap-5 stagger sm:grid-cols-2 lg:grid-cols-3">
              {books.map((book, i) => (
                <BookCard
                  key={book.id}
                  book={book}
                  index={i}
                  noteCount={countsByBook[book.id] ?? 0}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function pickGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Reading late tonight";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function BooksSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="card-paper h-48 animate-pulse"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}

function RecentNotesStrip({
  highlights,
  bookTitleById,
}: {
  highlights: Highlight[];
  bookTitleById: Record<string, string>;
}) {
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
          Recent notes
        </h2>
        <span className="text-xs text-[color:var(--color-ink-soft)]">
          {highlights.length} latest
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
                {bookTitleById[h.book_id] ?? "Book"}
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
                ✦ AI explained this
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

function EmptyShelf() {
  return (
    <div className="card-paper-lifted relative mx-auto max-w-2xl overflow-hidden p-10 text-center sm:p-14">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-12 -top-12 h-44 w-44 rounded-full bg-[color:var(--color-saffron)]/15 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -bottom-12 h-44 w-44 rounded-full bg-[color:var(--color-sage)]/15 blur-2xl"
      />

      <div className="relative mx-auto mb-5 grid h-20 w-20 place-items-center rounded-3xl bg-[color:var(--color-saffron)]/15 text-[color:var(--color-saffron-deep)]">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          <path d="M9 8h6M9 12h6" />
        </svg>
      </div>

      <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
        Your shelf is empty — for now.
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[color:var(--color-ink-soft)]">
        Drag in your first PDF or EPUB. We'll read it, translate it, and get it
        ready for chat and quizzes — usually within a minute or two.
      </p>
    </div>
  );
}
