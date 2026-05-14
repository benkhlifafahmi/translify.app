import type { Metadata } from "next";
import LanguagesClient from "./languages-client";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";

export const metadata: Metadata = {
  title: "All supported languages — 56 reading pairs",
  description:
    "Translify supports 8 languages across 56 source→target reading pairs. Read Spanish books in English, German books in French, Japanese books in Arabic, and 53 other combinations — every one with the original layout preserved.",
  alternates: { canonical: "/languages" },
  openGraph: {
    title: "All supported languages — Translify",
    description:
      "8 languages, 56 reading pairs. Find your source → target combination.",
    url: `${SITE}/languages`,
  },
};

export default function LanguagesPage() {
  return <LanguagesClient />;
}
