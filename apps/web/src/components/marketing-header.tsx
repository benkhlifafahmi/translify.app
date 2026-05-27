"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { TranslifyMark } from "@/components/translify-mark";
import { getToken } from "@/lib/api";
import { me, type User } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

/**
 * One header for every visitor-facing marketing surface.
 *
 * Menu anchors are absolute (`/#how` etc.) so they navigate back to home
 * before scrolling, which lets the same nav drop into /pricing, /manifesto,
 * /start, /languages, /contact, /blog without dead links.
 *
 * Auth-aware: when a token is present the right-side cluster swaps from
 * "Sign in / Get started" to a single "Library" pill (plus the user's avatar
 * if they have one). The optimistic check uses ``getToken()`` so logged-in
 * users don't see a flash of the logged-out variant before ``me()`` resolves.
 *
 * Pass `compact` for pages that need a tighter chrome (auth-adjacent
 * landings, in-app marketing). The home page uses the default.
 */
export function MarketingHeader({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  // Auth state has three possible values: undefined while bootstrapping,
  // null when logged out, a User when logged in. Optimistic from getToken()
  // so the right-side cluster doesn't flicker for the common (logged-in)
  // case.
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!getToken()) {
      setUser(null);
      return;
    }
    let cancelled = false;
    me()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        // Token invalid / expired. Treat as logged out for the header.
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Optimistic guess for the very first render: if there's a token in
  // storage we assume logged-in until proven otherwise. Anonymous (ghost)
  // accounts still surface the logged-out CTAs because they shouldn't be
  // directed back into the same shelf they came from.
  const tokenPresent = typeof window !== "undefined" && !!getToken();
  const loggedIn =
    user === undefined
      ? tokenPresent
      : user !== null && !user.is_anonymous;

  return (
    <nav
      className={`relative z-20 flex items-center justify-between gap-2 px-5 sm:px-8 lg:px-14 ${
        compact ? "py-3 sm:py-4" : "py-4 sm:py-6"
      }`}
    >
      <Link href="/" aria-label="Translify" className="flex items-center">
        <TranslifyMark size={36} wordmarkClassName="hidden text-2xl sm:inline" />
      </Link>

      {!compact && (
        <div className="hidden items-center gap-7 text-sm font-medium text-[color:var(--color-ink-soft)] md:flex">
          <Link href="/#how" className="transition-colors duration-150 hover:text-[color:var(--color-ink)]">{t("nav.how")}</Link>
          <Link href="/#features" className="transition-colors duration-150 hover:text-[color:var(--color-ink)]">{t("nav.features")}</Link>
          <Link href="/discover" className="transition-colors duration-150 hover:text-[color:var(--color-ink)]">{t("nav.discover")}</Link>
          <Link href="/pricing" className="transition-colors duration-150 hover:text-[color:var(--color-ink)]">{t("nav.pricing")}</Link>
          <Link href="/#faq" className="transition-colors duration-150 hover:text-[color:var(--color-ink)]">{t("nav.faq")}</Link>
        </div>
      )}

      <div className="flex shrink-0 items-center gap-1 text-sm sm:gap-2">
        <LanguageSwitcher />
        {loggedIn ? (
          <LoggedInActions user={user ?? null} />
        ) : (
          <LoggedOutActions />
        )}
      </div>
    </nav>
  );
}

function LoggedOutActions() {
  const { t } = useI18n();
  return (
    <>
      <Link
        href="/login"
        className="hidden rounded-full px-3 py-2 font-medium text-[color:var(--color-ink-soft)] transition-colors duration-150 hover:text-[color:var(--color-ink)] sm:inline-block sm:px-4"
      >
        {t("nav.login")}
      </Link>
      <Link
        href="/join"
        className="rounded-full bg-[color:var(--color-ink)] px-3.5 py-2 text-[0.85rem] font-semibold text-[color:var(--color-primary-foreground)] shadow-[0_2px_0_rgba(20,16,8,0.4),0_8px_18px_-8px_rgba(20,16,8,0.5)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-[1px] active:scale-[0.97] active:translate-y-0 sm:px-5 sm:text-sm"
      >
        {t("nav.cta")}
      </Link>
    </>
  );
}

function LoggedInActions({ user }: { user: User | null }) {
  const profileHref = user?.username ? `/u/${encodeURIComponent(user.username)}` : "/settings/profile";
  return (
    <>
      {user?.username && (
        <Link
          href={profileHref}
          aria-label={`@${user.username}`}
          className="hidden h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)] transition-[transform,border-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[color:var(--color-ink)] active:scale-[0.97] sm:inline-flex"
        >
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar_url}
              alt=""
              width={36}
              height={36}
              className="h-full w-full object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="font-[family-name:var(--font-display)] text-[0.86rem] font-semibold text-[color:var(--color-ink-soft)]"
            >
              {(user.display_name ?? user.username ?? "?")[0].toUpperCase()}
            </span>
          )}
        </Link>
      )}
      <Link
        href="/library"
        className="rounded-full bg-[color:var(--color-ink)] px-3.5 py-2 text-[0.85rem] font-semibold text-[color:var(--color-primary-foreground)] shadow-[0_2px_0_rgba(20,16,8,0.4),0_8px_18px_-8px_rgba(20,16,8,0.5)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-[1px] active:scale-[0.97] active:translate-y-0 sm:px-5 sm:text-sm"
      >
        Library
      </Link>
    </>
  );
}
