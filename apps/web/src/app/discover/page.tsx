"use client";

/**
 * Public discover feed.
 *
 * Anyone (logged in or out) can browse recent public posts. Pill row at
 * the top filters by post type. Cursor-based "Load more" at the bottom.
 *
 * Client component for V1 simplicity. SEO via the server route + an
 * inlined first paint would be the Turn 5+ optimization; for now the
 * empty-shell-then-data pattern is fine since /discover isn't a ranking-
 * critical SEO target.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { getDiscover, type Post, type PostType } from "@/lib/social";
import { PostCard } from "@/components/post-card";
import { MarketingHeader } from "@/components/marketing-header";

const PAGE_SIZE = 30;

const FILTERS: { id: PostType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "sentence", label: "Sentences" },
  { id: "word", label: "Words" },
  { id: "passage", label: "Passages" },
  { id: "milestone", label: "Milestones" },
  { id: "list", label: "Lists" },
  { id: "reflection", label: "Reflections" },
];

export default function DiscoverPage() {
  const [filter, setFilter] = useState<PostType | "all">("all");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (cursor: string | undefined, replace: boolean) => {
      try {
        const next = await getDiscover({
          cursor,
          limit: PAGE_SIZE,
          type: filter === "all" ? undefined : filter,
        });
        setPosts((prev) => (replace ? next : [...prev, ...next]));
        setExhausted(next.length < PAGE_SIZE);
        setError(null);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? "Couldn't load the feed. Try refreshing."
            : "Couldn't reach the server.",
        );
      }
    },
    [filter],
  );

  // Reset + fetch when filter changes.
  useEffect(() => {
    setLoading(true);
    setExhausted(false);
    fetchPage(undefined, true).finally(() => setLoading(false));
  }, [fetchPage]);

  const last = posts[posts.length - 1];
  const lastCursor = last?.created_at;

  const onLoadMore = async () => {
    if (!lastCursor) return;
    setLoadingMore(true);
    await fetchPage(lastCursor, false);
    setLoadingMore(false);
  };

  return (
    <>
      <MarketingHeader />
      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-6 lg:py-14">
        <header className="mb-8">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[color:var(--color-saffron-deep)]">
            Discover
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.9rem,4vw,2.6rem)] font-semibold leading-tight tracking-tight">
            What readers are sharing.
          </h1>
          <p className="mt-3 max-w-[60ch] text-[0.96rem] leading-relaxed text-[color:var(--color-ink-soft)]">
            Sentences, words, and milestones from people reading right now.
            Public posts only, last two weeks.
          </p>
        </header>

        <FilterPills value={filter} onChange={setFilter} />

        <section className="mt-8">
          {loading && posts.length === 0 ? (
            <SkeletonList count={3} />
          ) : posts.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            <ul className="flex flex-col gap-4">
              {posts.map((p) => (
                <li key={p.id}>
                  <PostCard post={p} />
                </li>
              ))}
            </ul>
          )}

          {error && (
            <p className="mt-6 rounded-xl border-[1.5px] border-[color:var(--color-destructive)]/30 bg-[color:var(--color-destructive)]/8 px-4 py-3 text-sm text-[color:var(--color-destructive)]">
              {error}
            </p>
          )}

          {!loading && posts.length > 0 && !exhausted && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={onLoadMore}
                disabled={loadingMore}
                className="inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)]/70 px-5 text-[0.92rem] font-semibold text-[color:var(--color-ink)] transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[color:var(--color-paper-2)] active:scale-[0.97] disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}

          {!loading && posts.length > 0 && exhausted && (
            <p className="mt-8 text-center text-[0.82rem] text-[color:var(--color-ink-soft)]">
              You've reached the end. New posts show up here as readers share them.
            </p>
          )}
        </section>
      </main>
    </>
  );
}

function FilterPills({
  value,
  onChange,
}: {
  value: PostType | "all";
  onChange: (v: PostType | "all") => void;
}) {
  return (
    <div className="-mx-1 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {FILTERS.map((f) => {
        const active = value === f.id;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange(f.id)}
            aria-pressed={active}
            className={
              active
                ? "inline-flex h-9 shrink-0 items-center rounded-full bg-[color:var(--color-ink)] px-4 text-[0.84rem] font-semibold text-[color:var(--color-paper)] transition-[transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]"
                : "inline-flex h-9 shrink-0 items-center rounded-full border-[1.5px] border-[color:var(--color-border)] bg-[color:var(--color-paper)] px-4 text-[0.84rem] font-medium text-[color:var(--color-ink-soft)] transition-[background-color,border-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-ink)] active:scale-[0.97]"
            }
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

function SkeletonList({ count }: { count: number }) {
  return (
    <ul className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          className="rounded-2xl border-[1.5px] border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-5 shadow-[var(--shadow-paper)]"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[color:var(--color-paper-3)] shimmer" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-1/3 rounded bg-[color:var(--color-paper-3)] shimmer" />
              <div className="h-2.5 w-1/4 rounded bg-[color:var(--color-paper-3)] shimmer" />
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <div className="h-3 w-full rounded bg-[color:var(--color-paper-3)] shimmer" />
            <div className="h-3 w-3/4 rounded bg-[color:var(--color-paper-3)] shimmer" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ filter }: { filter: PostType | "all" }) {
  const filterLabel = useMemo(
    () => FILTERS.find((f) => f.id === filter)?.label.toLowerCase() ?? "posts",
    [filter],
  );
  return (
    <div className="rounded-2xl border-[1.5px] border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-paper-2)]/40 px-6 py-14 text-center">
      <p className="font-[family-name:var(--font-display)] text-[1.2rem] font-semibold leading-tight text-[color:var(--color-ink)]">
        {filter === "all"
          ? "No posts in the last two weeks."
          : `No ${filterLabel} shared lately.`}
      </p>
      <p className="mx-auto mt-2 max-w-[42ch] text-[0.92rem] leading-relaxed text-[color:var(--color-ink-soft)]">
        Be the first one. Share a sentence, a word, or a milestone from
        whatever you're reading.
      </p>
      <p className="mt-5 text-[0.86rem]">
        <Link
          href="/join"
          className="font-semibold text-[color:var(--color-ink)] underline decoration-[color:var(--color-saffron)] decoration-2 underline-offset-4"
        >
          Start reading on Translify
        </Link>
      </p>
    </div>
  );
}
