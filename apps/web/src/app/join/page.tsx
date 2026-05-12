import type { Metadata } from "next";
import { JoinClient } from "./join-client";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";

export const metadata: Metadata = {
  title: "Start reading any book in your language — Translify",
  description:
    "Upload any PDF or EPUB. Translify rebuilds it in your language, layout intact. Chat with the book, quiz yourself, build real fluency. Free to start.",
  alternates: { canonical: "/join" },
  openGraph: {
    title: "Read any book. Finally in your language.",
    description: "AI-powered translation that preserves layout. Chat with your book. Free to start.",
    url: `${SITE}/join`,
  },
};

export default function JoinPage() {
  return <JoinClient />;
}
