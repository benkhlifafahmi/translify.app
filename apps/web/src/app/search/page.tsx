"use client";

/**
 * User search at /search?q=...
 *
 * Debounced 250ms input. Results are user cards: avatar + handle + name +
 * one-line bio. Anonymous-safe (the backend route does not require auth).
 *
 * The Postgres ILIKE backend matches handle and display name. Bio is not
 * searched at the schema level on purpose: it's free-form prose that
 * would otherwise polute results with text matches against unrelated
 * profiles.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ApiError } from "@/lib/api";
import { searchUsers, type UserSearchResult } from "@/lib/social";
import { AppShell } from "@/components/library/app-shell";
import { useI18n } from "@/lib/i18n";

const DEBOUNCE_MS = 250;

export default function SearchPage() {
  const { t } = useI18n();
  return (
    <Suspense fallback={<Shell><p className="text-[color:var(--color-ink-soft)]">{t("search.loading")}</p></Shell>}>
      <SearchInner />
    </Suspense>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <AppShell title={t("search.heading")}>
      <div className="mx-auto max-w-2xl">{children}</div>
    </AppShell>
  );
}

function SearchInner() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [q, setQ] = useState(initial);
  const [debounced, setDebounced] = useState(initial.trim());
  const [results, setResults] = useState<UserSearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce the query.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [q]);

  // Keep ?q= in the URL bar in sync with the debounced query so the page
  // is shareable / refreshable.
  useEffect(() => {
    const url = debounced ? `/search?q=${encodeURIComponent(debounced)}` : "/search";
    router.replace(url, { scroll: false });
  }, [debounced, router]);

  // Fire the query when the debounced value changes.
  useEffect(() => {
    if (debounced.length < 2) {
      setResults(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    searchUsers(debounced)
      .then((res) => {
        if (!cancelled) setResults(res);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? t("search.error.failed")
              : t("search.error.unreachable"),
          );
          setResults([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  return (
    <Shell>
      <div className="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 grid -translate-y-1/2 place-items-center text-[color:var(--color-ink-soft)]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
          placeholder={t("search.placeholder")}
          aria-label={t("search.aria")}
          className="block h-14 w-full rounded-2xl border-[1.5px] border-[color:var(--color-border-strong)] bg-white pl-12 pr-4 text-[1rem] outline-none transition-colors duration-150 placeholder:text-[color:var(--color-ink-soft)]/55 focus:border-[color:var(--color-saffron-deep)]"
        />
      </div>

      <p className="mt-2 text-[0.78rem] text-[color:var(--color-ink-soft)]">
        {t("search.hint")}
      </p>

      <section className="mt-8">
        {debounced.length < 2 ? (
          <PromptState />
        ) : loading ? (
          <SkeletonList count={3} />
        ) : error ? (
          <p className="rounded-xl border-[1.5px] border-[color:var(--color-destructive)]/30 bg-[color:var(--color-destructive)]/8 px-4 py-3 text-sm text-[color:var(--color-destructive)]">
            {error}
          </p>
        ) : results && results.length === 0 ? (
          <NoResults query={debounced} />
        ) : results && results.length > 0 ? (
          <ul className="flex flex-col gap-2.5">
            {results.map((u) => (
              <li key={u.id}>
                <UserResult user={u} />
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </Shell>
  );
}

function UserResult({ user }: { user: UserSearchResult }) {
  const handle = user.username ?? "";
  return (
    <Link
      href={`/u/${encodeURIComponent(handle)}`}
      className="flex items-center gap-4 rounded-2xl border-[1.5px] border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-4 shadow-[var(--shadow-paper)] transition-[transform,border-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-[1px] hover:border-[color:var(--color-border-strong)] active:scale-[0.99]"
    >
      <Avatar src={user.avatar_url} fallback={(user.display_name ?? user.username ?? "?")[0]} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-[family-name:var(--font-display)] text-[1.02rem] font-semibold leading-tight text-[color:var(--color-ink)]">
          {user.display_name ?? `@${user.username}`}
        </p>
        <p className="truncate text-[0.82rem] text-[color:var(--color-ink-soft)]">@{user.username}</p>
        {user.bio && (
          <p className="mt-1 line-clamp-1 text-[0.84rem] leading-snug text-[color:var(--color-ink)]">
            {user.bio}
          </p>
        )}
      </div>
      <span
        aria-hidden
        className="grid h-8 w-8 shrink-0 place-items-center text-[color:var(--color-ink-soft)]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </span>
    </Link>
  );
}

function Avatar({ src, fallback }: { src?: string | null; fallback: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={48}
        height={48}
        className="h-12 w-12 shrink-0 rounded-full border border-[color:var(--color-border)] object-cover"
        loading="lazy"
      />
    );
  }
  return (
    <span
      aria-hidden
      className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[color:var(--color-paper-3)] font-[family-name:var(--font-display)] text-[1.1rem] font-semibold uppercase text-[color:var(--color-ink-soft)]"
    >
      {fallback?.toUpperCase()}
    </span>
  );
}

function PromptState() {
  const { t } = useI18n();
  return (
    <div className="rounded-2xl border-[1.5px] border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-paper-2)]/40 px-6 py-10 text-center">
      <p className="font-[family-name:var(--font-display)] text-[1.05rem] font-semibold leading-tight text-[color:var(--color-ink)]">
        {t("search.prompt.title")}
      </p>
      <p className="mx-auto mt-2 max-w-[40ch] text-[0.88rem] leading-relaxed text-[color:var(--color-ink-soft)]">
        {t("search.prompt.body")}
      </p>
      <p className="mt-4 text-[0.84rem]">
        <Link
          href="/discover"
          className="font-semibold text-[color:var(--color-ink)] underline decoration-[color:var(--color-saffron)] decoration-2 underline-offset-4"
        >
          {t("search.prompt.discover")}
        </Link>
      </p>
    </div>
  );
}

function NoResults({ query }: { query: string }) {
  const { t } = useI18n();
  return (
    <div className="rounded-2xl border-[1.5px] border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-paper-2)]/40 px-6 py-10 text-center">
      <p className="font-[family-name:var(--font-display)] text-[1.05rem] font-semibold leading-tight text-[color:var(--color-ink)]">
        {t("search.empty.title", { query })}
      </p>
      <p className="mx-auto mt-2 max-w-[40ch] text-[0.88rem] leading-relaxed text-[color:var(--color-ink-soft)]">
        {t("search.empty.body")}
      </p>
    </div>
  );
}

function SkeletonList({ count }: { count: number }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-4 rounded-2xl border-[1.5px] border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-4 shadow-[var(--shadow-paper)]"
        >
          <div className="h-12 w-12 rounded-full bg-[color:var(--color-paper-3)] shimmer" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-1/3 rounded bg-[color:var(--color-paper-3)] shimmer" />
            <div className="h-2.5 w-1/4 rounded bg-[color:var(--color-paper-3)] shimmer" />
          </div>
        </li>
      ))}
    </ul>
  );
}
