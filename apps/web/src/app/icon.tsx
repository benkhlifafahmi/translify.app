import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Browser favicon — simplified Lumi (head + scarf + saffron beak) on ink tile.
// Mirrors TranslifyIcon so the brand reads consistently from tab favicon →
// in-app navbar → apple-icon.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#20283A",
          borderRadius: 6,
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
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
    ),
    { ...size },
  );
}
