"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { GardenPlate } from "./garden-plate";
import { VitalityPanel } from "./vitality-panel";
import { WeeklyTendingCard } from "./weekly-tending-card";
import { GrowthJournal } from "./growth-journal";
import { SpeciesPicker } from "./species-picker";
import { daysSince, getGarden, type Garden } from "@/lib/garden";

interface Props {
  bookId: string;
}

// The same detailed garden content as /garden/[bookId], rearranged for a
// vertical mobile bottom-sheet. The drawer is 88dvh tall, scrollable, so
// this is rendered as a single-column scroll surface.
export function MobileGardenPanel({ bookId }: Props) {
  const { data: garden, isLoading } = useQuery<Garden>({
    queryKey: ["garden", bookId],
    queryFn: () => getGarden(bookId),
    enabled: !!bookId,
  });

  if (isLoading || !garden) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-10">
        <p className="font-[family-name:var(--font-display)] italic text-[color:var(--color-ink-soft)]">
          Drawing the specimen…
        </p>
      </div>
    );
  }

  const day = daysSince(garden.startedAt);

  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 pb-12 pt-2">
      {/* Editorial micro-header */}
      <div className="mb-3 flex items-center justify-between font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.18em] italic text-[color:var(--color-muted-foreground)]">
        <span>Plate № {bookId.slice(-2)} · day {day}</span>
        <span className="text-[color:var(--color-sage-deep)] normal-case tracking-normal text-[12px]">
          {garden.species}
        </span>
      </div>

      <h2 className="mb-1 font-[family-name:var(--font-display)] text-[28px] font-light italic leading-[1] tracking-[-0.02em]">
        <span className="text-[color:var(--color-coral)]">The Garden of</span>
        <br />
        <span className="font-medium">{garden.bookTitle}</span>
      </h2>
      <p className="mb-5 max-w-[44ch] font-[family-name:var(--font-display)] text-[14px] italic text-[color:var(--color-ink-soft)]">
        Each page turned waters the soil — neglect, and the green will turn.
      </p>

      {/* PLATE — the visual hero */}
      <div className="mb-5">
        <GardenPlate garden={garden} />
      </div>

      {/* VITALITY */}
      <div className="mb-5">
        <VitalityPanel garden={garden} />
      </div>

      {/* WEEKLY TENDING */}
      <div className="mb-6">
        <WeeklyTendingCard garden={garden} />
      </div>

      {/* JOURNAL */}
      <div className="mb-6">
        <GrowthJournal entries={garden.journal} />
      </div>

      {/* SPECIES PICKER */}
      <div className="mb-7 rounded-sm border border-[color:var(--color-border)] bg-[linear-gradient(180deg,#FFFCF3_0%,var(--color-paper-2)_100%)] p-5">
        <SpeciesPicker selected={garden.species} />
      </div>

      {/* CTA to full almanac */}
      <Link
        href={`/garden/${bookId}`}
        className="group inline-flex items-center justify-center gap-2.5 rounded-[2px] bg-[color:var(--color-ink)] px-5 py-3.5 font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.16em] text-[color:var(--color-paper)] transition-all hover:translate-x-1 hover:bg-[color:var(--color-sage-deep)]"
      >
        Open the full almanac
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </Link>

      {/* Colophon */}
      <p className="mt-6 text-center font-[family-name:var(--font-display)] text-[11px] italic text-[color:var(--color-muted-foreground)]">
        plate of {garden.bookTitle}
      </p>
    </div>
  );
}
