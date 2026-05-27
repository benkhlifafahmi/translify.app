"use client";

/**
 * Small client island that lives on /u/[username] below the bio. Handles
 * follow + unfollow with optimistic updates. If the viewer is anonymous or
 * logged out, the button routes to /login instead of attempting the call.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ApiError, getToken } from "@/lib/api";
import { followUser, unfollowUser } from "@/lib/social";

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
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

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
        {following ? "Following" : "Follow"}
      </button>
      <p className="text-[0.84rem] text-[color:var(--color-ink-soft)]">
        <span className="font-semibold text-[color:var(--color-ink)]">{followerCount}</span>{" "}
        {followerCount === 1 ? "follower" : "followers"}
      </p>
    </div>
  );
}
