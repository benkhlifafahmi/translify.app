import type { Metadata } from "next";
import { JoinClient } from "./join-client";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";

export const metadata: Metadata = {
  title: "Pick your subject. Start studying free — Translify",
  description:
    "Tap a subject and jump straight into a real textbook: Biology, Chemistry, Physics, Calculus, CS, and more. Ask it anything with cited answers, quiz yourself, drill flashcards. Free to start, no card.",
  alternates: { canonical: "/join" },
  openGraph: {
    title: "Pick your subject. Start studying.",
    description: "Jump into a real textbook and study it with an AI tutor, quizzes, and flashcards. Free to start, no card.",
    url: `${SITE}/join`,
  },
};

export default function JoinPage() {
  return <JoinClient />;
}
