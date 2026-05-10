"use client";

import dynamic from "next/dynamic";

// epubjs depends on browser APIs (DOMParser, iframe) — disable SSR.
export const EpubViewer = dynamic(
  () => import("./epub-viewer").then((m) => m.EpubViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-[color:var(--color-muted-foreground)]">
        Loading reader…
      </div>
    ),
  },
);
