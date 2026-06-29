/**
 * Public reader profile at /u/[username].
 *
 * Server component for SEO + initial-paint speed. Fetches the profile and
 * the first page of posts in parallel from the backend. The follow button
 * is a tiny client island below the bio.
 *
 * Empty / 404 states are handled at the fetch layer: the API returns 404
 * when the profile is private to non-owners, so we surface a generic
 * "not found" page in those cases. We deliberately don't differentiate
 * private-vs-doesn't-exist to avoid leaking handle existence.
 */
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api";
import { getPublicProfile, listUserPosts, type Post, type PublicProfile } from "@/lib/social";
import { PostCard } from "@/components/post-card";
import { FollowButton } from "@/components/follow-button";
import { AppShell } from "@/components/library/app-shell";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";

interface PageProps {
  params: Promise<{ username: string }>;
}

async function loadProfile(username: string): Promise<{
  profile: PublicProfile;
  posts: Post[];
} | null> {
  try {
    const [profile, posts] = await Promise.all([
      getPublicProfile(username),
      listUserPosts(username, { limit: 30 }),
    ]);
    return { profile, posts };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const data = await loadProfile(username).catch(() => null);
  if (!data) {
    return { title: "Profile not found · Translify" };
  }
  const { profile } = data;
  const displayName = profile.display_name ?? `@${profile.username}`;
  const title = `${displayName} on Translify`;
  const description =
    profile.bio?.trim() ||
    `${displayName} on Translify. ${profile.post_count} ${
      profile.post_count === 1 ? "post" : "posts"
    }.`;
  const url = `${SITE}/u/${encodeURIComponent(profile.username ?? username)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      url,
      title,
      description,
      siteName: "Translify",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: profile.profile_public ? undefined : { index: false, follow: false },
  };
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;
  const data = await loadProfile(username);
  if (!data) notFound();

  const { profile, posts } = data;
  const displayName = profile.display_name ?? `@${profile.username}`;

  return (
    <AppShell title={displayName}>
      <div className="mx-auto max-w-3xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar
            src={profile.avatar_url}
            fallback={(profile.display_name ?? profile.username ?? "?")[0]}
          />
          <div className="min-w-0 flex-1">
            <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.8rem,3.6vw,2.4rem)] font-semibold leading-tight tracking-tight text-[color:var(--color-ink)]">
              {displayName}
            </h1>
            <p className="mt-1 text-[0.92rem] text-[color:var(--color-ink-soft)]">
              @{profile.username}
            </p>
            {profile.bio && (
              <p className="mt-3 max-w-[55ch] text-[0.96rem] leading-relaxed text-[color:var(--color-ink)]">
                {profile.bio}
              </p>
            )}
            <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 text-[0.86rem] text-[color:var(--color-ink-soft)]">
              <Stat label="posts" value={profile.post_count} />
              <Stat label="followers" value={profile.follower_count} />
              <Stat label="following" value={profile.following_count} />
            </dl>
            <div className="mt-5">
              <FollowButton
                targetUserId={profile.id}
                initialFollowing={profile.is_following}
                initialFollowerCount={profile.follower_count}
              />
            </div>
          </div>
        </header>

        <section className="mt-12">
          {posts.length === 0 ? (
            <EmptyState username={profile.username ?? username} />
          ) : (
            <ul className="flex flex-col gap-4">
              {posts.map((post) => (
                <li key={post.id}>
                  <PostCard post={post} hideAuthor />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Avatar({ src, fallback }: { src?: string | null; fallback: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={96}
        height={96}
        className="h-20 w-20 shrink-0 rounded-full border-[1.5px] border-[color:var(--color-border-strong)] object-cover shadow-[var(--shadow-paper)] sm:h-24 sm:w-24"
      />
    );
  }
  return (
    <span
      aria-hidden
      className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-[1.5px] border-[color:var(--color-border-strong)] bg-[color:var(--color-paper-2)] font-[family-name:var(--font-display)] text-[1.8rem] font-semibold uppercase text-[color:var(--color-ink-soft)] shadow-[var(--shadow-paper)] sm:h-24 sm:w-24 sm:text-[2.1rem]"
    >
      {fallback.toUpperCase()}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="sr-only">{label}</dt>
      <dd className="font-semibold text-[color:var(--color-ink)]">{value}</dd>
      <span className="text-[color:var(--color-ink-soft)]">{label}</span>
    </div>
  );
}

function EmptyState({ username }: { username: string }) {
  return (
    <div className="rounded-2xl border-[1.5px] border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-paper-2)]/40 px-6 py-12 text-center">
      <p className="font-[family-name:var(--font-display)] text-[1.2rem] font-semibold leading-tight text-[color:var(--color-ink)]">
        Nothing posted yet.
      </p>
      <p className="mx-auto mt-2 max-w-[40ch] text-[0.92rem] leading-relaxed text-[color:var(--color-ink-soft)]">
        When @{username} shares a sentence, a word, or a milestone, it'll
        show up here.
      </p>
      <p className="mt-5 text-[0.86rem]">
        <Link
          href="/discover"
          className="font-semibold text-[color:var(--color-ink)] underline decoration-[color:var(--color-saffron)] decoration-2 underline-offset-4"
        >
          See what others are reading
        </Link>
      </p>
    </div>
  );
}
