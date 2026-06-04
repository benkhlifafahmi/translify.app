import type { Metadata } from "next";
import { StudyClient } from "./study-client";

// Dedicated paid-social landing page (mostly mobile). Noindexed so it does not
// compete with the homepage in organic search; ad traffic lands here directly.
// The hero runs an A/B experiment (flag `study-hero`) — see study-client.tsx.
export const metadata: Metadata = {
  title: "Study any book, ace the exam",
  description:
    "Turn any textbook, paper, or PDF into a study workspace: a tutor with cited answers, quizzes and flashcards from your reading, and a focus timer. Start free, no card.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/study" },
};

export default function StudyPage() {
  return <StudyClient />;
}
