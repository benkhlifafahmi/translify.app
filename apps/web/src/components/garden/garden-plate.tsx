"use client";

import type { Garden } from "@/lib/garden";
import { daysSince, SPECIES } from "@/lib/garden";
import { PlantSvg } from "./plant-svg";
import { FarmerSvg } from "./farmer-svg";

const STAGE_NAMES = [
  "seed", "sprout", "seedling", "stem", "bud forming", "in flower", "full bloom",
];

export function GardenPlate({ garden }: { garden: Garden }) {
  const species = SPECIES.find((s) => s.id === garden.species)!;
  const stageName = STAGE_NAMES[garden.stage];
  const wilting = garden.vitality <= 1;
  const day = daysSince(garden.startedAt);

  return (
    <div
      className={[
        "relative overflow-hidden rounded-sm border border-[color:var(--color-border)]",
        "p-7 pt-7 pb-0 min-h-[540px]",
        "bg-[linear-gradient(180deg,#FFFCF3_0%,var(--color-paper-2)_100%)]",
        "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6),inset_0_0_60px_rgba(139,100,50,0.07),0_1px_0_var(--color-border),0_20px_40px_-30px_rgba(60,40,10,0.4)]",
      ].join(" ")}
    >
      {/* dashed inner herbarium frame */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[14px] rounded-sm border border-dashed border-[color:var(--color-border-strong)]/60"
      />

      <div className="relative z-[2] mb-1 flex items-baseline justify-between font-[family-name:var(--font-display)] text-[13px] uppercase tracking-[0.22em] text-[color:var(--color-ink-soft)]">
        <span className="normal-case tracking-normal text-[17px] italic text-[color:var(--color-sage-deep)]">
          specimen — <span className="font-medium not-italic">{species.name}</span>
        </span>
        <span className="text-[color:var(--color-muted-foreground)] tabular-nums">
          № 04 · {garden.bookId.slice(-4)}
        </span>
      </div>
      <div className="relative z-[2] mb-1 italic text-[14px] text-[color:var(--color-muted-foreground)]">
        cultivated in the soil of <em>magical realism</em> · stage {romanize(garden.stage)} of VII
      </div>

      {/* SCENE */}
      <div className="relative z-[1] mx-[-10px] h-[460px]">
        {/* glass dome */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-3 inset-x-[8%] z-[2] rounded-t-[220px] rounded-b-[14px] border border-[rgba(60,40,10,0.18)]"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.36) 0%, rgba(255,255,255,0.06) 30%, rgba(180,160,110,0.07) 100%)",
            boxShadow:
              "inset 0 8px 24px rgba(255,255,255,0.6), inset 0 -6px 18px rgba(120,90,40,0.15), inset 22px 0 28px -20px rgba(255,255,255,0.4)",
          }}
        >
          {/* highlight streak */}
          <span
            aria-hidden
            className="absolute left-[22%] top-[18px] h-[56%] w-[26px] rounded-full"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.55), transparent)",
              transform: "rotate(-8deg)",
            }}
          />
        </div>

        {/* falling water droplet */}
        <span aria-hidden className="garden-droplet" />

        {/* PLANT */}
        <div className="garden-plant absolute left-1/2 top-6 z-[3]">
          <PlantSvg species={garden.species} stage={garden.stage} wilting={wilting} />
        </div>

        {/* FARMER */}
        <div className="absolute bottom-7 right-[14%] z-[4] drop-shadow-[0_2px_0_rgba(60,40,10,0.1)]">
          <FarmerSvg farmer={garden.farmer} />
        </div>

        {/* SOIL */}
        <div
          aria-hidden
          className="absolute inset-x-[8%] bottom-4 z-[3] h-14 rounded-t-md rounded-b-xl"
          style={{
            background: "linear-gradient(180deg, #8B6939 0%, #5A4423 100%)",
            boxShadow: "inset 0 2px 0 #A38456, inset 0 -8px 16px rgba(0,0,0,0.25)",
          }}
        >
          <span
            aria-hidden
            className="block h-full w-full rounded-[inherit] opacity-85"
            style={{
              backgroundImage: [
                "radial-gradient(circle at 12% 40%, #3a2a14 1px, transparent 2px)",
                "radial-gradient(circle at 28% 70%, #3a2a14 1px, transparent 2px)",
                "radial-gradient(circle at 47% 30%, #2c1f0d 1px, transparent 2px)",
                "radial-gradient(circle at 63% 64%, #3a2a14 1px, transparent 2px)",
                "radial-gradient(circle at 81% 38%, #2c1f0d 1px, transparent 2px)",
                "radial-gradient(circle at 92% 72%, #3a2a14 1px, transparent 2px)",
              ].join(","),
            }}
          />
        </div>

        {/* margin annotations — handwritten */}
        <div
          className="absolute right-4 top-[30%] z-[5] max-w-[130px] rotate-[3deg] text-right font-[family-name:var(--font-display)] text-[18px] italic leading-tight text-[color:var(--color-coral-deep)]/85"
        >
          new bud<br />
          this morning
          <span className="mt-1 block rotate-[-160deg] text-[28px] leading-none text-[color:var(--color-coral)]">
            ↩
          </span>
        </div>
        <div
          className="absolute bottom-[110px] left-5 z-[5] -rotate-2 font-[family-name:var(--font-display)] text-[17px] italic text-[color:var(--color-sage-deep)]/85"
        >
          ※ watered by ch. {Math.max(1, garden.pagesRead - 200)}
        </div>
      </div>

      {/* CAPTION */}
      <div className="relative z-[2] mt-[-8px] flex justify-between border-t border-dashed border-[color:var(--color-border-strong)]/50 px-1 pb-5 pt-4 font-[family-name:var(--font-display)] text-[13px] italic text-[color:var(--color-ink-soft)]">
        <div>
          <strong className="mb-0.5 block text-[11px] not-italic font-medium uppercase tracking-[0.05em] text-[color:var(--color-muted-foreground)]">
            Drawn from life
          </strong>
          The Garden of {garden.farmer.name}, day {day}
        </div>
        <div className="text-right">
          <strong className="mb-0.5 block text-[11px] not-italic font-medium uppercase tracking-[0.05em] text-[color:var(--color-muted-foreground)]">
            Hand · Translify Almanac
          </strong>
          fig. {romanize(garden.stage).toLowerCase()} · {stageName}
        </div>
      </div>
    </div>
  );
}

function romanize(n: number): string {
  return ["O", "I", "II", "III", "IV", "V", "VI", "VII"][n] ?? `${n}`;
}
