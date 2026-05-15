import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Sign up for Translify. 14-day free trial, no credit card required. 30-day money-back guarantee on every paid plan.",
  alternates: { canonical: "/register" },
  robots: { index: false, follow: true },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
