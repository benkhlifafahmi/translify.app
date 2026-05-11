"use client";

// Toast stack — slides in from bottom-right when XP/achievement/level-up fires.
// Reads events from the LumiProvider queue.

import { useLumi } from "./lumi-context";
import { Lumi } from "./lumi";

export function LumiToastStack() {
  const { toasts, dismissToast } = useLumi();

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[60] flex flex-col-reverse gap-2.5">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismissToast(t.id)}
          className="lumi-toast-in pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl border-[1.5px] border-[color:var(--color-border)] bg-gradient-to-br from-white to-[color:var(--color-paper-2)] px-4 py-3 text-left shadow-[var(--shadow-paper-lg)] transition-transform hover:-translate-y-0.5"
          style={
            t.kind === "level-up"
              ? {
                  borderColor: "var(--color-saffron)",
                  background:
                    "linear-gradient(135deg, #FFF3DC 0%, #FDEBC4 100%)",
                }
              : undefined
          }
        >
          {t.kind === "level-up" ? (
            <Lumi state="celebrating" size={56} level={(t.level as 1 | 2 | 3 | 4 | 5) ?? 1} animate />
          ) : t.kind === "achievement" ? (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[color:var(--color-saffron)]/15 text-xl">
              <span aria-hidden>{t.emoji ?? "✨"}</span>
            </div>
          ) : (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[color:var(--color-sage)]/15 text-base font-bold text-[color:var(--color-sage-deep)]">
              +{t.xp}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-[family-name:var(--font-display)] text-[15px] font-semibold leading-tight text-[color:var(--color-ink)]">
                {t.title}
              </span>
              {t.xp && t.kind === "achievement" && (
                <span className="rounded-full bg-[color:var(--color-saffron)]/20 px-1.5 py-0.5 text-[10px] font-bold text-[color:var(--color-saffron-deep)]">
                  +{t.xp} XP
                </span>
              )}
            </div>
            {t.description && (
              <p className="mt-0.5 text-[12px] leading-snug text-[color:var(--color-ink-soft)]">
                {t.description}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
