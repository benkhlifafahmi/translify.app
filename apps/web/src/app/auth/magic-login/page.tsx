import type { Metadata } from "next";
import { Suspense } from "react";
import { MagicLoginClient } from "./magic-login-client";

export const metadata: Metadata = {
  title: "Signing you in… · Translify",
  robots: { index: false, follow: false },
};

export default function MagicLoginPage() {
  return (
    <Suspense fallback={null}>
      <MagicLoginClient />
    </Suspense>
  );
}
