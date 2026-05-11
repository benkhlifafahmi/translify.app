import type { GrowthStage, SpeciesId } from "@/lib/garden";

interface PlantSvgProps {
  species: SpeciesId;
  stage: GrowthStage;
  /** "thriving" leaves are sage; "wilting" desaturates them. */
  wilting?: boolean;
  className?: string;
  width?: number;
  height?: number;
}

// Botanical illustration of the chosen species at the given stage.
//
// Stages 0-2 hide the upper foliage; 3 adds a bud; 4 opens petals; 5-6 add
// secondary leaves and flower colour. The sway animation is applied by the
// parent (.plant-sway in globals.css) so this component stays presentational.
export function PlantSvg({
  species,
  stage,
  wilting = false,
  className = "",
  width = 280,
  height = 380,
}: PlantSvgProps) {
  const leafA = wilting ? "#A89060" : "#7A9858";
  const leafB = wilting ? "#B79E6E" : "#8FAD68";
  const leafC = wilting ? "#9C8554" : "#6E8C4E";
  const leafLight = wilting ? "#C7B584" : "#A4BD7E";
  const stem = wilting ? "#7A6A4A" : "#3F5A2D";

  const showMid = stage >= 2;
  const showHigh = stage >= 3;
  const showBud = stage >= 3;
  const showPetals = stage >= 4;
  const showCrown = stage >= 5;

  if (species === "helianthus") {
    return (
      <svg
        className={className}
        width={width}
        height={height}
        viewBox="0 0 280 380"
        fill="none"
        aria-hidden
      >
        <path d="M140 360 L 140 90" stroke={stem} strokeWidth="6" strokeLinecap="round" />
        {showMid && (
          <>
            <path d="M140 200 L 110 178 M 140 180 L 170 162 M 140 160 L 102 142" stroke={stem} strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="100" cy="178" rx="22" ry="9" fill={leafA} stroke={stem} strokeWidth="1.4" transform="rotate(-18 100 178)" />
            <ellipse cx="180" cy="162" rx="22" ry="9" fill={leafB} stroke={stem} strokeWidth="1.4" transform="rotate(18 180 162)" />
          </>
        )}
        {showHigh && (
          <>
            <ellipse cx="92" cy="138" rx="20" ry="8" fill={leafLight} stroke={stem} strokeWidth="1.4" transform="rotate(-22 92 138)" />
            <ellipse cx="188" cy="120" rx="20" ry="8" fill={leafA} stroke={stem} strokeWidth="1.4" transform="rotate(22 188 120)" />
          </>
        )}
        {showPetals ? (
          <g transform="translate(140 78)">
            {/* petals */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30) * (Math.PI / 180);
              const x = Math.cos(angle) * 28;
              const y = Math.sin(angle) * 28;
              return (
                <ellipse
                  key={i}
                  cx={x}
                  cy={y}
                  rx="14"
                  ry="6"
                  fill={wilting ? "#C99846" : "#E8C56A"}
                  stroke={stem}
                  strokeWidth="1.2"
                  transform={`rotate(${i * 30} ${x} ${y})`}
                />
              );
            })}
            <circle r="14" fill={wilting ? "#7A4A2E" : "#5A3A22"} stroke={stem} strokeWidth="1.4" />
            {/* seed dots */}
            {Array.from({ length: 9 }).map((_, i) => {
              const a = (i * 40) * (Math.PI / 180);
              return <circle key={i} cx={Math.cos(a) * 8} cy={Math.sin(a) * 8} r="1.2" fill="#3A2410" />;
            })}
          </g>
        ) : (
          showBud && <circle cx="140" cy="78" r="10" fill={leafC} stroke={stem} strokeWidth="1.4" />
        )}
      </svg>
    );
  }

  if (species === "lavandula") {
    return (
      <svg
        className={className}
        width={width}
        height={height}
        viewBox="0 0 280 380"
        fill="none"
        aria-hidden
      >
        {/* three stems splaying from the soil */}
        <path d="M140 360 C 132 280, 110 220, 90 140" stroke={stem} strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <path d="M140 360 L 140 100" stroke={stem} strokeWidth="5" strokeLinecap="round" />
        <path d="M140 360 C 148 280, 170 220, 192 140" stroke={stem} strokeWidth="4.5" strokeLinecap="round" fill="none" />
        {showMid && (
          <>
            <ellipse cx="116" cy="240" rx="9" ry="20" fill={leafA} stroke={stem} strokeWidth="1.2" transform="rotate(-22 116 240)" />
            <ellipse cx="164" cy="240" rx="9" ry="20" fill={leafB} stroke={stem} strokeWidth="1.2" transform="rotate(22 164 240)" />
          </>
        )}
        {showHigh && (
          <>
            <ellipse cx="106" cy="180" rx="8" ry="16" fill={leafLight} stroke={stem} strokeWidth="1.2" transform="rotate(-30 106 180)" />
            <ellipse cx="174" cy="180" rx="8" ry="16" fill={leafA} stroke={stem} strokeWidth="1.2" transform="rotate(30 174 180)" />
          </>
        )}
        {showBud && (
          <>
            {/* lavender flower spikes — three of them */}
            {[
              { x: 90, y: 100 },
              { x: 140, y: 70 },
              { x: 190, y: 100 },
            ].map(({ x, y }, i) => (
              <g key={i} transform={`translate(${x} ${y})`}>
                {Array.from({ length: showPetals ? 6 : 3 }).map((_, j) => (
                  <ellipse
                    key={j}
                    cx="0"
                    cy={j * -7}
                    rx="6"
                    ry="5"
                    fill={wilting ? "#9D8FBE" : "#9B8FBE"}
                    stroke={stem}
                    strokeWidth="1"
                    opacity={wilting ? 0.6 : 1}
                  />
                ))}
              </g>
            ))}
          </>
        )}
      </svg>
    );
  }

  if (species === "monstera") {
    return (
      <svg
        className={className}
        width={width}
        height={height}
        viewBox="0 0 280 380"
        fill="none"
        aria-hidden
      >
        <path d="M140 360 C 138 280, 144 220, 138 140" stroke={stem} strokeWidth="6" strokeLinecap="round" fill="none" />
        {showMid && (
          <MonsteraLeaf cx={92} cy={232} rotate={-18} fill={leafA} stem={stem} />
        )}
        {showHigh && (
          <>
            <MonsteraLeaf cx={196} cy={206} rotate={20} fill={leafC} stem={stem} />
            <MonsteraLeaf cx={86} cy={148} rotate={-26} fill={leafB} stem={stem} />
          </>
        )}
        {showCrown && (
          <MonsteraLeaf cx={196} cy={120} rotate={28} fill={leafA} stem={stem} />
        )}
        {showPetals && (
          <MonsteraLeaf cx={140} cy={68} rotate={0} fill={leafLight} stem={stem} scale={1.1} />
        )}
      </svg>
    );
  }

  // Default: Ficus litteraria — the namesake plant from the design.
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 280 380"
      fill="none"
      aria-hidden
    >
      <path
        d="M140 360 C 134 300, 152 250, 138 200 C 126 160, 154 130, 142 80"
        stroke={stem}
        strokeWidth="5.5"
        strokeLinecap="round"
        fill="none"
      />
      {showMid && (
        <>
          <path d="M140 280 C 160 270, 178 254, 188 226" stroke={stem} strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M138 220 C 118 212, 96 196, 88 168"  stroke={stem} strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M188 226 C 214 218, 232 200, 230 178 C 212 188, 196 206, 188 226 Z" fill={leafA} stroke={stem} strokeWidth="1.4" />
          <path d="M88 168 C 64 168, 44 156, 40 134 C 60 142, 78 152, 88 168 Z" fill={leafB} stroke={stem} strokeWidth="1.4" />
        </>
      )}
      {showHigh && (
        <>
          <path d="M142 150 C 158 144, 174 130, 182 110" stroke={stem} strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M182 110 C 212 100, 232 78, 230 50 C 206 62, 188 84, 182 110 Z" fill={leafC} stroke={stem} strokeWidth="1.4" />
          <path d="M150 116 C 130 102, 110 90, 92 96 C 104 112, 126 124, 150 116 Z" fill={leafB} stroke={stem} strokeWidth="1.4" />
        </>
      )}
      {showCrown && (
        <>
          <path d="M142 80 C 156 56, 178 42, 198 46 C 188 70, 168 84, 142 80 Z" fill={leafA} stroke={stem} strokeWidth="1.4" />
          <path d="M142 80 C 128 56, 108 44, 88 50 C 96 72, 118 86, 142 80 Z" fill={leafLight} stroke={stem} strokeWidth="1.4" />
        </>
      )}
      {showBud && (
        <g transform="translate(142 38)">
          <circle r="6" fill={wilting ? "#C99846" : "#E8C56A"} stroke={stem} strokeWidth="1.2" />
          {showPetals && (
            <>
              <circle r="2" fill="#B85A3A" />
              <path d="M0 -6 C 4 -10, 8 -8, 6 -2 Z"  fill="#B85A3A" stroke={stem} strokeWidth="1" />
              <path d="M-6 0 C -10 -4, -8 -8, -2 -6 Z" fill="#B85A3A" stroke={stem} strokeWidth="1" />
              <path d="M0 6 C -4 10, -8 8, -6 2 Z"   fill="#B85A3A" stroke={stem} strokeWidth="1" />
              <path d="M6 0 C 10 4, 8 8, 2 6 Z"     fill="#B85A3A" stroke={stem} strokeWidth="1" />
            </>
          )}
        </g>
      )}
    </svg>
  );
}

function MonsteraLeaf({
  cx, cy, rotate, fill, stem, scale = 1,
}: { cx: number; cy: number; rotate: number; fill: string; stem: string; scale?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rotate}) scale(${scale})`}>
      <path
        d="M0 0 C -8 -28, 8 -56, 36 -60 C 44 -36, 36 -8, 0 0 Z"
        fill={fill}
        stroke={stem}
        strokeWidth="1.4"
      />
      {/* slits */}
      <path d="M6 -16 L 22 -22" stroke={stem} strokeWidth="1.2" />
      <path d="M10 -32 L 28 -36" stroke={stem} strokeWidth="1.2" />
      <path d="M14 -46 L 30 -50" stroke={stem} strokeWidth="1.2" />
    </g>
  );
}
