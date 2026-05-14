import type { Metadata } from "next";
import PrivacyClient from "./privacy-client";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";
const UPDATED = "2026-05-11";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Translify collects, uses, and protects your data. What we do with the books you upload, who we share data with, and the rights you have over your information.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy — Translify",
    description: "How we collect, use, and protect your data.",
    url: `${SITE}/privacy`,
  },
};

export default function PrivacyPage() {
  return <PrivacyClient lastUpdated={UPDATED} />;
}
