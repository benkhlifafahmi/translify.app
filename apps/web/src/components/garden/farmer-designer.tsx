"use client";

import { useState } from "react";
import type { Farmer, FarmerCoat, FarmerHat, FarmerSkin, FarmerTool } from "@/lib/garden";
import { useI18n } from "@/lib/i18n";
import { FarmerSvg } from "./farmer-svg";

const HATS: FarmerHat[] = ["straw", "wool", "scholar", "none"];
const COATS: FarmerCoat[] = ["earth", "denim", "linen", "moss"];
const SKINS: FarmerSkin[] = ["fair", "tan", "umber", "sepia"];
const TOOLS: FarmerTool[] = ["watering-can", "shears", "lantern", "book"];

const TOOL_LABEL_KEY: Record<FarmerTool, string> = {
  "watering-can": "gmisc.farmer.tool.watering-can",
  shears: "gmisc.farmer.tool.shears",
  lantern: "gmisc.farmer.tool.lantern",
  book: "gmisc.farmer.tool.book",
};

export function FarmerDesigner({ initial }: { initial: Farmer }) {
  const { t } = useI18n();
  const [farmer, setFarmer] = useState<Farmer>(initial);

  return (
    <div className="border-t border-dashed border-[color:var(--color-border-strong)]/50 pt-4">
      <div className="mb-2 font-[family-name:var(--font-display)] text-[14px] italic">
        {t("gmisc.farmer.heading")}
      </div>

      <div className="flex gap-2">
        <div className="grid aspect-square flex-1 place-items-center border border-[color:var(--color-ink)] bg-[#FBF3DD]">
          <FarmerSvg farmer={farmer} width={56} height={84} />
        </div>

        <CycleButton
          label={t("gmisc.farmer.label.hat")}
          title={farmer.hat}
          current={farmer.hat}
          options={HATS}
          onChange={(hat) => setFarmer((f) => ({ ...f, hat: hat as FarmerHat }))}
        />
        <CycleButton
          label={t("gmisc.farmer.label.coat")}
          title={farmer.coat}
          current={farmer.coat}
          options={COATS}
          onChange={(coat) => setFarmer((f) => ({ ...f, coat: coat as FarmerCoat }))}
        />
        <CycleButton
          label={t("gmisc.farmer.label.tool")}
          title={t(TOOL_LABEL_KEY[farmer.tool])}
          current={farmer.tool}
          options={TOOLS}
          onChange={(tool) => setFarmer((f) => ({ ...f, tool: tool as FarmerTool }))}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[12px] italic text-[color:var(--color-muted-foreground)]">
        <span>{t("gmisc.farmer.skin", { skin: farmer.skin })}</span>
        <button
          type="button"
          className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-paper)] px-2 py-0.5 text-[11px] uppercase tracking-[0.15em] not-italic text-[color:var(--color-ink-soft)] transition-colors hover:border-[color:var(--color-border-strong)]"
          onClick={() => {
            const next = SKINS[(SKINS.indexOf(farmer.skin) + 1) % SKINS.length];
            setFarmer((f) => ({ ...f, skin: next }));
          }}
        >
          {t("gmisc.farmer.cycle")}
        </button>
      </div>
    </div>
  );
}

function CycleButton<T extends string>({
  label, title, current, options, onChange,
}: {
  label: string;
  title: string;
  current: T;
  options: T[];
  onChange: (next: T) => void;
}) {
  return (
    <button
      type="button"
      className="grid aspect-square flex-1 place-items-center border border-dashed border-[color:var(--color-border-strong)]/60 px-1 text-center font-[family-name:var(--font-display)] text-[13px] italic text-[color:var(--color-muted-foreground)] transition-colors hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)]"
      title={title}
      onClick={() => {
        const idx = options.findIndex((o) => o === current);
        const next = options[(Math.max(0, idx) + 1) % options.length];
        onChange(next);
      }}
    >
      <span>
        {label} <span className="ml-0.5">▾</span>
      </span>
    </button>
  );
}
