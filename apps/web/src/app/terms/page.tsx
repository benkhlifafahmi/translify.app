import type { Metadata } from "next";
import TermsClient from "./terms-client";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";
const UPDATED = "2026-05-11";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The agreement between you and Translify when you use the service — what you can do, what you can't, payment terms, refunds, and limitations.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Service — Translify",
    description: "The agreement between you and Translify.",
    url: `${SITE}/terms`,
  },
};

export default function TermsPage() {
  return <TermsClient lastUpdated={UPDATED} />;
}
