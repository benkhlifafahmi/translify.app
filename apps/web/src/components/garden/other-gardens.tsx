"use client";

import Link from "next/link";
import type { GardenSummary } from "@/lib/garden";
import { useI18n } from "@/lib/i18n";
import { PlantSvg } from "./plant-svg";

const HEALTH_KEY: Record<GardenSummary["health"], string> = {
  thriving: "gmisc.gardens.health.thriving",
  budding: "gmisc.gardens.health.budding",
  wilting: "gmisc.gardens.health.wilting",
  dying: "gmisc.gardens.health.dying",
};

export function OtherGardens({ gardens }: { gardens: GardenSummary[] }) {
  const { t } = useI18n();
  const thriving = gardens.filter((g) => g.health === "thriving" || g.health === "budding").length;
  const wilting = gardens.filter((g) => g.health === "wilting" || g.health === "dying").length;

  return (
    <section className="mt-16">
      <div className="mb-5 flex items-baseline justify-between border-b border-[color:var(--color-border)] pb-3">
        <h2 className="font-[family-name:var(--font-display)] text-[34px] font-light italic leading-none tracking-[-0.01em]">
          {t("gmisc.gardens.heading")}
        </h2>
        <span className="font-[family-name:var(--font-display)] text-[13px] italic uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
          {t("gmisc.gardens.summary", { thriving, wilting })}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {gardens.map((g) => {
          const dying = g.health === "wilting" || g.health === "dying";
          return (
            <Link
              key={g.bookId}
              href={`/garden/${g.bookId}`}
              className="group block rounded-sm border border-[color:var(--color-border)] bg-[color:var(--color-paper)]/55 p-4 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-paper-lg)]"
            >
              <div className="relative mb-3.5 h-[120px] overflow-hidden border border-dashed border-[color:var(--color-border)] bg-[linear-gradient(180deg,#FFFCF3_0%,var(--color-paper-2)_100%)]">
                <span
                  className={[
                    "absolute right-2 top-2 z-[2] border border-[color:var(--color-border)] bg-[color:var(--color-paper)]/85 px-1.5 py-0.5",
                    "font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.16em]",
                    dying ? "text-[color:var(--color-coral-deep)]" : "text-[color:var(--color-sage-deep)]",
                  ].join(" ")}
                >
                  {t(HEALTH_KEY[g.health])}
                </span>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                  <PlantSvg
                    species={g.species}
                    stage={g.stage}
                    wilting={dying}
                    width={58}
                    height={80}
                  />
                </div>
                {/* soil */}
                <span
                  aria-hidden
                  className="absolute inset-x-2 bottom-1.5 h-3.5 rounded"
                  style={{ background: "linear-gradient(180deg, #8B6939, #5A4423)" }}
                />
              </div>

              <div className="line-clamp-2 font-[family-name:var(--font-display)] text-[18px] italic leading-tight">
                {g.bookTitle}
              </div>
              <div className="mt-0.5 text-xs italic text-[color:var(--color-muted-foreground)]">
                {g.bookAuthor}
              </div>

              <div className="mt-3 h-1 overflow-hidden rounded-full bg-[color:var(--color-paper-3)]">
                <div
                  className={`h-full ${dying ? "bg-[color:var(--color-coral)]" : "bg-[color:var(--color-sage-deep)]"}`}
                  style={{ width: `${g.growthPercent}%` }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
