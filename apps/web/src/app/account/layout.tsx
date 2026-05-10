import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account & billing",
  description: "Manage your Translify subscription, billing, and reading preferences.",
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
