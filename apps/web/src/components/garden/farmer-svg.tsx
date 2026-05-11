import type { Farmer } from "@/lib/garden";

interface FarmerSvgProps {
  farmer: Farmer;
  className?: string;
  width?: number;
  height?: number;
}

const SKIN: Record<Farmer["skin"], string> = {
  fair: "#F2D2B0",
  tan:  "#E2B98A",
  umber: "#9C6B45",
  sepia: "#704428",
};

const COAT: Record<Farmer["coat"], string> = {
  denim: "#3E5878",
  linen: "#E8DDC4",
  earth: "#B85A3A",
  moss:  "#5F8763",
};

const HAT: Record<Farmer["hat"], { brim: string; crown: string } | null> = {
  straw:   { brim: "#C99846", crown: "#E2B26A" },
  wool:    { brim: "#3D2A18", crown: "#5C4128" },
  scholar: { brim: "#20283A", crown: "#3A4763" },
  none: null,
};

export function FarmerSvg({
  farmer, className = "", width = 78, height = 120,
}: FarmerSvgProps) {
  const skin = SKIN[farmer.skin];
  const coat = COAT[farmer.coat];
  const hat = HAT[farmer.hat];
  const ink = "#1F1A14";

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 78 120"
      fill="none"
      aria-hidden
    >
      {/* shadow */}
      <ellipse cx="39" cy="116" rx="22" ry="3" fill="rgba(0,0,0,0.15)" />
      {/* legs */}
      <path d="M30 92 L 28 114" stroke="#3D2A18" strokeWidth="6" strokeLinecap="round" />
      <path d="M46 92 L 48 114" stroke="#3D2A18" strokeWidth="6" strokeLinecap="round" />
      {/* body / coat */}
      <path
        d="M22 56 C 22 48, 26 44, 38 44 C 50 44, 56 48, 56 56 L 56 94 C 56 96, 54 98, 50 98 L 26 98 C 22 98, 22 96, 22 94 Z"
        fill={coat}
        stroke={ink}
        strokeWidth="1.6"
      />
      <path d="M28 48 L 28 96 M 50 48 L 50 96" stroke={ink} strokeWidth="0.8" opacity="0.5" />
      {/* arm */}
      <path d="M56 62 L 70 76 L 68 86" stroke={coat} strokeWidth="6" strokeLinecap="round" />
      {/* tool */}
      {farmer.tool === "watering-can" && (
        <g transform="translate(60 82)">
          <rect x="0" y="0" width="14" height="12" fill="#8A8E8C" stroke={ink} strokeWidth="1.2" rx="1" />
          <path d="M14 2 L 20 -2 L 20 4 L 14 6 Z" fill="#8A8E8C" stroke={ink} strokeWidth="1.2" />
          <path d="M-1 0 C -4 -2, -2 -6, 2 -4" stroke={ink} strokeWidth="1.2" fill="none" />
        </g>
      )}
      {farmer.tool === "shears" && (
        <g transform="translate(60 78)">
          <path d="M0 0 L 14 14" stroke="#8A8E8C" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M0 14 L 14 0" stroke="#8A8E8C" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="-1" cy="-1" r="3" fill="none" stroke={ink} strokeWidth="1.4" />
          <circle cx="-1" cy="15" r="3" fill="none" stroke={ink} strokeWidth="1.4" />
        </g>
      )}
      {farmer.tool === "lantern" && (
        <g transform="translate(58 78)">
          <rect x="0" y="2" width="12" height="14" fill="#E8C56A" stroke={ink} strokeWidth="1.2" rx="1" />
          <path d="M2 0 L 10 0 L 12 2 L 0 2 Z" fill="#5A3A22" stroke={ink} strokeWidth="1" />
          <circle cx="6" cy="9" r="3" fill="#FFD27A" />
        </g>
      )}
      {farmer.tool === "book" && (
        <g transform="translate(58 80)">
          <path d="M0 0 L 14 0 L 14 12 L 7 10 L 0 12 Z" fill="#B85A3A" stroke={ink} strokeWidth="1.2" />
          <path d="M7 2 L 7 10" stroke={ink} strokeWidth="0.8" />
        </g>
      )}
      {/* head */}
      <circle cx="39" cy="34" r="11" fill={skin} stroke={ink} strokeWidth="1.6" />
      <path d="M30 28 C 32 22, 46 22, 48 28" stroke="#3D2A18" strokeWidth="2" fill="#3D2A18" />
      <circle cx="35" cy="34" r="0.9" fill={ink} />
      <circle cx="43" cy="34" r="0.9" fill={ink} />
      <path d="M35 39 Q 39 41, 43 39" stroke={ink} strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* hat */}
      {hat && (
        <>
          <ellipse cx="39" cy="22" rx="22" ry="5" fill={hat.brim} stroke={ink} strokeWidth="1.4" />
          <path d="M28 22 C 30 12, 48 12, 50 22 Z" fill={hat.crown} stroke={ink} strokeWidth="1.4" />
          <path d="M28 22 L 50 22" stroke={ink} strokeWidth="0.6" opacity="0.6" />
          <path d="M28 21 C 32 24, 46 24, 50 21" stroke="#4D6A3B" strokeWidth="1.6" fill="none" />
        </>
      )}
    </svg>
  );
}
