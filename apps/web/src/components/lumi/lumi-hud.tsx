"use client";

// Lumi HUD — the persistent XP bar + level + streak chip.
//
// Sits in the library page header so logged-in users always see their progress.
// Click to expand into a panel with achievement list (future).

import { Lumi } from "./lumi";
import { useLumi } from "./lumi-context";
import { LEVEL_TITLES, xpToNextLevel } from "@/lib/lumi-progress";

export function LumiHud() {
  const { progress } = useLumi();
  const xpInfo = xpToNextLevel(progress);
  const title = LEVEL_TITLES[progress.level];

  return (
    <div className="flex items-center gap-3 rounded-full border-[1.5px] border-[color:var(--color-border)] bg-white/70 px-2 py-1.5 pr-4 backdrop-blur-sm transition-all hover:border-[color:var(--color-saffron)] hover:shadow-[var(--shadow-paper)]">
      {/* Lumi avatar with level ring */}
      <div className="relative grid h-10 w-10 shrink-0 place-items-center">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-gradient-to-br from-[color:var(--color-saffron)]/25 to-[color:var(--color-sage)]/20"
        />
        <div className="absolute inset-0.5 grid place-items-center overflow-hidden rounded-full bg-[color:var(--color-paper)]">
          <Lumi state="happy" size={40} level={progress.level} animate={false} />
        </div>
      </div>

      <div className="flex min-w-0 flex-col">
        <div className="flex items-baseline gap-2">
          <span className="font-[family-name:var(--font-display)] text-[13px] font-semibold leading-tight text-[color:var(--color-ink)]">
            Lv {progress.level}
          </span>
          <span className="truncate text-[10px] font-medium uppercase tracking-[0.1em] text-[color:var(--color-ink-soft)]">
            {title}
          </span>
        </div>

        {/* XP bar */}
        <div className="mt-1 flex items-center gap-2">
          <div className="relative h-1.5 w-32 overflow-hidden rounded-full bg-[color:var(--color-paper-3)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[color:var(--color-saffron)] to-[color:var(--color-saffron-deep)] transition-[width] duration-700 ease-out"
              style={{ width: xpInfo ? `${xpInfo.pct}%` : "100%" }}
            />
          </div>
          <span className="font-mono text-[10px] tabular-nums text-[color:var(--color-ink-soft)]">
            {xpInfo ? `${progress.xp}/${xpInfo.next}` : `${progress.xp} · MAX`}
          </span>
        </div>
      </div>

      {/* Streak chip */}
      {progress.streakDays > 0 && (
        <div className="ml-1 flex items-center gap-1 rounded-full bg-[color:var(--color-coral)]/15 px-2 py-0.5 text-[11px] font-semibold text-[color:var(--color-coral-deep)]">
          <span aria-hidden>🔥</span>
          <span className="tabular-nums">{progress.streakDays}d</span>
        </div>
      )}
    </div>
  );
}
