import type { Metadata } from "next";
import { OptOutClient } from "./opt-out-client";

export const metadata: Metadata = {
  title: "Data Deletion Request — Translify",
  description:
    "Request the permanent deletion of your Translify account and all associated data.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/opt-out" },
};

export default function OptOutPage() {
  return <OptOutClient />;
}
