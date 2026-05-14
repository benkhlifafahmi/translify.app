import type { Metadata } from "next";
import StartClient from "./start-client";

// Ad landing page — intentionally noindex to avoid competing with the homepage.
export const metadata: Metadata = {
  title: "Read any book — in any language · Translify",
  description:
    "Upload a PDF or EPUB. Translify rebuilds it in your language, with AI explanations, book chat, and quiz mode.",
  robots: { index: false, follow: false },
};

export default function StartPage() {
  return <StartClient />;
}
