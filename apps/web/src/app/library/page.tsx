"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { BookCard } from "@/components/book-card";
import { UploadButton } from "@/components/upload-button";
import { me, logout, type User } from "@/lib/auth";
import { listBooks, type Book } from "@/lib/books";
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

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-10">
        <Link
          href="/library"
          className="flex items-center gap-2.5 font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color:var(--color-ink)] text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          </span>
          Translify
        </Link>

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

        <div className="mt-10">
          {booksLoading ? (
            <BooksSkeleton />
          ) : !books || books.length === 0 ? (
            <EmptyShelf />
          ) : (
            <div className="grid grid-cols-1 gap-5 stagger sm:grid-cols-2 lg:grid-cols-3">
              {books.map((book, i) => (
                <BookCard key={book.id} book={book} index={i} />
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
