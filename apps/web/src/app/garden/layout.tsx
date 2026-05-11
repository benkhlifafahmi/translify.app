import type { Metadata } from "next";

// Garden pages are private user content — keep out of the index.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function GardenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
