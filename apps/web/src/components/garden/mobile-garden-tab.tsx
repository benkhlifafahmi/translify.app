"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";

import { useI18n } from "@/lib/i18n";
import { getGarden, type Garden, type SpeciesId } from "@/lib/garden";

export type MobileGardenActivity = "water" | "plant";

export interface MobileGardenTabHandle {
  play(kind: MobileGardenActivity): void;
}

interface Props {
  bookId: string;
  label: string;
  onOpen: () => void;
}

interface ActiveState {
  kind: MobileGardenActivity;
  nonce: number;
}

const DURATION_MS = 2_150;

// Mobile-tab variant of the reader vignette. Sized to fit alongside the other
// PaperTabBtns (h-9 = 36px icon tile). Uses stripped-down inline SVG
// silhouettes so the farmer + plant + droplet motion stay legible at small
// scale — the full PlantSvg/FarmerSvg are too detailed to render at 36px.
export const MobileGardenTab = forwardRef<MobileGardenTabHandle, Props>(
  function MobileGardenTab({ bookId, label, onOpen }, ref) {
    const { t } = useI18n();
    const [active, setActive] = useState<ActiveState | null>(null);
    const lockUntilRef = useRef<number>(0);

    const { data: garden } = useQuery<Garden>({
      queryKey: ["garden", bookId],
      queryFn: () => getGarden(bookId),
      enabled: !!bookId,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    });

    useImperativeHandle(
      ref,
      () => ({
        play(kind) {
          const now = Date.now();
          if (now < lockUntilRef.current) return;
          lockUntilRef.current = now + DURATION_MS;
          setActive({ kind, nonce: now });
        },
      }),
      [],
    );

    useEffect(() => {
      if (!active) return;
      const t = setTimeout(() => setActive(null), DURATION_MS);
      return () => clearTimeout(t);
    }, [active]);

    const species: SpeciesId = garden?.species ?? "ficus";
    const stage = garden?.stage ?? 0;
    const vitality = garden?.vitality ?? 0;
    const capacity = garden?.vitalityCapacity ?? 5;
    const wilting = vitality <= 1;

    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label={t("gview.tab.aria", { label, species, stage })}
        className="relative flex flex-col items-center gap-0.5 rounded-2xl px-2 py-2 text-[color:var(--color-ink-soft)] transition-all active:scale-[0.97]"
      >
        <span
          className="vig-mini relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-[linear-gradient(180deg,#FFFCF3_0%,#E8DDC4_100%)] ring-1 ring-[color:var(--color-border-strong)]/40"
          data-activity={active?.kind ?? "idle"}
        >
          {/* soil */}
          <span
            aria-hidden
            className="absolute inset-x-1 bottom-1 h-1.5 rounded-sm"
            style={{
              background: "linear-gradient(180deg, #8B6939 0%, #5A4423 100%)",
            }}
          />

          {/* plant — stripped-down silhouette sized for 36px tile */}
          <span
            key={`plant-${active?.nonce ?? "idle"}`}
            className="vig-mini-plant absolute bottom-1.5 left-1/2 -translate-x-1/2"
          >
            <MiniPlant species={species} stage={stage} wilting={wilting} />
          </span>

          {/* farmer — only visible during animations */}
          <span
            key={`farmer-${active?.nonce ?? "idle"}`}
            className="vig-mini-farmer absolute bottom-1.5 left-0.5"
          >
            <MiniFarmer />
          </span>

          {/* droplet falls from farmer's can during water */}
          <span
            key={`drop-${active?.nonce ?? "idle"}`}
            className="vig-mini-droplet absolute left-[15px] top-[8px]"
            style={{
              width: "3px",
              height: "5px",
              borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
              background: "linear-gradient(180deg, #88B0D8, #4A7CA6)",
            }}
            aria-hidden
          />

          {/* sparkle for the plant-a-leaf activity */}
          <span
            key={`spark-${active?.nonce ?? "idle"}`}
            className="vig-mini-spark absolute right-[7px] top-[6px]"
            aria-hidden
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path
                d="M5 0 L 6 4 L 10 5 L 6 6 L 5 10 L 4 6 L 0 5 L 4 4 Z"
                fill="#E8C56A"
                stroke="#3F5A2D"
                strokeWidth="0.5"
              />
            </svg>
          </span>

          {/* halo ring that pulses around the tile on activity */}
          <span
            key={`ring-${active?.nonce ?? "idle"}`}
            aria-hidden
            className="vig-mini-ring pointer-events-none absolute inset-0 rounded-xl"
            style={{
              boxShadow:
                "0 0 0 2px rgba(123, 161, 124, 0.55), 0 0 0 4px rgba(123, 161, 124, 0.15)",
            }}
          />

          {/* stage indicator — tiny roman numeral at top-right corner.
              Only when stage >= 2 so empty gardens don't look broken. */}
          {stage >= 2 && (
            <span
              aria-hidden
              className="absolute right-0.5 top-0.5 grid h-3 w-3 place-items-center rounded-full bg-[color:var(--color-ink)] font-[family-name:var(--font-display)] text-[8px] font-medium leading-none text-[color:var(--color-paper)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {romanize(stage)}
            </span>
          )}

          {/* vitality strip — three tiny dots along the bottom edge */}
          {capacity > 0 && (
            <span
              aria-hidden
              className="absolute -bottom-0 left-1/2 flex -translate-x-1/2 -translate-y-px gap-[2px]"
            >
              {Array.from({ length: Math.min(5, capacity) }).map((_, i) => (
                <span
                  key={i}
                  className="h-[3px] w-[3px] rounded-full"
                  style={{
                    background:
                      i < vitality
                        ? "rgba(136, 176, 216, 0.95)"
                        : "rgba(31, 26, 20, 0.2)",
                  }}
                />
              ))}
            </span>
          )}
        </span>

        <span className="text-[0.6rem] font-medium leading-none text-[color:var(--color-ink-soft)]">
          {label}
        </span>
      </button>
    );
  },
);

