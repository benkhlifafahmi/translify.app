"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
// Default to the reverse proxy; fall back to direct EU endpoint if not set.
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!KEY) return;
    posthog.init(KEY, {
      api_host: HOST,
      // We fire $pageview manually on every SPA route change below.
      capture_pageview: false,
      // PostHog records scroll depth and session duration via $pageleave.
      // We fire it manually on SPA transitions; the SDK fires it on real unload.
      capture_pageleave: true,
    });
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}

// Fires $pageleave → $pageview on every Next.js route change.
// This keeps session duration and scroll depth accurate for SPAs.
export function PostHogPageview() {
  const pathname = usePathname();
  const prevPathname = useRef<string | null>(null);

  useEffect(() => {
    if (!KEY) return;

    // On SPA navigation, close out the previous page before opening a new one.
    if (prevPathname.current !== null && prevPathname.current !== pathname) {
      posthog.capture("$pageleave");
    }

    posthog.capture("$pageview");
    prevPathname.current = pathname;
  }, [pathname]);

  return null;
}
