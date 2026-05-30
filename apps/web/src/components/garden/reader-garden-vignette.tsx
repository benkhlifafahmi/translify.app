"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { PlantSvg } from "./plant-svg";
import { FarmerSvg } from "./farmer-svg";
import {
  getGarden,
  type Farmer,
  type Garden,
  type GrowthStage,
  type SpeciesId,
} from "@/lib/garden";

export type VignetteActivity = "water" | "plant";

export interface ReaderGardenVignetteHandle {
  /** Trigger an animation. Subsequent calls during playback are dropped. */
  play(kind: VignetteActivity, caption?: string): void;
}

interface Props {
  bookId: string;
}

interface ActiveState {
  kind: VignetteActivity;
  caption: string;
  nonce: number;
}

const ANIMATION_DURATION_MS = 2_650;
// Default farmer/plant for the brief window before the garden query resolves
// — keeps the vignette from popping in awkwardly on first paint.
const FALLBACK_SPECIES: SpeciesId = "ficus";
const FALLBACK_FARMER: Farmer = {
  hat: "straw", coat: "earth", skin: "tan", tool: "watering-can", name: "",
};

export const ReaderGardenVignette = forwardRef<ReaderGardenVignetteHandle, Props>(
  function ReaderGardenVignette({ bookId }, ref) {
    const [active, setActive] = useState<ActiveState | null>(null);
    const lockUntilRef = useRef<number>(0);

    const { data: garden } = useQuery<Garden>({
      queryKey: ["garden", bookId],
      queryFn: () => getGarden(bookId),
      enabled: !!bookId,
      // Don't hammer the API from the reader — the page-event flush will
      // bring fresh state when the user navigates.
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    });

    useImperativeHandle(
      ref,
      () => ({
        play(kind, caption) {
          const now = Date.now();
          if (now < lockUntilRef.current) return; // drop overlapping calls
          lockUntilRef.current = now + ANIMATION_DURATION_MS;
          setActive({
            kind,
            caption: caption ?? defaultCaption(kind),
            nonce: now,
          });
        },
      }),
      [],
    );

    useEffect(() => {
      if (!active) return;
      const t = setTimeout(() => setActive(null), ANIMATION_DURATION_MS);
      return () => clearTimeout(t);
    }, [active]);

    const species = garden?.species ?? FALLBACK_SPECIES;
    const stage = (garden?.stage ?? 0) as GrowthStage;
    const farmer = garden?.farmer ?? FALLBACK_FARMER;
    const vitality = garden?.vitality ?? 0;
    const capacity = garden?.vitalityCapacity ?? 5;

    // Pick a stage label like "stage IV · in bud" from the current stage.
    const stageLabel = useMemo(() => stageNames[stage] ?? "growing", [stage]);

    // No garden record yet AND no query in flight — still render the idle
    // vignette so the affordance is always present. (The first read event
    // will lazily create the garden server-side.)

    return (
      <Link
        href={`/garden/${bookId}`}
        aria-label="Open this book's garden"
        title="Open this book's garden"
        className={[
          "group fixed bottom-5 left-[calc(25%_+_1.25rem)] z-20 hidden",
          "lg:block",
          // sit *above* any viewer chrome bars
          "pointer-events-auto",
        ].join(" ")}
        style={{ animation: "float-in 0.6s ease-out 0.4s both" }}
      >
        <div
          className="vig-frame relative w-[244px] rounded-sm border border-[color:var(--color-border)] bg-[linear-gradient(180deg,#FFFCF3_0%,var(--color-paper-2)_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6),0_18px_30px_-22px_rgba(60,40,10,0.5)]"
          style={{ transform: "rotate(-0.6deg)" }}
          data-activity={active?.kind ?? "idle"}
        >
          {/* dashed inner specimen frame */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-2 rounded-sm border border-dashed border-[color:var(--color-border-strong)]/60"
          />

          {/* header strip */}
          <div className="relative z-[2] flex items-center justify-between px-3 pt-2.5 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-muted-foreground)]">
            <span className="italic normal-case tracking-normal text-[12px] text-[color:var(--color-sage-deep)]">
              specimen
            </span>
            <span className="tabular-nums">{stageLabel}</span>
          </div>

          {/* SCENE */}
          <div className="relative h-[120px] overflow-hidden">
            {/* horizon line */}
            <span
              aria-hidden
              className="absolute inset-x-3 bottom-2 z-[1] h-[10px] rounded-t-md"
              style={{
                background: "linear-gradient(180deg, #8B6939 0%, #5A4423 100%)",
                boxShadow: "inset 0 1px 0 #A38456",
              }}
            />

            {/* plant — keyed so the drink animation can restart */}
            <div
              key={`plant-${active?.nonce ?? "idle"}`}
              className="vig-plant absolute bottom-3 left-1/2 z-[3] -translate-x-1/2"
            >
              <PlantSvg
                species={species}
                stage={Math.max(2, stage) as GrowthStage}
                width={92}
                height={108}
              />
            </div>

            {/* New leaf — only present during "plant" activity */}
            <span
              key={`leaf-${active?.nonce ?? "idle"}`}
              aria-hidden
              className="vig-leaf-new absolute bottom-[28px] left-1/2 z-[4] -translate-x-1/2"
              style={{ marginLeft: "14px" }}
            >
              <svg width="22" height="18" viewBox="0 0 22 18">
                <path
                  d="M2 16 C 4 6, 14 1, 21 4 C 18 12, 9 17, 2 16 Z"
                  fill="#A4BD7E"
                  stroke="#3F5A2D"
                  strokeWidth="1.2"
                />
                <path d="M2 16 C 8 12, 16 8, 21 4" stroke="#3F5A2D" strokeWidth="0.7" fill="none" />
              </svg>
            </span>

            {/* Sparkle for the planted leaf */}
            <span
              key={`spark-${active?.nonce ?? "idle"}`}
              aria-hidden
              className="vig-spark absolute bottom-[44px] z-[5]"
              style={{ left: "calc(50% + 26px)" }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14">
                <path
                  d="M7 1 L 8 6 L 13 7 L 8 8 L 7 13 L 6 8 L 1 7 L 6 6 Z"
                  fill="#E8C56A"
                  stroke="#3F5A2D"
                  strokeWidth="0.6"
                />
              </svg>
            </span>

            {/* dust puff at farmer entry */}
            <span
              key={`dust-l-${active?.nonce ?? "idle"}`}
              aria-hidden
              className="vig-dust-l absolute bottom-3 left-3 z-[4] h-2 w-3 rounded-full bg-[#C9B68B]"
            />
            <span
              key={`dust-r-${active?.nonce ?? "idle"}`}
              aria-hidden
              className="vig-dust-r absolute bottom-3 left-3 z-[4] h-2 w-3 rounded-full bg-[#C9B68B]"
            />

            {/* farmer — keyed so re-mount restarts walk-in */}
            <div
              key={`farmer-${active?.nonce ?? "idle"}`}
              className="vig-farmer absolute bottom-2.5 left-2.5 z-[5]"
            >
              <FarmerWithAnimatedArm farmer={farmer} />
            </div>

            {/* droplet — falls from the can spout */}
            <span
              key={`drop-${active?.nonce ?? "idle"}`}
              aria-hidden
              className="vig-droplet absolute z-[6]"
              style={{
                left: "62px",
                top: "26px",
                width: "6px",
                height: "9px",
                borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                background: "linear-gradient(180deg, #88B0D8, #4A7CA6)",
              }}
            />

            {/* soil ripple where the droplet lands */}
            <span
              key={`ripple-${active?.nonce ?? "idle"}`}
              aria-hidden
              className="vig-ripple absolute z-[2]"
              style={{
                left: "58px",
                bottom: "12px",
                width: "12px",
                height: "3px",
                borderRadius: "100px",
                background: "rgba(255, 240, 200, 0.85)",
              }}
            />

            {/* caption stamp */}
            {active?.caption && (
              <span
                key={`cap-${active.nonce}`}
                className="vig-caption absolute right-3 top-2 z-[7] rounded-full border border-[color:var(--color-ink)] bg-[color:var(--color-paper)]/90 px-2 py-0.5 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-ink)]"
              >
                {active.caption}
              </span>
            )}
          </div>

          {/* footer: vitality dots + open hint */}
          <div className="relative z-[2] flex items-center justify-between border-t border-dashed border-[color:var(--color-border-strong)]/50 px-3 py-2">
            <div className="flex gap-1" aria-label={`vitality ${vitality} of ${capacity}`}>
              {Array.from({ length: capacity }).map((_, i) => (
                <span
                  key={i}
                  className="h-2 w-2 rounded-full"
                  style={{
                    background: i < vitality ? "#88B0D8" : "transparent",
                    border: "1px solid #1F1A14",
                  }}
                />
              ))}
            </div>
            <span className="font-[family-name:var(--font-display)] text-[11px] italic text-[color:var(--color-muted-foreground)] transition-colors group-hover:text-[color:var(--color-ink)]">
              open garden →
            </span>
          </div>
        </div>
      </Link>
    );
  },
);

// ---------------------------------------------------------------------------

const stageNames = [
  "stage 0", "stage I", "stage II", "stage III", "stage IV", "stage V", "stage VI",
] as const;

function defaultCaption(kind: VignetteActivity): string {
  switch (kind) {
    case "water": return "+ watered";
    case "plant": return "+ new leaf";
  }
}

/**
 * Local copy of the farmer composed with the watering-can arm broken out as
 * its own `.vig-farmer-arm` group so CSS can tilt it independently.
 * Keeps FarmerSvg in the rest of the app unchanged (it's used at smaller
 * sizes where the arm rig isn't worth the complexity).
 */
function FarmerWithAnimatedArm({ farmer }: { farmer: Farmer }) {
  // We re-use the base FarmerSvg for everything except the right arm + tool
  // by absolutely overlaying our own arm on top. The base SVG already draws
  // an arm — we cover it with a parchment-coloured patch and redraw on top.
  return (
    <span className="relative inline-block">
      <FarmerSvg farmer={farmer} width={54} height={84} />
      {/* mask out the static arm with a small patch matching the scene bg */}
      <span
        aria-hidden
        className="absolute"
        style={{
          // Coordinates derived from FarmerSvg viewBox (78×120) scaled to 54×84.
          left: "calc(54px * 50 / 78)",
          top: "calc(84px * 56 / 120)",
          width: "calc(54px * 24 / 78)",
          height: "calc(84px * 36 / 120)",
          background: "linear-gradient(180deg,#FFFCF3_0%,var(--color-paper-2)_100%)",
        }}
      />
      {/* overlay arm + watering can, pivoting from the shoulder */}
      <svg
        className="vig-farmer-arm pointer-events-none absolute"
        style={{
          left: "calc(54px * 50 / 78)",
          top: "calc(84px * 56 / 120)",
          width: "calc(54px * 28 / 78)",
          height: "calc(84px * 36 / 120)",
          overflow: "visible",
        }}
        viewBox="0 0 28 36"
        aria-hidden
      >
        {/* arm */}
        <path d="M2 4 L 16 18 L 14 28" stroke={coatStroke(farmer.coat)} strokeWidth="4.5" strokeLinecap="round" />
        {/* watering can */}
        <g transform="translate(6 22)">
          <rect x="0" y="0" width="11" height="9" fill="#8A8E8C" stroke="#1F1A14" strokeWidth="1" rx="1" />
          <path d="M11 1 L 17 -2 L 17 3 L 11 5 Z" fill="#8A8E8C" stroke="#1F1A14" strokeWidth="1" />
          <path d="M-1 0 C -3 -1, -2 -4, 1 -3" stroke="#1F1A14" strokeWidth="1" fill="none" />
        </g>
      </svg>
    </span>
  );
}

function coatStroke(coat: Farmer["coat"]): string {
  switch (coat) {
    case "denim": return "#3E5878";
    case "linen": return "#C8B68F";
    case "earth": return "#B85A3A";
    case "moss":  return "#5F8763";
  }
}
