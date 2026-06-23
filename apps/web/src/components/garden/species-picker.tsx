"use client";

import { useState } from "react";
import { SPECIES, type SpeciesId } from "@/lib/garden";
import { useI18n } from "@/lib/i18n";
import { PlantSvg } from "./plant-svg";

interface SpeciesPickerProps {
  selected: SpeciesId;
  onSelect?: (id: SpeciesId) => void;
}

export function SpeciesPicker({ selected: initial, onSelect }: SpeciesPickerProps) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<SpeciesId>(initial);

  const pick = (id: SpeciesId, unlocked: boolean) => {
    if (!unlocked) return;
    setSelected(id);
    onSelect?.(id);
  };

  return (
    <div>
      <h3 className="mb-1 font-[family-name:var(--font-display)] text-[22px] italic">{t("gmisc.species.heading")}</h3>
      <p className="mb-4 text-[13px] italic text-[color:var(--color-muted-foreground)]">
        {t("gmisc.species.subhead")}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {SPECIES.map((s) => {
          const active = s.id === selected;
          return (
            <button
              key={s.id}
              type="button"
              disabled={!s.unlocked}
              onClick={() => pick(s.id, s.unlocked)}
              className={[
                "relative cursor-pointer rounded-sm border p-3 text-center transition-all",
                active
                  ? "border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-paper)]"
                  : "border-[color:var(--color-border)] bg-[color:var(--color-paper)] text-[color:var(--color-ink)] hover:-translate-y-0.5 hover:shadow-[0_12px_18px_-16px_rgba(60,40,10,0.55)]",
                !s.unlocked && "cursor-not-allowed opacity-55 hover:translate-y-0 hover:shadow-none",
              ].join(" ")}
              title={t(`gmisc.species.${s.id}.blurb`)}
            >
              <div className="mb-2 flex justify-center">
                <PlantSvg species={s.id} stage={4} width={48} height={56} />
              </div>
              <div className="font-[family-name:var(--font-display)] text-[15px] italic">
                {t(`gmisc.species.${s.id}.name`)}
              </div>
              <div
                className={`mt-0.5 text-[10px] uppercase tracking-[0.16em] ${
                  active ? "text-[color:var(--color-paper)]/60" : "text-[color:var(--color-muted-foreground)]"
                }`}
              >
                {t(`gmisc.species.${s.id}.latin`)}
              </div>
              {!s.unlocked && (
                <span className="absolute bottom-1.5 right-1.5 text-[10px] opacity-60">🔒</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
