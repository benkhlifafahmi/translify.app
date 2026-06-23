"use client";

/**
 * Home feed at /feed: posts from people you follow + your own.
 *
 * Auth-gated. Anonymous and logged-out viewers are bounced to /login.
 * Empty state directs them to /discover, since most of /feed's value
 * depends on a populated follow graph.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, getToken } from "@/lib/api";
import { me, type User } from "@/lib/auth";
import { getFeed, type Post } from "@/lib/social";
import { PostCard } from "@/components/post-card";
import { MarketingHeader } from "@/components/marketing-header";
import { SocialNavBar } from "@/components/social-nav-bar";
import { useI18n } from "@/lib/i18n";

const PAGE_SIZE = 30;

export default function FeedPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bounce un-authed users + fetch the viewer (for the SocialNavBar handle).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!getToken()) {
      router.replace("/login?next=/feed");
      setAuthed(false);
      return;
    }
    setAuthed(true);
    me()
      .then(setUser)
      .catch(() => { /* silent — bar falls back to "Claim a handle" */ });
  }, [router]);

  const fetchPage = useCallback(
    async (cursor: string | undefined, replace: boolean) => {
      try {
        const next = await getFeed({ cursor, limit: PAGE_SIZE });
        setPosts((prev) => (replace ? next : [...prev, ...next]));
        setExhausted(next.length < PAGE_SIZE);
        setError(null);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login?next=/feed");
          return;
        }
        setError(
          err instanceof ApiError
            ? t("feed.error.load")
            : t("feed.error.server"),
        );
      }
    },
    [router],
  );

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    fetchPage(undefined, true).finally(() => setLoading(false));
  }, [authed, fetchPage]);

  if (authed === null || authed === false) {
    return (
      <>
        <MarketingHeader />
        <main className="mx-auto max-w-3xl px-5 py-16 sm:px-6">
          <p className="text-[color:var(--color-ink-soft)]">{t("feed.loading")}</p>
        </main>
      </>
    );
  }

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
        <header className="mb-8 flex items-baseline justify-between gap-3">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[color:var(--color-saffron-deep)]">
              {t("feed.eyebrow")}
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.9rem,4vw,2.6rem)] font-semibold leading-tight tracking-tight">
              {t("feed.heading")}
            </h1>
          </div>
          <Link
            href="/discover"
            className="hidden text-[0.86rem] font-semibold text-[color:var(--color-ink-soft)] underline decoration-dotted underline-offset-4 hover:text-[color:var(--color-ink)] sm:inline-block"
          >
            {t("feed.discoverLink")}
          </Link>
        </header>

        {loading && posts.length === 0 ? (
          <SkeletonList count={3} />
        ) : posts.length === 0 ? (
          <EmptyState />
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
              {loadingMore ? t("feed.loadingMore") : t("feed.loadMore")}
            </button>
          </div>
        )}

        {!loading && posts.length > 0 && exhausted && (
          <p className="mt-8 text-center text-[0.82rem] text-[color:var(--color-ink-soft)]">
            {t("feed.exhausted")}
          </p>
        )}
      </main>
    </>
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

function EmptyState() {
  const { t } = useI18n();
  return (
    <div className="rounded-2xl border-[1.5px] border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-paper-2)]/40 px-6 py-14 text-center">
      <p className="font-[family-name:var(--font-display)] text-[1.2rem] font-semibold leading-tight text-[color:var(--color-ink)]">
        {t("feed.empty.title")}
      </p>
      <p className="mx-auto mt-2 max-w-[42ch] text-[0.92rem] leading-relaxed text-[color:var(--color-ink-soft)]">
        {t("feed.empty.body")}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/discover"
          className="inline-flex h-11 items-center rounded-full bg-[color:var(--color-ink)] px-5 text-[0.92rem] font-semibold text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4),0_10px_22px_-8px_rgba(20,16,8,0.4)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-[1px] active:scale-[0.97] active:translate-y-0"
        >
          {t("feed.empty.browse")}
        </Link>
        <Link
          href="/search"
          className="inline-flex h-11 items-center rounded-full border-[1.5px] border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)] px-5 text-[0.92rem] font-semibold text-[color:var(--color-ink)] transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[color:var(--color-paper-2)] active:scale-[0.97]"
        >
          {t("feed.empty.findPeople")}
        </Link>
      </div>
    </div>
  );
}
