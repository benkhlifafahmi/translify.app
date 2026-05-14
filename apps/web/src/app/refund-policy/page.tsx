import type { Metadata } from "next";
import RefundClient from "./refund-client";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";
const UPDATED = "2026-05-11";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "Every paid plan includes a 30-day money-back guarantee. No questions asked. Reply to your welcome email and we'll refund you within 1–2 business days.",
  alternates: { canonical: "/refund-policy" },
  openGraph: {
    title: "Refund Policy — Translify",
    description: "30-day money-back guarantee. No questions asked.",
    url: `${SITE}/refund-policy`,
  },
};

export default function RefundPage() {
  return <RefundClient lastUpdated={UPDATED} />;
}
