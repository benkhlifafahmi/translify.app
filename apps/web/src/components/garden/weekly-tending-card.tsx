"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { countdown, type Garden } from "@/lib/garden";
import { useI18n } from "@/lib/i18n";

export function WeeklyTendingCard({ garden }: { garden: Garden }) {
  const { t, tn } = useI18n();
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const remaining = countdown(garden.weeklyTendingDueAt, now);
  const dueMs = new Date(garden.weeklyTendingDueAt).getTime() - now;
  const urgent = dueMs < 24 * 3_600_000;
  const dueText = dueMs <= 0
    ? t("tend.card.due.overdue")
    : dueMs < 24 * 3_600_000
      ? t("tend.card.due.soon")
      : tn("tend.card.due.days", Math.ceil(dueMs / (24 * 3_600_000)));

  return (
    <div className="relative overflow-hidden rounded-sm border border-[color:var(--color-ink)] bg-[linear-gradient(180deg,#FBF3DD_0%,#F4E9C9_100%)] p-6">
      {/* corner tab */}
      <span
        aria-hidden
        className="absolute right-0 top-0 h-16 w-16 bg-[color:var(--color-ink)]"
        style={{ transform: "rotate(45deg) translate(28px, -28px)" }}
      />
      <span
        aria-hidden
        className="absolute right-2.5 top-1.5 z-[2] font-[family-name:var(--font-display)] text-[20px] italic text-[color:var(--color-paper)]"
      >
        Q
      </span>

      <h3 className="mb-1.5 font-[family-name:var(--font-display)] text-[22px] leading-tight tracking-[-0.01em]">
        {t("tend.card.title")}{" "}
        <em className={urgent ? "text-[color:var(--color-coral-deep)]" : "text-[color:var(--color-coral)]"}>
          {dueText}
        </em>
      </h3>
      <p className="mb-4 max-w-[88%] text-sm italic text-[color:var(--color-ink-soft)]">
        {t("tend.card.blurb", {
          chapters: garden.pagesRead > 200 ? "9 — 14" : "1 — 8",
          species: speciesShort(garden, t),
        })}
      </p>

      <Link
        href={`/garden/${garden.bookId}/quiz`}
        className="group inline-flex items-center gap-2.5 rounded-[2px] border-none bg-[color:var(--color-ink)] px-5 py-3 font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.16em] text-[color:var(--color-paper)] transition-all hover:translate-x-1 hover:bg-[color:var(--color-sage-deep)]"
      >
        {t("tend.begin")}
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </Link>

      <div className="absolute bottom-4 right-5 text-right font-[family-name:var(--font-display)] italic text-[color:var(--color-ink-soft)]">
        <b className="block text-[28px] font-medium not-italic tracking-[-0.02em] tabular-nums text-[color:var(--color-ink)]">
          {remaining}
        </b>
        <small className="text-[11px] not-italic uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
          {t("tend.card.untilThirst")}
        </small>
      </div>
    </div>
  );
}

function speciesShort(garden: Garden, t: (key: string) => string): string {
  switch (garden.species) {
    case "ficus": return t("tend.card.species.ficus");
    case "helianthus": return t("tend.card.species.helianthus");
    case "lavandula": return t("tend.card.species.lavandula");
    case "monstera": return t("tend.card.species.monstera");
  }
}
