// Lumi — Translify's paper-owl mascot.
//
// Renders Lumi at any size, in any of the canonical emotional states, optionally
// with level-based accessories (glasses, cape, etc.). See design/mascot-states.html
// for the canonical anatomy and expression sheet.

import type { CSSProperties } from "react";

export type LumiState =
  | "neutral"
  | "happy"
  | "thinking"
  | "excited"
  | "reading"
  | "translating"
  | "waving"
  | "celebrating"
  | "sad"
  | "focused"
  | "sleepy"
  | "confused";

interface LumiProps {
  state?: LumiState;
  size?: number;
  /** Level 1-5 — controls accessories layered on top of the base mascot. */
  level?: 1 | 2 | 3 | 4 | 5;
  /** Subtle float animation. Default true. */
  animate?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Whether Lumi holds her tiny book. Defaults based on state. */
  book?: boolean;
  title?: string;
}

const WING_L =
  "M42 110 Q18 90 14 60 Q20 72 30 78 Q16 62 22 42 Q28 60 38 68 Q26 50 36 32 Q40 52 48 62 Q40 80 44 108Z";
const WING_R =
  "M138 110 Q162 90 166 60 Q160 72 150 78 Q164 62 158 42 Q152 60 142 68 Q154 50 144 32 Q140 52 132 62 Q140 80 136 108Z";

// State -> wing rotation tuple [left, right]
const WINGS: Record<LumiState, [number, number]> = {
  neutral: [0, 0],
  happy: [0, 0],
  thinking: [0, 0],
  excited: [22, -22],
  reading: [5, -5],
  translating: [0, 0],
  waving: [0, -34],
  celebrating: [30, -30],
  sad: [-12, 12],
  focused: [0, 0],
  sleepy: [-8, 8],
  confused: [-6, 12],
};

const HEAD_TILT: Partial<Record<LumiState, number>> = { confused: -8 };

const BOOK_DEFAULT: Partial<Record<LumiState, boolean>> = {
  neutral: true,
};

export function Lumi({
  state = "neutral",
  size = 120,
  level = 1,
  animate = true,
  className = "",
  style,
  book,
  title = "Lumi",
}: LumiProps) {
  const [wL, wR] = WINGS[state];
  const tilt = HEAD_TILT[state] ?? 0;
  const showBook = book ?? BOOK_DEFAULT[state] ?? false;
  const height = Math.round((size * 200) / 180);

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 180 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={`${animate ? "lumi-float" : ""} ${className}`.trim()}
      style={style}
    >
      <title>{title}</title>

      {/* shadow */}
      <ellipse cx="90" cy="196" rx="38" ry="6" fill="rgba(32,40,58,.10)" />

      {/* wings */}
      <Wing side="L" rot={wL} />
      <Wing side="R" rot={wR} />

      {/* body + tummy */}
      <ellipse cx="90" cy="126" rx="46" ry="54" fill="#FAF6EE" stroke="#E5D8BC" strokeWidth="2" />
      <ellipse cx="90" cy="136" rx="28" ry="34" fill="#F4ECDB" stroke="#E5D8BC" strokeWidth="1" />

      {/* scarf */}
      <path d="M56 105 Q90 96 124 105 Q118 116 90 118 Q62 116 56 105Z" fill="#7BA17C" />
      <path
        d="M85 115 Q90 122 95 115"
        stroke="#5F8763"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* belly lines */}
      <line x1="70" y1="140" x2="110" y2="140" stroke="#D4C29C" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="72" y1="149" x2="108" y2="149" stroke="#D4C29C" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="75" y1="158" x2="104" y2="158" stroke="#D4C29C" strokeWidth="1.2" strokeLinecap="round" />

      {/* level-based body decoration */}
      {level >= 4 && <Cape />}
      {level >= 2 && <LevelBadge />}

      {showBook && <BookProp />}

      {/* talons */}
      <path
        d="M72 180 Q68 186 64 184 M72 180 Q72 188 68 188 M72 180 Q76 188 72 188"
        stroke="#D4C29C"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M108 180 Q104 186 100 184 M108 180 Q108 188 104 188 M108 180 Q112 188 108 188"
        stroke="#D4C29C"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* head — possibly tilted */}
      <g transform={tilt !== 0 ? `rotate(${tilt} 90 84)` : undefined}>
        <ellipse cx="90" cy="84" rx="38" ry="36" fill="#FAF6EE" stroke="#E5D8BC" strokeWidth="2" />
        <path
          d="M60 58 L54 42 L68 54Z"
          fill="#FAF6EE"
          stroke="#D4C29C"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M120 58 L126 42 L112 54Z"
          fill="#FAF6EE"
          stroke="#D4C29C"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M61 55 L57 46 L66 53Z" fill="#E0A458" opacity=".42" />
        <path d="M119 55 L123 46 L114 53Z" fill="#E0A458" opacity=".42" />

        {/* face disc */}
        <ellipse
          cx="90"
          cy="86"
          rx="30"
          ry="28"
          fill="none"
          stroke="#E5D8BC"
          strokeWidth="1.5"
          strokeDasharray="3 2"
        />

        <Eyes state={state} />
        <Beak state={state} />
        {state === "happy" || state === "celebrating" || state === "waving" ? <Blush /> : null}

        {/* level accessories on head */}
        {level >= 3 && <Glasses />}
        {level >= 5 && <WizardHat />}
      </g>

      {/* state-specific extras (sparkles, thought bubbles, etc.) */}
      <Extras state={state} />
    </svg>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────────── */

