import type { Metadata } from "next";

// /library and its sub-routes are private user content; the robots.txt
// already disallows /library, this is belt-and-braces.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
