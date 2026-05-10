// Excerpt for: apps/web/src/app/layout.tsx
//
// Replaces the metadata + viewport block. Changes from current:
//
// 1. Title repositioned around "understand" not "translate" — the unique sell
//    (chat + highlights + quiz) and the saturated commodity ("translate")
//    swap places.
// 2. Description rewritten for click-through: leads with the differentiating
//    promise (understand, not just translate), names the file types and
//    feature stack, ends with the trust signal (30-day money-back).
// 3. Keywords cleaned up — removed exact-match "chat with PDF" and
//    "translate PDF" (unwinnable graveyards), added the new niche keywords.
// 4. inLanguage list extended to include id + ms (matches actual UI).
// 5. metadataBase set explicitly so all relative OG/icon paths resolve.

import type { Metadata, Viewport } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF6EE" },
    { media: "(prefers-color-scheme: dark)",  color: "#20283A" },
  ],
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE),

  title: {
    default: "Translify — Understand any book, in any language",
    template: "%s · Translify",
  },

  description:
    "Read any PDF or EPUB in 14 languages with the layout preserved. Chat with the whole book and get cited answers, highlight passages for AI explanations in your language, and quiz yourself to remember what you read. 30-day money-back, no questions.",

  applicationName: "Translify",

  keywords: [
    // Tier 1 (new positioning) — winnable
    "understand foreign language book AI",
    "AI study companion for books",
    "chat with foreign language book",
    "read books in another language with AI",
    "AI book reader for students",
    "AI book reader for researchers",
    // Tier 2 — programmatic
    "read Spanish books in English",
    "read German books in English",
    "read French books in English",
    "read Japanese books in English",
    "translate EPUB book AI",
    // Brand
    "Translify app",
    "Translify book reader",
  ],

  authors: [{ name: "Translify", url: SITE }],
  creator: "Translify",
  publisher: "Translify",
  category: "Education",

  alternates: {
    canonical: "/",
    // hreflang alternates are emitted manually in <head> because
    // Next's metadata.alternates.languages strips query strings.
  },

  openGraph: {
    type: "website",
    siteName: "Translify",
    title: "Translify — Understand any book, in any language",
    description:
      "Upload any PDF or EPUB. Read it in 14 languages with the layout preserved. Chat with the book, highlight for AI explanations, quiz yourself.",
    url: SITE,
    locale: "en_US",
    alternateLocale: [
      "fr_FR", "es_ES", "de_DE", "ja_JP", "ar_SA", "id_ID", "ms_MY",
    ],
    images: [
      {
        url: "/og-image.png", // ⚠️ Currently returns 404 — generate before launch.
        width: 1200,
        height: 630,
        alt: "Translify — read, translate, chat with, and remember any book.",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Translify — Understand any book, in any language",
    description:
      "Upload a PDF or EPUB. Read it in 14 languages with layout preserved. Chat with the book, highlight for AI explanations, quiz yourself.",
    site: "@translifyapp",
    creator: "@translifyapp",
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },

  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" }, // ⚠️ Currently 404 — generate
      { url: "/icon-32.png",  type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" }, // ⚠️ Currently 404 — generate
    ],
  },

  manifest: "/manifest.webmanifest",

  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};
