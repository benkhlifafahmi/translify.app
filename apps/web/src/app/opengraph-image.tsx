import { ImageResponse } from "next/og";

export const alt = "Translify — Understand any book, in any language";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "80px",
          background:
            "linear-gradient(135deg, #FAF6EE 0%, #F4E4C1 55%, #E6CFA0 100%)",
          color: "#14100A",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo + brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              background: "#14100A",
              color: "#FAF6EE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -0.5 }}>
            Translify
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "auto",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 92,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: -2,
              maxWidth: 980,
            }}
          >
            Understand any book,
          </div>
          <div
            style={{
              fontSize: 92,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: -2,
              fontStyle: "italic",
              color: "#A26B22",
            }}
          >
            in any language.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            gap: 18,
            fontSize: 22,
            color: "rgba(20,16,10,0.7)",
            fontWeight: 500,
          }}
        >
          <span>Translate · Chat · Highlight · Quiz</span>
          <span>·</span>
          <span>14 languages · Layout preserved</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