function Wing({ side, rot }: { side: "L" | "R"; rot: number }) {
  const path = side === "L" ? WING_L : WING_R;
  const pivot = side === "L" ? "44 108" : "136 108";
  const lines =
    side === "L" ? (
      <>
        <line x1="22" y1="56" x2="36" y2="64" stroke="#D4C29C" strokeWidth="0.8" opacity=".7" />
        <line x1="28" y1="72" x2="40" y2="78" stroke="#D4C29C" strokeWidth="0.8" opacity=".7" />
        <line x1="18" y1="68" x2="30" y2="74" stroke="#D4C29C" strokeWidth="0.8" opacity=".7" />
      </>
    ) : (
      <>
        <line x1="158" y1="56" x2="144" y2="64" stroke="#D4C29C" strokeWidth="0.8" opacity=".7" />
        <line x1="152" y1="72" x2="140" y2="78" stroke="#D4C29C" strokeWidth="0.8" opacity=".7" />
        <line x1="162" y1="68" x2="150" y2="74" stroke="#D4C29C" strokeWidth="0.8" opacity=".7" />
      </>
    );
  return (
    <g transform={rot !== 0 ? `rotate(${rot} ${pivot})` : undefined}>
      <path d={path} fill="#F4ECDB" stroke="#D4C29C" strokeWidth="1.2" />
      {lines}
    </g>
  );
}

