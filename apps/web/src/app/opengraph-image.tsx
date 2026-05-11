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
              background: "#20283A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none">
              <path d="M6.8 5 L5.4 2 L8.2 4.2Z" fill="#FAF6EE" />
              <path d="M17.2 5 L18.6 2 L15.8 4.2Z" fill="#FAF6EE" />
              <ellipse cx="12" cy="11" rx="8.4" ry="7.6" fill="#FAF6EE" />
              <circle cx="9" cy="10.2" r="2.4" fill="#20283A" />
              <circle cx="9" cy="10.2" r="1.5" fill="#FAF6EE" />
              <circle cx="9.2" cy="10.4" r="0.95" fill="#20283A" />
              <circle cx="15" cy="10.2" r="2.4" fill="#20283A" />
              <circle cx="15" cy="10.2" r="1.5" fill="#FAF6EE" />
              <circle cx="15.2" cy="10.4" r="0.95" fill="#20283A" />
              <path d="M10.6 13.2 L12 15.2 L13.4 13.2 Q12 12.6 10.6 13.2Z" fill="#E0A458" />
              <path
                d="M5.4 17.6 Q12 15.8 18.6 17.6 Q17.2 21.4 12 22 Q6.8 21.4 5.4 17.6Z"
                fill="#7BA17C"
              />
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
