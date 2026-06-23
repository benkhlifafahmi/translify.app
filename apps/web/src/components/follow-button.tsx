"use client";

/**
 * Profile action button below the bio on /u/[username].
 *
 * Renders one of three states, decided client-side after a fetch of /users/me:
 *   - Owner (you're viewing your own profile) → "Edit profile" link to /settings/profile
 *   - Follower → "Follow" / "Following" toggle with optimistic updates
 *   - Anonymous / signed-out → "Follow" button that bounces to /login on click
 *
 * Until /users/me resolves we render the Follow button optimistically (it
 * was the only behaviour before owner-aware logic; now it's also the
 * sensible fallback for the brief loading window).
 */
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, getToken } from "@/lib/api";
import { me } from "@/lib/auth";
import { followUser, unfollowUser } from "@/lib/social";
import { useI18n } from "@/lib/i18n";

interface Props {
  targetUserId: string;
  initialFollowing: boolean;
  initialFollowerCount: number;
}

export function FollowButton({
  targetUserId,
  initialFollowing,
  initialFollowerCount,
}: Props) {
  const { t, tn } = useI18n();
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  // null = "not yet resolved or not logged in".
  const [viewerId, setViewerId] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    me()
      .then((u) => {
        if (!cancelled) setViewerId(u.id);
      })
      .catch(() => { /* token invalid; leave anonymous */ });
    return () => {
      cancelled = true;
    };
  }, []);

  const isOwner = viewerId === targetUserId;

  if (isOwner) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/settings/profile"
          className="inline-flex h-10 items-center gap-2 rounded-full border-[1.5px] border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)] px-5 text-[0.92rem] font-semibold text-[color:var(--color-ink)] transition-[transform,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[color:var(--color-paper-2)] active:scale-[0.97]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          {t("follow.editProfile")}
        </Link>
        <p className="text-[0.84rem] text-[color:var(--color-ink-soft)]">
          <span className="font-semibold text-[color:var(--color-ink)]">{followerCount}</span>{" "}
          {tn("follow.followers", followerCount)}
        </p>
      </div>
    );
  }

  const handle = async () => {
    if (busy) return;
    if (!getToken()) {
      // Anonymous / signed-out: bounce to login keeping the return path.
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setBusy(true);
    const wasFollowing = following;
    // Optimistic
    setFollowing(!wasFollowing);
    setFollowerCount((n) => n + (wasFollowing ? -1 : 1));
    try {
      const res = wasFollowing
        ? await unfollowUser(targetUserId)
        : await followUser(targetUserId);
      setFollowing(res.is_following);
      setFollowerCount(res.follower_count);
      startTransition(() => router.refresh());
    } catch (err) {
      // Roll back
      setFollowing(wasFollowing);
      setFollowerCount((n) => n + (wasFollowing ? 1 : -1));
      if (err instanceof ApiError && err.status === 402) {
        router.push("/onboarding");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handle}
        disabled={busy}
        aria-pressed={following}
        className={
          following
            ? "inline-flex h-10 items-center rounded-full border-[1.5px] border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)] px-5 text-[0.92rem] font-semibold text-[color:var(--color-ink)] transition-[transform,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[color:var(--color-paper-2)] active:scale-[0.97] disabled:opacity-50"
            : "inline-flex h-10 items-center rounded-full bg-[color:var(--color-ink)] px-5 text-[0.92rem] font-semibold text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4),0_8px_18px_-8px_rgba(20,16,8,0.4)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-[1px] active:scale-[0.97] active:translate-y-0 disabled:opacity-50"
        }
      >
        {following ? t("follow.following") : t("follow.follow")}
      </button>
      <p className="text-[0.84rem] text-[color:var(--color-ink-soft)]">
        <span className="font-semibold text-[color:var(--color-ink)]">{followerCount}</span>{" "}
        {tn("follow.followers", followerCount)}
      </p>
    </div>
  );
}
