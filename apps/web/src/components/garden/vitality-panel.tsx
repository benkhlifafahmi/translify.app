import type { Garden } from "@/lib/garden";
import { useI18n } from "@/lib/i18n";

const STAGE_LABEL_KEYS = [
  "gstats.stageLabel.seed",
  "gstats.stageLabel.sprout",
  "gstats.stageLabel.seedling",
  "gstats.stageLabel.stem",
  "gstats.stageLabel.budForming",
  "gstats.stageLabel.inFlower",
  "gstats.stageLabel.fullBloom",
];

export function VitalityPanel({ garden }: { garden: Garden }) {
  const { t, tn } = useI18n();
  const thriving = garden.vitality >= 4;
  const wilting = garden.vitality <= 1;
  const status = wilting
    ? t("gstats.status.wilting")
    : thriving
      ? t("gstats.status.thriving")
      : t("gstats.status.steady");
  const dotClass = wilting
    ? "bg-[color:var(--color-coral)]"
    : "bg-[color:var(--color-sage)]";

  return (
    <div
      className={[
        "relative rounded-sm border border-[color:var(--color-border)]",
        "p-6 bg-[linear-gradient(180deg,#FFFCF3_0%,var(--color-paper-2)_100%)]",
        "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)]",
      ].join(" ")}
    >
      <div className="mb-3.5 flex items-baseline justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-2xl italic">{t("gstats.vitality")}</h2>
        <span className="flex items-center gap-2 font-[family-name:var(--font-display)] text-[12px] uppercase tracking-[0.18em] text-[color:var(--color-sage-deep)]">
          <span className={`garden-pulse-dot inline-block h-2 w-2 rounded-full ${dotClass}`} />
          {status}
        </span>
      </div>

      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex gap-1.5" title={t("gstats.waterReserve")}>
          {Array.from({ length: garden.vitalityCapacity }).map((_, i) => (
            <DropletGlyph key={i} filled={i < garden.vitality} />
          ))}
        </div>
        <div className="text-right">
          <div className="font-[family-name:var(--font-display)] text-[42px] font-light leading-none tracking-[-0.03em] tabular-nums">
            {garden.daysUntilThirst}
            <span className="ml-0.5 text-[22px] italic text-[color:var(--color-muted-foreground)]">
              {t("gstats.reserve.outOf")}
            </span>
          </div>
          <div className="mt-1 font-[family-name:var(--font-display)] text-[13px] italic text-[color:var(--color-muted-foreground)]">
            {t("gstats.reserve.days")}
          </div>
        </div>
      </div>

      {/* growth bar */}
      <div className="relative h-2.5 overflow-hidden rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-paper-3)]">
        <div
          className="garden-growth-fill h-full rounded-full bg-[linear-gradient(90deg,var(--color-sage),var(--color-sage-deep))]"
          style={{ ["--garden-fill" as string]: `${garden.growthPercent}%` }}
        />
        <span className="absolute -top-[3px] left-[25%] h-4 w-[2px] bg-[color:var(--color-ink)]" />
        <span className="absolute -top-[3px] right-0 h-4 w-[2px] bg-[color:var(--color-ink)]" />
      </div>
      <div className="mt-2 flex justify-between font-[family-name:var(--font-display)] text-[12px] italic text-[color:var(--color-muted-foreground)]">
        <span>
          <b className="font-medium not-italic text-[color:var(--color-sage-deep)]">
            {t(STAGE_LABEL_KEYS[garden.stage])}
          </b>
        </span>
        <span>{t("gstats.toBloom", { percent: garden.growthPercent })}</span>
      </div>

      {/* stat grid */}
      <div className="mt-5 grid grid-cols-2 border-t border-dashed border-[color:var(--color-border-strong)]/50">
        <StatCell
          label={t("gstats.stat.pagesTurned")}
          val={garden.pagesRead.toString()}
          sup={`/${garden.pageCount}`}
          sub={t("gstats.stat.pagesDelta", { delta: garden.pagesReadDelta })}
        />
        <StatCell
          label={t("gstats.stat.quizzesAnswered")}
          val={garden.quizzesAnswered.toString()}
          sup={`/${garden.quizzesTotal}`}
          sub={t("gstats.stat.quizAccuracy", { percent: garden.quizAccuracyPercent })}
          rightCol
        />
        <StatCell
          label={t("gstats.stat.newLeaves")}
          val={garden.newLeaves.toString()}
          sub={garden.lastLeafAt ? t("gstats.stat.lastGrown", { when: relTime(garden.lastLeafAt, tn) }) : t("gstats.stat.noLeaves")}
          topBordered
        />
        <StatCell
          label={t("gstats.stat.streak")}
          val={garden.streakDays.toString()}
          sup={t("gstats.stat.streakUnit")}
          sub={t("gstats.stat.personalBest", { best: garden.bestStreakDays })}
          rightCol
          topBordered
        />
      </div>
    </div>
  );
}

function StatCell({
  label, val, sup, sub, rightCol = false, topBordered = false,
}: {
  label: string;
  val: string;
  sup?: string;
  sub?: string;
  rightCol?: boolean;
  topBordered?: boolean;
}) {
  return (
    <div
      className={[
        "py-4",
        rightCol ? "pl-5" : "pr-5 border-r border-dashed border-[color:var(--color-border-strong)]/50",
        topBordered ? "border-t border-dashed border-[color:var(--color-border-strong)]/50" : "",
      ].join(" ")}
    >
      <div className="mb-1 font-[family-name:var(--font-display)] text-[12px] italic text-[color:var(--color-muted-foreground)] tracking-[0.05em]">
        {label}
      </div>
      <div className="font-[family-name:var(--font-display)] text-[30px] leading-tight tracking-[-0.01em] tabular-nums">
        {val}
        {sup && <sup className="ml-0.5 text-[14px] italic text-[color:var(--color-muted-foreground)]">{sup}</sup>}
      </div>
      {sub && (
        <div className="mt-0.5 text-[12px] italic text-[color:var(--color-muted-foreground)]">
          {sub}
        </div>
      )}
    </div>
  );
}

function DropletGlyph({ filled }: { filled: boolean }) {
  return (
    <svg width="22" height="28" viewBox="0 0 22 28" aria-hidden>
      <path
        d="M11 2 C 4 12, 2 18, 11 26 C 20 18, 18 12, 11 2 Z"
        fill={filled ? "#88B0D8" : "none"}
        stroke="#1F1A14"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function relTime(
  iso: string,
  tn: (key: string, n: number, vars?: Record<string, string | number>) => string,
): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return tn("gstats.rel.minutes", minutes);
  const hours = Math.round(minutes / 60);
  if (hours < 24) return tn("gstats.rel.hours", hours);
  const days = Math.round(hours / 24);
  return tn("gstats.rel.days", days);
}
