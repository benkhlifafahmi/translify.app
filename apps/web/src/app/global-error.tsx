"use client";

// Root error boundary — fires when the root layout itself crashes.
// Must include its own <html>/<body> because the layout has failed.
// Kept dependency-free (no fonts, no context, inline styles) so it works
// even when everything else is on fire.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
          fontFamily: "Georgia, 'Times New Roman', serif",
          background: "#FAF6EE",
          color: "#20283A",
        }}
      >
        <div style={{ maxWidth: 460, textAlign: "center" }}>
          {/* Tiny static Lumi — pure SVG, no animation, no external deps */}
          <svg width="120" height="134" viewBox="0 0 180 200" fill="none" aria-hidden style={{ marginBottom: 16 }}>
            <ellipse cx="90" cy="196" rx="38" ry="6" fill="rgba(32,40,58,.1)" />
            <path d="M42 110 Q18 90 14 60 Q20 72 30 78 Q16 62 22 42 Q28 60 38 68 Q26 50 36 32 Q40 52 48 62 Q40 80 44 108Z" fill="#F4ECDB" stroke="#D4C29C" strokeWidth="1.2" />
            <path d="M138 110 Q162 90 166 60 Q160 72 150 78 Q164 62 158 42 Q152 60 142 68 Q154 50 144 32 Q140 52 132 62 Q140 80 136 108Z" fill="#F4ECDB" stroke="#D4C29C" strokeWidth="1.2" />
            <ellipse cx="90" cy="126" rx="46" ry="54" fill="#FAF6EE" stroke="#E5D8BC" strokeWidth="2" />
            <path d="M56 105 Q90 96 124 105 Q118 116 90 118 Q62 116 56 105Z" fill="#7BA17C" />
            <ellipse cx="90" cy="84" rx="38" ry="36" fill="#FAF6EE" stroke="#E5D8BC" strokeWidth="2" />
            <path d="M60 58 L54 42 L68 54Z" fill="#FAF6EE" stroke="#D4C29C" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M120 58 L126 42 L112 54Z" fill="#FAF6EE" stroke="#D4C29C" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="75" cy="84" r="12" fill="#20283A" />
            <circle cx="75" cy="84" r="10" fill="white" />
            <circle cx="75" cy="86" r="5.5" fill="#20283A" />
            <circle cx="105" cy="84" r="12" fill="#20283A" />
            <circle cx="105" cy="84" r="10" fill="white" />
            <circle cx="105" cy="86" r="5.5" fill="#20283A" />
            <path d="M85 98 L90 92 L95 98 Q90 101 85 98Z" fill="#E0A458" />
          </svg>

          <h1 style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 12 }}>
            We hit a serious snag.
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.5, color: "#4A5263", marginBottom: 28 }}>
            Lumi tried, the page didn't load. Refresh to try again — and if it keeps
            happening, please let us know.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={() => reset()}
              style={{
                cursor: "pointer",
                border: "none",
                padding: "12px 22px",
                borderRadius: 999,
                background: "#E0A458",
                color: "#2A1F0F",
                fontWeight: 700,
                fontSize: 14,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                padding: "12px 22px",
                borderRadius: 999,
                background: "transparent",
                border: "1.5px solid #D4C29C",
                color: "#20283A",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 14,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              Back to home
            </a>
          </div>

          {error.digest && (
            <p style={{ marginTop: 32, fontSize: 12, color: "rgba(74,82,99,.6)", fontFamily: "ui-monospace, monospace" }}>
              ref: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
