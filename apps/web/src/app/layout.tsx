import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { StructuredData } from "@/components/structured-data";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";

export const viewport: Viewport = {
  themeColor: "#FAF6EE",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Translify — Read any book in your language",
    template: "%s · Translify",
  },
  description:
    "Translate whole PDFs and EPUBs into 14 languages while keeping the original layout, then chat with the book and quiz yourself. 30-day money-back, no questions.",
  applicationName: "Translify",
  keywords: [
    "book translator",
    "translate PDF",
    "translate EPUB",
    "read books in any language",
    "AI book chat",
    "language learning",
    "PDF translation with layout",
    "RTL book reader",
    "Arabic PDF translation",
    "Japanese book translation",
  ],
  authors: [{ name: "Translify", url: SITE }],
  creator: "Translify",
  publisher: "Translify",
  category: "Education",
  alternates: {
    canonical: "/",
    languages: {
      "x-default": "/",
      en: "/?lang=en",
      fr: "/?lang=fr",
      es: "/?lang=es",
      de: "/?lang=de",
      ja: "/?lang=ja",
      ar: "/?lang=ar",
    },
  },
  openGraph: {
    type: "website",
    siteName: "Translify",
    title: "Translify — Read any book in your language",
    description:
      "Drop in a PDF or EPUB. Read it in 14 languages with the layout preserved. Chat with citations. Quiz yourself. 30-day money-back.",
    url: SITE,
    locale: "en_US",
    alternateLocale: ["fr_FR", "es_ES", "de_DE", "ja_JP", "ar_SA"],
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Translify — read any book in your language, with citations and quizzes.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Translify — Read any book in your language",
    description:
      "Translate whole PDFs and EPUBs into 14 languages while keeping the original layout. Chat with the book. Quiz yourself.",
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
      { url: "/favicon.ico" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  other: {
    "format-detection": "telephone=no",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${hanken.variable}`}
    >
      <head>
        <StructuredData />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