// ---------------------------------------------------------------------------
// Stripped-down silhouettes for the 36px tile
// ---------------------------------------------------------------------------

function MiniPlant({
  species, stage, wilting,
}: { species: SpeciesId; stage: number; wilting: boolean }) {
  const leaf = wilting ? "#A89060" : "#7A9858";
  const leafLight = wilting ? "#B79E6E" : "#A4BD7E";
  const stem = wilting ? "#7A6A4A" : "#3F5A2D";

  if (species === "helianthus") {
    return (
      <svg width="20" height="22" viewBox="0 0 20 22" aria-hidden>
        <path d="M10 22 L 10 8" stroke={stem} strokeWidth="1.6" strokeLinecap="round" />
        {stage >= 3 && (
          <>
            <circle cx="10" cy="6" r="5" fill={wilting ? "#C99846" : "#E8C56A"} stroke={stem} strokeWidth="0.8" />
            <circle cx="10" cy="6" r="2" fill="#B85A3A" />
          </>
        )}
        {stage >= 2 && (
          <>
            <ellipse cx="5" cy="13" rx="3" ry="1.5" fill={leaf} transform="rotate(-25 5 13)" />
            <ellipse cx="15" cy="13" rx="3" ry="1.5" fill={leafLight} transform="rotate(25 15 13)" />
          </>
        )}
      </svg>
    );
  }
  if (species === "lavandula") {
    return (
      <svg width="20" height="22" viewBox="0 0 20 22" aria-hidden>
        <path d="M10 22 L 7 9 M 10 22 L 10 6 M 10 22 L 13 9" stroke={stem} strokeWidth="1.2" strokeLinecap="round" fill="none" />
        {stage >= 3 && (
          <>
            <ellipse cx="7" cy="9" rx="1.4" ry="2" fill="#9B8FBE" stroke={stem} strokeWidth="0.6" />
            <ellipse cx="10" cy="5" rx="1.6" ry="2.4" fill="#9B8FBE" stroke={stem} strokeWidth="0.6" />
            <ellipse cx="13" cy="9" rx="1.4" ry="2" fill="#9B8FBE" stroke={stem} strokeWidth="0.6" />
          </>
        )}
      </svg>
    );
  }
  if (species === "monstera") {
    return (
      <svg width="20" height="22" viewBox="0 0 20 22" aria-hidden>
        <path d="M10 22 L 10 10" stroke={stem} strokeWidth="1.6" strokeLinecap="round" />
        {stage >= 2 && (
          <path d="M10 14 C 5 13, 2 10, 2 4 C 8 6, 10 9, 10 14 Z" fill={leaf} stroke={stem} strokeWidth="0.7" />
        )}
        {stage >= 3 && (
          <path d="M10 12 C 15 11, 18 8, 18 2 C 12 4, 10 7, 10 12 Z" fill={leafLight} stroke={stem} strokeWidth="0.7" />
        )}
      </svg>
    );
  }
  // ficus (default)
  return (
    <svg width="20" height="22" viewBox="0 0 20 22" aria-hidden>
      <path
        d="M10 22 C 9 16, 11 12, 9 8 C 8 5, 11 3, 10 1"
        stroke={stem}
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      {stage >= 2 && (
        <>
          <path d="M9 14 C 13 13, 16 11, 16 8 C 12 9, 10 11, 9 14 Z" fill={leaf} stroke={stem} strokeWidth="0.7" />
          <path d="M9 10 C 5 9, 3 7, 3 4 C 7 5, 9 7, 9 10 Z" fill={leafLight} stroke={stem} strokeWidth="0.7" />
        </>
      )}
      {stage >= 4 && (
        <circle cx="10" cy="2" r="1.5" fill={wilting ? "#C99846" : "#E8C56A"} stroke={stem} strokeWidth="0.6" />
      )}
    </svg>
  );
}

function MiniFarmer() {
  return (
    <svg width="11" height="18" viewBox="0 0 11 18" aria-hidden>
      {/* legs */}
      <path d="M3.5 12 L 3 17" stroke="#3D2A18" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M7 12 L 7.5 17" stroke="#3D2A18" strokeWidth="1.4" strokeLinecap="round" />
      {/* body */}
      <path d="M2.5 7 C 2.5 6, 3 5.5, 5.5 5.5 C 8 5.5, 8.5 6, 8.5 7 L 8.5 13 L 2.5 13 Z" fill="#B85A3A" stroke="#1F1A14" strokeWidth="0.5" />
      {/* head */}
      <circle cx="5.5" cy="4" r="2" fill="#E2B98A" stroke="#1F1A14" strokeWidth="0.5" />
      {/* hat */}
      <ellipse cx="5.5" cy="2.5" rx="3.5" ry="0.9" fill="#C99846" stroke="#1F1A14" strokeWidth="0.5" />
      <path d="M3.5 2.5 C 3.7 1, 7.3 1, 7.5 2.5 Z" fill="#E2B26A" stroke="#1F1A14" strokeWidth="0.5" />
      {/* arm with watering can — the static arm at this scale, since we're
          not animating the arm separately like the desktop vignette does. */}
      <path d="M8.5 7.5 L 11 9" stroke="#B85A3A" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="10" y="8.5" width="3" height="2" fill="#8A8E8C" stroke="#1F1A14" strokeWidth="0.4" />
    </svg>
  );
}

function romanize(n: number): string {
  return ["O", "I", "II", "III", "IV", "V", "VI", "VII"][n] ?? `${n}`;
}
