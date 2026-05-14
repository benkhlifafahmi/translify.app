import type { Metadata } from "next";
import CookiesClient from "./cookies-client";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";
const UPDATED = "2026-05-12";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Translify uses minimal cookies and storage — only what's needed to keep you logged in and to run the service. No advertising trackers, no behavioral targeting.",
  alternates: { canonical: "/cookies" },
  openGraph: {
    title: "Cookie Policy — Translify",
    description: "Minimal cookies. No advertising trackers. Here's the full list.",
    url: `${SITE}/cookies`,
  },
};

export default function CookiesPage() {
  return <CookiesClient lastUpdated={UPDATED} />;
}
