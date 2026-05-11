import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Apple home-screen icon (180×180). Has room for the full Lumi mascot —
// wings, body, scarf, face — keeping it consistent with the avatar version
// shown in the brand sheet.
export default function AppleIcon() {
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
          borderRadius: 36,
        }}
      >
        <svg width="140" height="156" viewBox="0 0 180 200" fill="none">
          {/* Wings */}
          <path
            d="M42 110 Q18 90 14 60 Q20 72 30 78 Q16 62 22 42 Q28 60 38 68 Q26 50 36 32 Q40 52 48 62 Q40 80 44 108Z"
            fill="#F4ECDB"
            stroke="#D4C29C"
            strokeWidth="1.2"
          />
          <path
            d="M138 110 Q162 90 166 60 Q160 72 150 78 Q164 62 158 42 Q152 60 142 68 Q154 50 144 32 Q140 52 132 62 Q140 80 136 108Z"
            fill="#F4ECDB"
            stroke="#D4C29C"
            strokeWidth="1.2"
          />
          {/* Body */}
          <ellipse cx="90" cy="126" rx="46" ry="54" fill="#FAF6EE" stroke="#E5D8BC" strokeWidth="2" />
          <ellipse cx="90" cy="136" rx="28" ry="34" fill="#F4ECDB" stroke="#E5D8BC" strokeWidth="1" />
          {/* Scarf */}
          <path d="M56 105 Q90 96 124 105 Q118 116 90 118 Q62 116 56 105Z" fill="#7BA17C" />
          {/* Head */}
          <ellipse cx="90" cy="84" rx="38" ry="36" fill="#FAF6EE" stroke="#E5D8BC" strokeWidth="2" />
          {/* Ear tufts */}
          <path d="M60 58 L54 42 L68 54Z" fill="#FAF6EE" stroke="#D4C29C" strokeWidth="1.5" />
          <path d="M120 58 L126 42 L112 54Z" fill="#FAF6EE" stroke="#D4C29C" strokeWidth="1.5" />
          {/* Eyes */}
          <circle cx="75" cy="82" r="12" fill="#20283A" />
          <circle cx="75" cy="82" r="10" fill="#FAF6EE" />
          <circle cx="75" cy="83" r="6" fill="#20283A" />
          <circle cx="77" cy="80" r="2" fill="#FAF6EE" />
          <circle cx="105" cy="82" r="12" fill="#20283A" />
          <circle cx="105" cy="82" r="10" fill="#FAF6EE" />
          <circle cx="105" cy="83" r="6" fill="#20283A" />
          <circle cx="107" cy="80" r="2" fill="#FAF6EE" />
          {/* Beak */}
          <path d="M85 92 L90 100 L95 92 Q90 89 85 92Z" fill="#E0A458" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
