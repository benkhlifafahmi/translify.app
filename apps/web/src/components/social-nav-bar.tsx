"use client";

/**
 * In-app navigation for the social surfaces. The MarketingHeader lives on
 * the public pages; /library and other logged-in surfaces don't render it,
 * so without this bar a signed-in user has no entry to /feed, /discover,
 * /search, or their own profile.
 *
 * Renders four pill links. The first is handle-aware:
 *   - claimed:   "Your profile" → /u/<handle>
 *   - unclaimed: "Claim a handle" → /settings/profile
 *
 * For anonymous (ghost) accounts the bar shows a single onboarding nudge
 * instead, since social actions all require a real account.
 */
import Link from "next/link";
import type { User } from "@/lib/auth";

interface Props {
  user: User | null | undefined;
  /** Optional path-of-currently-active link (for highlighting). */
  active?: "profile" | "feed" | "discover" | "search";
}

export function SocialNavBar({ user, active }: Props) {
  if (user?.is_anonymous) {
    return (
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 rounded-2xl border-[1.5px] border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-paper-2)]/40 px-5 py-3 text-[0.86rem]">
        <p className="text-[color:var(--color-ink-soft)]">
          Add your email to share sentences and follow other readers.
        </p>
        <Link
          href="/onboarding"
          className="inline-flex h-9 items-center rounded-full bg-[color:var(--color-ink)] px-4 text-[0.82rem] font-semibold text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4),0_8px_18px_-8px_rgba(20,16,8,0.4)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-[1px] active:scale-[0.97] active:translate-y-0"
        >
          Claim your account
        </Link>
      </div>
    );
  }

  const profileHref = user?.username
    ? `/u/${encodeURIComponent(user.username)}`
    : "/settings/profile";
  const profileLabel = user?.username ? "Your profile" : "Claim a handle";

  return (
    <nav
      aria-label="Social"
      className="-mx-1 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <Pill
        href={profileHref}
        label={profileLabel}
        active={active === "profile"}
        icon={<UserIcon />}
        tone="saffron"
      />
      <Pill
        href="/feed"
        label="Feed"
        active={active === "feed"}
        icon={<FeedIcon />}
        tone="sage"
      />
      <Pill
        href="/discover"
        label="Discover"
        active={active === "discover"}
        icon={<CompassIcon />}
        tone="coral"
      />
      <Pill
        href="/search"
        label="Find people"
        active={active === "search"}
        icon={<SearchIcon />}
        tone="plum"
      />
    </nav>
  );
}

type Tone = "saffron" | "sage" | "coral" | "plum";

function Pill({
  href,
  label,
  active,
  icon,
  tone,
}: {
  href: string;
  label: string;
  active?: boolean;
  icon: React.ReactNode;
  tone: Tone;
}) {
  const tones: Record<Tone, { dot: string; ring: string }> = {
    saffron: { dot: "bg-[color:var(--color-saffron)]", ring: "ring-[color:var(--color-saffron)]/30" },
    sage:    { dot: "bg-[color:var(--color-sage)]",    ring: "ring-[color:var(--color-sage)]/30" },
    coral:   { dot: "bg-[color:var(--color-coral)]",   ring: "ring-[color:var(--color-coral)]/30" },
    plum:    { dot: "bg-[color:var(--color-plum)]",    ring: "ring-[color:var(--color-plum)]/30" },
  };
  const t = tones[tone];
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? `inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[color:var(--color-ink)] px-4 text-[0.86rem] font-semibold text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4)] transition-[transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]`
          : `group inline-flex h-10 shrink-0 items-center gap-2 rounded-full border-[1.5px] border-[color:var(--color-border)] bg-[color:var(--color-paper)] px-4 text-[0.86rem] font-medium text-[color:var(--color-ink)] transition-[transform,border-color,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-[1px] hover:border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-paper-2)] active:scale-[0.97] ring-1 ring-transparent group-hover:${t.ring}`
      }
    >
      <span aria-hidden className={`grid h-5 w-5 place-items-center rounded-full ${active ? "bg-white/15 text-white" : "bg-[color:var(--color-paper-2)] text-[color:var(--color-ink-soft)]"}`}>
        {icon}
      </span>
      {label}
      {!active && (
        <span aria-hidden className={`ml-1 h-1.5 w-1.5 rounded-full ${t.dot}`} />
      )}
    </Link>
  );
}

/* ── Icons (12-14px, project's hand-rolled style) ─────────────────────── */

function UserIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function FeedIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11a9 9 0 0 1 9 9" />
      <path d="M4 4a16 16 0 0 1 16 16" />
      <circle cx="5" cy="19" r="1" />
    </svg>
  );
}

function CompassIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 9.5 12 14l-4.5 2.5L10 12l4.5-2.5Z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}
