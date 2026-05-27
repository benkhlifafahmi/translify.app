/**
 * Typographic SVG cover art for the 8 seed books surfaced on /join.
 *
 * Each cover is a self-contained inline SVG sized to a 5:7 aspect ratio
 * (viewBox 280x400) so it renders crisply at the small thumb slot (56x80)
 * used in the join shelf row and stays sharp if surfaced larger elsewhere.
 *
 * Per cover we pick one palette, one lock-up and one mark so the eight
 * read as a small considered set rather than a template grid.
 */
import type { ReactElement } from "react";

const SERIF = "Georgia, 'Iowan Old Style', 'Palatino Linotype', serif";
const SANS = "ui-sans-serif, system-ui, -apple-system, 'Helvetica Neue', sans-serif";

type CoverFn = () => ReactElement;

const COVERS: Record<string, CoverFn> = {
  "pride-and-prejudice": PridePrejudice,
  "alice-in-wonderland": Alice,
  "meditations": Meditations,
  "art-of-war": ArtOfWar,
  "origin-of-species": OriginOfSpecies,
  "tao-te-ching": TaoTeChing,
  "shakespeares-sonnets": Sonnets,
  "walden": Walden,
};

export function SeedCover({ slug, className }: { slug: string; className?: string }) {
  const Cover = COVERS[slug] ?? Fallback;
  return (
    <div className={className} style={{ width: "100%", height: "100%", lineHeight: 0 }}>
      <Cover />
    </div>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function Frame({
  bg,
  children,
}: {
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 280 400"
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      role="img"
      aria-hidden
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="bg-grad" x1="0" y1="0" x2="0" y2="1">
          {bg.includes(",") ? (
            bg.split(",").map((stop, i, arr) => (
              <stop key={i} offset={`${(i / (arr.length - 1)) * 100}%`} stopColor={stop.trim()} />
            ))
          ) : (
            <>
              <stop offset="0%" stopColor={bg} />
              <stop offset="100%" stopColor={bg} />
            </>
          )}
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="280" height="400" fill="url(#bg-grad)" />
      {children}
    </svg>
  );
}

// ─── 1. Pride and Prejudice ──────────────────────────────────────────────────

function PridePrejudice() {
  const ink = "#F1E9D2";
  return (
    <Frame bg="#4D3F73,#2A1F4A">
      <text x="20" y="36" fontFamily={SANS} fontSize="14" letterSpacing="3.2" fill={ink} opacity="0.7" fontWeight="700">
        AUSTEN
      </text>
      <line x1="20" y1="48" x2="60" y2="48" stroke={ink} strokeOpacity="0.5" strokeWidth="1.2" />

      <text x="140" y="180" fontFamily={SERIF} fontSize="62" fontStyle="italic" fill={ink} textAnchor="middle" fontWeight="500">
        Pride
      </text>
      <text x="140" y="220" fontFamily={SERIF} fontSize="36" fontStyle="italic" fill="#D4A85A" textAnchor="middle">
        &amp;
      </text>
      <text x="140" y="270" fontFamily={SERIF} fontSize="56" fontStyle="italic" fill={ink} textAnchor="middle" fontWeight="500">
        Prejudice
      </text>

      <line x1="60" y1="360" x2="220" y2="360" stroke={ink} strokeOpacity="0.3" strokeWidth="1" />
      <text x="140" y="380" fontFamily={SANS} fontSize="11" letterSpacing="2.5" fill={ink} opacity="0.55" textAnchor="middle" fontWeight="600">
        EST. 1813
      </text>
    </Frame>
  );
}

// ─── 2. Alice in Wonderland ──────────────────────────────────────────────────

function Alice() {
  const ink = "#FBF6E4";
  return (
    <Frame bg="#94C48A,#3F5C40">
      {/* Tiny saffron tea-stain dot, top-right */}
      <circle cx="232" cy="50" r="14" fill="#E0A458" opacity="0.85" />
      <circle cx="232" cy="50" r="22" fill="none" stroke="#E0A458" strokeOpacity="0.35" strokeWidth="1" />

      <text x="40" y="180" fontFamily={SERIF} fontSize="84" fontStyle="italic" fill={ink} fontWeight="500">
        Alice
      </text>
      <text x="42" y="216" fontFamily={SANS} fontSize="14" letterSpacing="4.5" fill={ink} opacity="0.85" fontWeight="700">
        IN WONDERLAND
      </text>

      <line x1="40" y1="245" x2="100" y2="245" stroke={ink} strokeOpacity="0.55" strokeWidth="1.4" />

      <text x="40" y="360" fontFamily={SANS} fontSize="12" letterSpacing="3.2" fill={ink} opacity="0.7" fontWeight="600">
        L. CARROLL
      </text>
    </Frame>
  );
}

// ─── 3. Meditations ──────────────────────────────────────────────────────────

function Meditations() {
  const ink = "#F8EBDA";
  return (
    <Frame bg="#C5594D,#7A2A21">
      <line x1="40" y1="100" x2="240" y2="100" stroke={ink} strokeOpacity="0.45" strokeWidth="1" />
      <text x="140" y="150" fontFamily={SERIF} fontSize="22" letterSpacing="6" fill={ink} textAnchor="middle" fontWeight="600">
        MEDITATIONS
      </text>
      <line x1="40" y1="170" x2="240" y2="170" stroke={ink} strokeOpacity="0.45" strokeWidth="1" />

      {/* Monogram MA */}
      <text x="140" y="262" fontFamily={SERIF} fontSize="86" fill={ink} textAnchor="middle" fontWeight="500" fontStyle="italic">
        M·A
      </text>

      <text x="140" y="340" fontFamily={SANS} fontSize="11" letterSpacing="3" fill={ink} opacity="0.75" textAnchor="middle" fontWeight="600">
        MARCVS AVRELIVS
      </text>
    </Frame>
  );
}

// ─── 4. The Art of War ───────────────────────────────────────────────────────

function ArtOfWar() {
  const ink = "#EAE1CC";
  const stamp = "#D6533F";
  return (
    <Frame bg="#1F1808,#0A0703">
      {/* Vermillion seal-stamp behind the character */}
      <rect x="100" y="120" width="80" height="80" fill={stamp} rx="2" />
      <rect x="106" y="126" width="68" height="68" fill="none" stroke={ink} strokeOpacity="0.45" strokeWidth="0.8" />

      {/* Single Han character: 兵 (bīng — "soldier / warfare") */}
      <text x="140" y="184" fontFamily="'Songti SC', 'STSong', 'SimSun', serif" fontSize="64" fill={ink} textAnchor="middle" fontWeight="700">
        兵
      </text>

      <text x="140" y="260" fontFamily={SANS} fontSize="13" letterSpacing="5" fill={ink} textAnchor="middle" fontWeight="700">
        THE ART OF WAR
      </text>
      <line x1="80" y1="278" x2="200" y2="278" stroke={ink} strokeOpacity="0.4" strokeWidth="1" />
      <text x="140" y="306" fontFamily={SERIF} fontSize="14" fontStyle="italic" fill={ink} opacity="0.7" textAnchor="middle">
        Sun Tzu
      </text>
    </Frame>
  );
}

// ─── 5. The Origin of Species ────────────────────────────────────────────────

function OriginOfSpecies() {
  const ink = "#F0E7D3";
  return (
    <Frame bg="#3F5C40,#0F1B11">
      <text x="28" y="64" fontFamily={SANS} fontSize="11" letterSpacing="3.5" fill={ink} opacity="0.7" fontWeight="700">
        ON THE
      </text>

      <text x="28" y="150" fontFamily={SERIF} fontSize="46" fill={ink} fontWeight="500" fontStyle="italic">
        Origin
      </text>
      <text x="28" y="200" fontFamily={SERIF} fontSize="34" fill={ink} opacity="0.85">
        of Species
      </text>

      {/* A single hairline branch suggesting Darwin's tree of life */}
      <path
        d="M 28 240 L 130 240 L 130 280 M 130 240 L 200 240 L 200 290 M 200 240 L 250 240 L 250 270"
        stroke={ink}
        strokeOpacity="0.5"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="130" cy="284" r="2.5" fill={ink} opacity="0.7" />
      <circle cx="200" cy="294" r="2.5" fill={ink} opacity="0.7" />
      <circle cx="250" cy="274" r="2.5" fill={ink} opacity="0.7" />

      <text x="28" y="360" fontFamily={SANS} fontSize="11" letterSpacing="3" fill={ink} opacity="0.7" fontWeight="600">
        C. DARWIN  ·  1859
      </text>
    </Frame>
  );
}

// ─── 6. Tao Te Ching ─────────────────────────────────────────────────────────

function TaoTeChing() {
  const ink = "#2E3F30";
  return (
    <Frame bg="#F0E6CB,#D9C99C">
      {/* Saffron sun-dot, off-center top */}
      <circle cx="208" cy="62" r="7" fill="#C8893E" />

      {/* The Tao character — large, ink-on-paper */}
      <text x="140" y="230" fontFamily="'Songti SC', 'STSong', 'SimSun', serif" fontSize="190" fill={ink} textAnchor="middle" fontWeight="600">
        道
      </text>

      <text x="140" y="288" fontFamily={SANS} fontSize="14" letterSpacing="5.5" fill={ink} textAnchor="middle" fontWeight="700" opacity="0.85">
        TAO TE CHING
      </text>
      <line x1="100" y1="306" x2="180" y2="306" stroke={ink} strokeOpacity="0.4" strokeWidth="1" />
      <text x="140" y="334" fontFamily={SERIF} fontSize="13" fontStyle="italic" fill={ink} textAnchor="middle" opacity="0.7">
        Laozi
      </text>
    </Frame>
  );
}

// ─── 7. Shakespeare's Sonnets ────────────────────────────────────────────────

function Sonnets() {
  const ink = "#2A1F0F";
  return (
    <Frame bg="#E8B768,#C8893E">
      <text x="40" y="58" fontFamily={SANS} fontSize="11" letterSpacing="4" fill={ink} opacity="0.75" fontWeight="700">
        SHAKESPEARE
      </text>
      <line x1="40" y1="74" x2="100" y2="74" stroke={ink} strokeOpacity="0.55" strokeWidth="1.2" />

      <text x="140" y="220" fontFamily={SERIF} fontSize="76" fontStyle="italic" fill={ink} textAnchor="middle" fontWeight="500">
        Sonnets
      </text>

      {/* 14-stroke ornament (sonnet = 14 lines) */}
      <g transform="translate(140, 268)" stroke={ink} strokeOpacity="0.55" strokeWidth="1.4" strokeLinecap="round">
        {Array.from({ length: 14 }).map((_, i) => (
          <line key={i} x1={(i - 6.5) * 7} y1="0" x2={(i - 6.5) * 7} y2="14" />
        ))}
      </g>

      <text x="240" y="380" fontFamily={SANS} fontSize="11" letterSpacing="2" fill={ink} opacity="0.6" textAnchor="end" fontWeight="700">
        154
      </text>
    </Frame>
  );
}

// ─── 8. Walden ───────────────────────────────────────────────────────────────

function Walden() {
  const ink = "#E8DDB8";
  return (
    <Frame bg="#2A4530,#0F1B12">
      <text x="140" y="160" fontFamily={SERIF} fontSize="64" letterSpacing="8" fill={ink} textAnchor="middle" fontWeight="600">
        WALDEN
      </text>

      {/* Pond ripples — three lengthening hairlines */}
      <line x1="100" y1="210" x2="180" y2="210" stroke={ink} strokeOpacity="0.55" strokeWidth="1.2" />
      <line x1="80"  y1="230" x2="200" y2="230" stroke={ink} strokeOpacity="0.35" strokeWidth="1.2" />
      <line x1="60"  y1="252" x2="220" y2="252" stroke={ink} strokeOpacity="0.2"  strokeWidth="1.2" />

      {/* A single saffron lantern dot, low-right */}
      <circle cx="220" cy="310" r="5" fill="#E0A458" />
      <circle cx="220" cy="310" r="11" fill="none" stroke="#E0A458" strokeOpacity="0.35" strokeWidth="1" />

      <text x="140" y="362" fontFamily={SANS} fontSize="11" letterSpacing="3.2" fill={ink} opacity="0.75" textAnchor="middle" fontWeight="600">
        H.D. THOREAU
      </text>
    </Frame>
  );
}

// ─── Fallback (in case backend ships a new seed before its cover lands) ──────

function Fallback() {
  return (
    <Frame bg="#EFE5CF,#D4C29C">
      <text x="140" y="210" fontFamily={SERIF} fontSize="78" fontStyle="italic" fill="#4A3C1E" textAnchor="middle" fontWeight="600">
        ✦
      </text>
      <text x="140" y="260" fontFamily={SANS} fontSize="12" letterSpacing="4" fill="#4A3C1E" opacity="0.65" textAnchor="middle" fontWeight="700">
        TRANSLIFY
      </text>
    </Frame>
  );
}