function Eyes({ state }: { state: LumiState }) {
  switch (state) {
    case "happy":
    case "celebrating":
      return (
        <>
          <path d="M63 84 Q75 74 87 84" stroke="#20283A" strokeWidth="5" strokeLinecap="round" fill="rgba(32,40,58,.05)" />
          <path d="M93 84 Q105 74 117 84" stroke="#20283A" strokeWidth="5" strokeLinecap="round" fill="rgba(32,40,58,.05)" />
        </>
      );
    case "thinking":
      return (
        <>
          <path d="M65 82 Q75 77 85 82" stroke="#20283A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M95 82 Q105 77 115 82" stroke="#20283A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </>
      );
    case "sleepy":
      return (
        <>
          <circle cx="75" cy="84" r="12" fill="#20283A" />
          <circle cx="75" cy="84" r="10" fill="white" />
          <rect x="63" y="75" width="24" height="12" fill="#FAF6EE" />
          <path d="M64 81 Q75 84 86 81" stroke="#D4C29C" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="105" cy="84" r="12" fill="#20283A" />
          <circle cx="105" cy="84" r="10" fill="white" />
          <rect x="93" y="75" width="24" height="12" fill="#FAF6EE" />
          <path d="M94 81 Q105 84 116 81" stroke="#D4C29C" strokeWidth="3" strokeLinecap="round" fill="none" />
        </>
      );
    case "reading":
      return (
        <>
          <circle cx="75" cy="82" r="12" fill="#20283A" />
          <circle cx="75" cy="82" r="10" fill="white" />
          <circle cx="75" cy="88" r="6" fill="#20283A" />
          <circle cx="77" cy="86" r="1.8" fill="white" />
          <path d="M63 76 Q75 72 87 76" fill="#FAF6EE" />
          <circle cx="105" cy="82" r="12" fill="#20283A" />
          <circle cx="105" cy="82" r="10" fill="white" />
          <circle cx="105" cy="88" r="6" fill="#20283A" />
          <circle cx="107" cy="86" r="1.8" fill="white" />
          <path d="M93 76 Q105 72 117 76" fill="#FAF6EE" />
        </>
      );
    case "excited":
      return (
        <>
          <circle cx="75" cy="82" r="14" fill="#20283A" />
          <circle cx="75" cy="82" r="12" fill="white" />
          <circle cx="75" cy="82" r="4.5" fill="#20283A" />
          <circle cx="77" cy="79" r="2.2" fill="white" />
          <circle cx="105" cy="82" r="14" fill="#20283A" />
          <circle cx="105" cy="82" r="12" fill="white" />
          <circle cx="105" cy="82" r="4.5" fill="#20283A" />
          <circle cx="107" cy="79" r="2.2" fill="white" />
        </>
      );
    case "sad":
      return (
        <>
          <circle cx="75" cy="84" r="12" fill="#20283A" />
          <circle cx="75" cy="84" r="10" fill="white" />
          <circle cx="75" cy="86" r="5.5" fill="#20283A" />
          <circle cx="76" cy="83" r="1.8" fill="white" />
          <path d="M63 77 Q68 71 87 79" fill="#FAF6EE" />
          <path d="M65 71 Q72 75 80 72" stroke="#D4C29C" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <circle cx="105" cy="84" r="12" fill="#20283A" />
          <circle cx="105" cy="84" r="10" fill="white" />
          <circle cx="105" cy="86" r="5.5" fill="#20283A" />
          <circle cx="106" cy="83" r="1.8" fill="white" />
          <path d="M117 77 Q112 71 93 79" fill="#FAF6EE" />
          <path d="M100 72 Q108 75 115 71" stroke="#D4C29C" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </>
      );
    case "waving":
      return (
        <>
          <circle cx="75" cy="83" r="12" fill="#20283A" />
          <circle cx="75" cy="83" r="10" fill="white" />
          <path d="M63 80 Q75 76 87 80" fill="#FAF6EE" />
          <circle cx="75" cy="86" r="5" fill="#20283A" />
          <circle cx="77" cy="84" r="1.8" fill="white" />
          <circle cx="105" cy="83" r="12" fill="#20283A" />
          <circle cx="105" cy="83" r="10" fill="white" />
          <path d="M93 80 Q105 76 117 80" fill="#FAF6EE" />
          <circle cx="105" cy="86" r="5" fill="#20283A" />
          <circle cx="107" cy="84" r="1.8" fill="white" />
        </>
      );
    case "focused":
      return (
        <>
          <circle cx="75" cy="82" r="12" fill="#20283A" />
          <circle cx="75" cy="82" r="10" fill="white" />
          <circle cx="76" cy="83" r="6" fill="#20283A" />
          <circle cx="78" cy="80" r="2" fill="white" />
          <path d="M64 72 Q72 68 80 71" stroke="#20283A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="105" cy="82" r="12" fill="#20283A" />
          <circle cx="105" cy="82" r="10" fill="white" />
          <circle cx="104" cy="83" r="6" fill="#20283A" />
          <circle cx="106" cy="80" r="2" fill="white" />
          <path d="M100 71 Q108 68 116 72" stroke="#20283A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      );
    case "translating":
      return (
        <>
          <circle cx="75" cy="82" r="15" fill="#E0A458" opacity=".22" />
          <circle cx="75" cy="82" r="12" fill="#20283A" />
          <circle cx="75" cy="82" r="10" fill="white" />
          <circle cx="75" cy="83" r="6" fill="#20283A" />
          <circle cx="77" cy="80" r="2" fill="white" />
          <path d="M71 84 Q73 88 76 84" stroke="#E0A458" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <circle cx="105" cy="82" r="15" fill="#7BA17C" opacity=".22" />
          <circle cx="105" cy="82" r="12" fill="#20283A" />
          <circle cx="105" cy="82" r="10" fill="white" />
          <circle cx="105" cy="83" r="6" fill="#20283A" />
          <circle cx="107" cy="80" r="2" fill="white" />
          <path d="M102 87 L104 84 L106 87" stroke="#7BA17C" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "confused":
      return (
        <>
          <circle cx="75" cy="82" r="12" fill="#20283A" />
          <circle cx="75" cy="82" r="10" fill="white" />
          <circle cx="75" cy="83" r="6" fill="#20283A" />
          <circle cx="77" cy="80" r="2" fill="white" />
          <circle cx="107" cy="80" r="14" fill="#20283A" />
          <circle cx="107" cy="80" r="12" fill="white" />
          <circle cx="107" cy="81" r="5.5" fill="#20283A" />
          <circle cx="109" cy="77" r="2.2" fill="white" />
          <path d="M99 65 Q107 60 115 65" stroke="#20283A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      );
    case "neutral":
    default:
      return (
        <>
          <circle cx="75" cy="82" r="12" fill="#20283A" />
          <circle cx="75" cy="82" r="10" fill="white" />
          <circle cx="75" cy="83" r="6" fill="#20283A" />
          <circle cx="77" cy="80" r="2" fill="white" />
          <path d="M71 84 Q73 88 76 84" stroke="#E0A458" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <circle cx="105" cy="82" r="12" fill="#20283A" />
          <circle cx="105" cy="82" r="10" fill="white" />
          <circle cx="105" cy="83" r="6" fill="#20283A" />
          <circle cx="107" cy="80" r="2" fill="white" />
          <path d="M102 87 L104 84 L106 87" stroke="#7BA17C" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
  }
}

function Beak({ state }: { state: LumiState }) {
  const triangle = <path d="M85 92 L90 100 L95 92 Q90 89 85 92Z" fill="#E0A458" />;
  switch (state) {
    case "happy":
    case "waving":
      return (
        <>
          {triangle}
          <path d="M82 98 Q90 107 98 98" stroke="#C8893E" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </>
      );
    case "celebrating":
      return (
        <>
          {triangle}
          <path d="M79 101 Q90 115 101 101" stroke="#C8893E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      );
    case "excited":
      return (
        <>
          <path d="M83 91 Q90 108 97 91 Q90 87 83 91Z" fill="#E0A458" />
          <ellipse cx="90" cy="99" rx="4.5" ry="3.5" fill="#C8893E" />
        </>
      );
    case "sad":
      return <path d="M85 98 L90 92 L95 98 Q90 101 85 98Z" fill="#E0A458" />;
    case "focused":
      return (
        <>
          {triangle}
          <line x1="83" y1="95" x2="97" y2="95" stroke="#C8893E" strokeWidth="1.5" strokeLinecap="round" />
        </>
      );
    default:
      return triangle;
  }
}

function Blush() {
  return (
    <>
      <circle cx="66" cy="92" r="9" fill="#E2786C" opacity=".22" />
      <circle cx="114" cy="92" r="9" fill="#E2786C" opacity=".22" />
    </>
  );
}

function BookProp() {
  return (
    <g transform="translate(54 162) rotate(-12)">
      <rect width="20" height="26" rx="2" fill="#20283A" />
      <rect x="3" y="0" width="17" height="26" rx="2" fill="#F4ECDB" stroke="#D4C29C" strokeWidth=".8" />
      <line x1="6" y1="8" x2="17" y2="8" stroke="#D4C29C" strokeWidth=".8" />
      <line x1="6" y1="12" x2="17" y2="12" stroke="#D4C29C" strokeWidth=".8" />
      <line x1="6" y1="16" x2="13" y2="16" stroke="#D4C29C" strokeWidth=".8" />
      <rect x="14" y="0" width="4" height="10" rx="1" fill="#E0A458" />
      <path d="M14 10 L16 8 L18 10" fill="#E0A458" />
    </g>
  );
}

function Glasses() {
  return (
    <g>
      <circle cx="75" cy="84" r="10.5" fill="none" stroke="#20283A" strokeWidth="1.5" opacity=".55" />
      <circle cx="105" cy="84" r="10.5" fill="none" stroke="#20283A" strokeWidth="1.5" opacity=".55" />
      <line x1="85.5" y1="84" x2="94.5" y2="84" stroke="#20283A" strokeWidth="1.5" opacity=".55" />
    </g>
  );
}

function WizardHat() {
  return (
    <g>
      <path d="M90 18 Q72 56 60 60 L120 60 Q108 56 90 18Z" fill="#6B5B95" stroke="#4A3F70" strokeWidth="1.2" strokeLinejoin="round" />
      <rect x="58" y="58" width="64" height="6" rx="2" fill="#4A3F70" />
      <path d="M86 28 L87.5 32 L92 32 L88.5 34.5 L90 39 L86 36.5 L82 39 L83.5 34.5 L80 32 L84.5 32 Z" fill="#E0A458" />
      <circle cx="78" cy="44" r="1.5" fill="#E0A458" />
      <circle cx="100" cy="40" r="1.5" fill="#E0A458" />
    </g>
  );
}

function Cape() {
  return (
    <path
      d="M50 110 Q40 150 56 188 Q90 178 124 188 Q140 150 130 110 Q90 100 50 110Z"
      fill="#E0A458"
      stroke="#C8893E"
      strokeWidth="1.2"
      opacity=".88"
    />
  );
}

function LevelBadge() {
  return (
    <g>
      <circle cx="90" cy="118" r="3.5" fill="#E0A458" stroke="#C8893E" strokeWidth="0.8" />
      <path d="M88.5 117 L89.5 119 L92 117" stroke="#FAF6EE" strokeWidth="0.7" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Extras({ state }: { state: LumiState }) {
  if (state === "thinking") {
    return (
      <g>
        <circle cx="120" cy="66" r="4.5" fill="#E0A458" opacity=".7" />
        <circle cx="131" cy="53" r="7" fill="#E0A458" opacity=".82" />
        <circle cx="145" cy="38" r="11" fill="#E0A458" opacity=".92" />
        <text x="140" y="43" fontFamily="serif" fontSize="13" fill="white" fontWeight="bold">
          ?
        </text>
      </g>
    );
  }
  if (state === "celebrating") {
    return (
      <g>
        <rect x="18" y="32" width="9" height="5" rx="1" fill="#E0A458" transform="rotate(-28 22 34)" />
        <rect x="143" y="36" width="7" height="4" rx="1" fill="#E2786C" transform="rotate(18 146 38)" />
        <rect x="26" y="58" width="7" height="9" rx="1" fill="#7BA17C" transform="rotate(42 29 62)" />
        <circle cx="156" cy="56" r="5" fill="#E0A458" opacity=".82" />
        <rect x="151" y="24" width="8" height="5" rx="1" fill="#6B5B95" transform="rotate(-12 155 26)" />
        <circle cx="20" cy="70" r="4" fill="#E2786C" opacity=".7" />
        <circle cx="133" cy="24" r="6" fill="#7BA17C" opacity=".75" />
      </g>
    );
  }
  if (state === "translating") {
    return (
      <g>
        <text x="16" y="46" fontSize="18" fill="#E0A458" opacity=".75" fontFamily="serif">ع</text>
        <text x="151" y="40" fontSize="14" fill="#7BA17C" opacity=".68" fontFamily="serif">α</text>
        <text x="10" y="78" fontSize="13" fill="#E2786C" opacity=".55" fontFamily="serif">字</text>
        <text x="156" y="72" fontSize="11" fill="#E0A458" opacity=".6" fontFamily="serif">й</text>
        <path
          d="M90 67 L92 72.5 L98 72.5 L93.5 76 L95.5 82 L90 78.5 L84.5 82 L86.5 76 L82 72.5 L88 72.5 Z"
          fill="#E0A458"
          opacity=".85"
        />
      </g>
    );
  }
  if (state === "excited") {
    return (
      <g>
        <text x="16" y="44" fontFamily="serif" fontSize="24" fill="#E0A458" fontWeight="bold" opacity=".85">!</text>
        <text x="149" y="40" fontFamily="serif" fontSize="20" fill="#E0A458" fontWeight="bold" opacity=".78">!</text>
        <text x="26" y="62" fontFamily="serif" fontSize="15" fill="#7BA17C" fontWeight="bold" opacity=".65">!</text>
      </g>
    );
  }
  if (state === "sad") {
    return (
      <g>
        <ellipse cx="90" cy="36" rx="25" ry="13" fill="#C0C0C0" opacity=".62" />
        <ellipse cx="73" cy="43" rx="17" ry="12" fill="#C0C0C0" opacity=".62" />
        <ellipse cx="107" cy="43" rx="17" ry="12" fill="#C0C0C0" opacity=".62" />
        <line x1="80" y1="55" x2="78" y2="68" stroke="#88B0D8" strokeWidth="2" strokeLinecap="round" opacity=".7" />
        <line x1="90" y1="57" x2="88" y2="70" stroke="#88B0D8" strokeWidth="2" strokeLinecap="round" opacity=".7" />
        <line x1="100" y1="55" x2="98" y2="68" stroke="#88B0D8" strokeWidth="2" strokeLinecap="round" opacity=".7" />
        <path d="M70 97 Q67 105 70 108 Q73 105 70 97Z" fill="#88B0D8" opacity=".82" />
      </g>
    );
  }
  if (state === "sleepy") {
    return (
      <g>
        <text x="121" y="70" fontFamily="serif" fontSize="15" fill="#D4C29C" opacity=".6" fontWeight="bold">z</text>
        <text x="132" y="56" fontFamily="serif" fontSize="11" fill="#D4C29C" opacity=".45" fontWeight="bold">z</text>
        <text x="141" y="44" fontFamily="serif" fontSize="8" fill="#D4C29C" opacity=".32" fontWeight="bold">z</text>
      </g>
    );
  }
  if (state === "confused") {
    return (
      <g>
        <text x="130" y="46" fontFamily="serif" fontSize="17" fill="#E0A458" opacity=".82">?</text>
        <text x="143" y="62" fontFamily="serif" fontSize="12" fill="#E0A458" opacity=".6">?</text>
      </g>
    );
  }
  return null;
}
