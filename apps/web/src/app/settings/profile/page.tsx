"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { me } from "@/lib/auth";
import {
  claimUsername,
  patchProfile,
  type PublicProfile,
} from "@/lib/social";
import { AvatarPicker } from "@/components/avatar-picker";
import { MarketingHeader } from "@/components/marketing-header";

/**
 * Public-profile settings. Claim a handle, write a bio, set the public
 * visibility flag, point at an avatar.
 *
 * Anonymous "ghost" users see a soft prompt to claim their account first;
 * the underlying API call returns 402 EmailRequired for them and the page
 * surfaces that as a link to /onboarding.
 */
export default function SocialProfileSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profilePublic, setProfilePublic] = useState(true);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [savingHandle, setSavingHandle] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState<"handle" | "meta" | null>(null);

  // Bootstrap from /users/me. Anonymous accounts are sent through onboarding
  // first; the underlying API returns 402 in that case.
  useEffect(() => {
    (async () => {
      try {
        const u = await me();
        setProfile({
          id: u.id,
          username: u.username ?? null,
          display_name: u.display_name ?? null,
          bio: u.bio ?? null,
          avatar_url: u.avatar_url ?? null,
          profile_public: u.profile_public ?? true,
          created_at: u.created_at ?? new Date().toISOString(),
          post_count: 0,
          follower_count: 0,
          following_count: 0,
          is_following: false,
        });
        setUsername(u.username ?? "");
        setBio(u.bio ?? "");
        setAvatarUrl(u.avatar_url ?? "");
        setProfilePublic(u.profile_public ?? true);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return;
        }
        if (err instanceof ApiError && err.status === 402) {
          router.replace("/onboarding");
          return;
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const onClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError(null);
    setSavingHandle(true);
    try {
      const updated = await claimUsername(username);
      setProfile(updated);
      setSavedFlash("handle");
      setTimeout(() => setSavedFlash(null), 1800);
    } catch (err) {
      if (err instanceof ApiError) {
        const detail = err.body as { detail?: string } | null;
        setUsernameError(detail?.detail ?? "Couldn't claim that handle.");
      } else {
        setUsernameError("Couldn't reach the server. Try again in a moment.");
      }
    } finally {
      setSavingHandle(false);
    }
  };

  const onSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    setMetaError(null);
    setSavingMeta(true);
    try {
      const updated = await patchProfile({
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        profile_public: profilePublic,
      });
      setProfile(updated);
      setSavedFlash("meta");
      setTimeout(() => setSavedFlash(null), 1800);
    } catch (err) {
      setMetaError(
        err instanceof ApiError
          ? "Couldn't save your profile. Try again."
          : "Couldn't reach the server.",
      );
    } finally {
      setSavingMeta(false);
    }
  };

  if (loading) {
    return (
      <>
        <MarketingHeader compact />
        <main className="mx-auto max-w-2xl px-6 py-16">
          <p className="text-[color:var(--color-ink-soft)]">Loading your profile…</p>
        </main>
      </>
    );
  }

  const claimed = !!profile?.username;
  const charsLeft = 160 - bio.length;

  return (
    <>
      <MarketingHeader compact />
      <main className="mx-auto max-w-2xl px-5 py-12 sm:px-6 lg:py-16">
        <header className="mb-10">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[color:var(--color-ink-soft)]">
            Your public profile
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.9rem,4vw,2.6rem)] font-semibold leading-tight tracking-tight">
            {claimed ? "Your handle is yours." : "Pick a handle."}
          </h1>
          <p className="mt-3 max-w-[55ch] text-[0.95rem] leading-relaxed text-[color:var(--color-ink-soft)]">
            This is the page people see when you share a sentence, a word, or
            a milestone. You can change the bio and avatar anytime. The handle
            is forever.
          </p>
          {claimed && (
            <p className="mt-3 text-sm">
              <Link
                href={`/u/${encodeURIComponent(profile!.username!)}`}
                className="font-semibold text-[color:var(--color-ink)] underline decoration-[color:var(--color-saffron)] decoration-2 underline-offset-4"
              >
                See your profile, @{profile!.username}
              </Link>
            </p>
          )}
        </header>

        {/* Handle */}
        <section className="mb-12">
          <h2 className="font-[family-name:var(--font-display)] text-[1.15rem] font-semibold tracking-tight">
            Handle
          </h2>
          <form onSubmit={onClaim} className="mt-4 flex flex-col gap-3">
            <label
              htmlFor="username"
              className="text-[0.85rem] font-semibold text-[color:var(--color-ink)]"
            >
              Username
            </label>
            <div className="flex items-stretch overflow-hidden rounded-2xl border-[1.5px] border-[color:var(--color-border-strong)] bg-white focus-within:border-[color:var(--color-saffron-deep)]">
              <span className="grid place-items-center px-3.5 text-[0.95rem] font-semibold text-[color:var(--color-ink-soft)]">
                translify.app/@
              </span>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                disabled={claimed || savingHandle}
                placeholder="bfahmi"
                minLength={3}
                maxLength={20}
                pattern="[a-z0-9_]+"
                autoComplete="off"
                spellCheck={false}
                className="flex-1 bg-transparent px-2 py-3 text-[0.98rem] outline-none placeholder:text-[color:var(--color-ink-soft)]/55 disabled:opacity-60"
              />
            </div>
            <p className="text-[0.78rem] text-[color:var(--color-ink-soft)]">
              3 to 20 characters. Lowercase letters, numbers, and underscores.
              Handles cannot be changed once claimed.
            </p>
            {usernameError && (
              <div
                className="rounded-xl border px-4 py-3 text-sm"
                style={{
                  borderColor: "rgba(220,38,38,0.30)",
                  background: "rgba(220,38,38,0.07)",
                  color: "#B91C1C",
                }}
              >
                {usernameError}
              </div>
            )}
            {!claimed && (
              <button
                type="submit"
                disabled={savingHandle || username.length < 3}
                className="self-start inline-flex h-12 items-center gap-2 rounded-full bg-[color:var(--color-ink)] px-6 font-semibold text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4),0_10px_22px_-8px_rgba(20,16,8,0.4)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-[2px] active:scale-[0.97] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
              >
                {savingHandle ? "Claiming…" : "Claim handle"}
              </button>
            )}
            {savedFlash === "handle" && (
              <p className="text-[0.85rem] font-semibold text-[color:var(--color-sage-deep)]">
                ✓ Handle saved.
              </p>
            )}
          </form>
        </section>

        {/* Bio + avatar + visibility */}
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-[1.15rem] font-semibold tracking-tight">
            Bio and avatar
          </h2>
          <form onSubmit={onSaveMeta} className="mt-4 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="bio" className="text-[0.85rem] font-semibold text-[color:var(--color-ink)]">
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 160))}
                rows={3}
                maxLength={160}
                placeholder="A line or two about what you read."
                className="resize-none rounded-2xl border-[1.5px] border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-[0.98rem] outline-none transition-colors duration-150 placeholder:text-[color:var(--color-ink-soft)]/55 focus:border-[color:var(--color-saffron-deep)]"
              />
              <p className="text-end text-[0.74rem] text-[color:var(--color-ink-soft)]">
                {charsLeft} characters left
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <AvatarPicker
                value={avatarUrl || null}
                onChange={(url) => setAvatarUrl(url ?? "")}
                initialSeed={profile?.username ?? null}
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border-[1.5px] border-[color:var(--color-border)] bg-[color:var(--color-paper-2)]/40 px-4 py-3">
              <input
                type="checkbox"
                checked={profilePublic}
                onChange={(e) => setProfilePublic(e.target.checked)}
                className="mt-1 h-4 w-4 accent-[color:var(--color-saffron-deep)]"
              />
              <span>
                <span className="block text-[0.92rem] font-semibold text-[color:var(--color-ink)]">
                  Public profile
                </span>
                <span className="mt-0.5 block text-[0.82rem] text-[color:var(--color-ink-soft)]">
                  When off, your /@handle page returns 404 to everyone except
                  you. Your existing public posts stay private with you.
                </span>
              </span>
            </label>

            {metaError && (
              <div
                className="rounded-xl border px-4 py-3 text-sm"
                style={{
                  borderColor: "rgba(220,38,38,0.30)",
                  background: "rgba(220,38,38,0.07)",
                  color: "#B91C1C",
                }}
              >
                {metaError}
              </div>
            )}

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={savingMeta}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[color:var(--color-saffron)] px-6 font-semibold text-[color:var(--color-accent-foreground)] shadow-[0_2px_0_rgba(140,90,30,0.5),0_10px_22px_-8px_rgba(200,137,62,0.6)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-[2px] active:scale-[0.97] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingMeta ? "Saving…" : "Save changes"}
              </button>
              {savedFlash === "meta" && (
                <p className="text-[0.85rem] font-semibold text-[color:var(--color-sage-deep)]">
                  ✓ Saved.
                </p>
              )}
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
