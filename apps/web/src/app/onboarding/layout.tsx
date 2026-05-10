import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get started — set up your reading library",
  description:
    "Sign up free, pick your reading style, and Translify tailors your library — for students, researchers, lifelong readers, or parents reading with kids. 14-day trial, 30-day money-back.",
  alternates: { canonical: "/onboarding" },
  openGraph: {
    title: "Get started with Translify",
    description:
      "Set up your reading library in under a minute. 14-day free trial, 30-day money-back.",
    url: "https://translify.app/onboarding",
  },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
