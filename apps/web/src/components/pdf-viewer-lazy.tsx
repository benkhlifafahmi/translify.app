"use client";

import dynamic from "next/dynamic";

export const PdfViewer = dynamic(
  () => import("./pdf-viewer").then((m) => m.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-[color:var(--color-muted-foreground)]">
        Loading viewer…
      </div>
    ),
  },
);
