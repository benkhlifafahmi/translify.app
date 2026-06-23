"use client";

// Lumi gamification context — exposes reactive progress state + actions
// to any component in the tree. Surfaces achievement toasts via a queue.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ACHIEVEMENTS,
  awardAchievement as awardAchievementRaw,
  awardXP as awardXPRaw,
  pingStreak,
  type LumiProgress,
} from "@/lib/lumi-progress";
import { useI18n } from "@/lib/i18n";

// Server-safe initial state — mirrors lumi-progress.ts INITIAL.
// Hydration uses this on both server and client, then the real value
// is loaded in useEffect to avoid hydration mismatch warnings.
const SAFE_INITIAL: LumiProgress = {
  xp: 0,
  level: 1,
  streakDays: 0,
  lastVisitISO: null,
  achievements: [],
  awarded: [],
};

export interface ToastEvent {
  id: string;
  kind: "xp" | "achievement" | "level-up";
  title: string;
  description?: string;
  emoji?: string;
  xp?: number;
  level?: number;
}

interface LumiContextValue {
  progress: LumiProgress;
  toasts: ToastEvent[];
  award: (achievementId: string) => void;
  bumpXP: (amount: number, label?: string) => void;
  dismissToast: (id: string) => void;
}

const Ctx = createContext<LumiContextValue | null>(null);

export function LumiProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  // Always start from SAFE_INITIAL so SSR markup matches first client render.
  // Real progress is loaded in the effect below to avoid hydration mismatches.
  const [progress, setProgress] = useState<LumiProgress>(SAFE_INITIAL);
  const [toasts, setToasts] = useState<ToastEvent[]>([]);

  // Hydrate from storage + ping streak on first mount.
  useEffect(() => {
    const next = pingStreak();
    setProgress(next);
  }, []);

  const enqueueToast = useCallback((event: ToastEvent) => {
    setToasts((prev) => [...prev, event]);
    // auto-dismiss after 4.5s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== event.id));
    }, 4500);
  }, []);

  const award = useCallback(
    (id: string) => {
      const ach = ACHIEVEMENTS[id];
      if (!ach) return;
      const result = awardAchievementRaw(id);
      if (result.xpGained === 0) return; // already awarded
      setProgress(result.progress);
      enqueueToast({
        id: `${id}-${Date.now()}`,
        kind: "achievement",
        title: ach.title,
        description: ach.description,
        emoji: ach.emoji,
        xp: result.xpGained,
      });
      if (result.leveledUp) {
        setTimeout(() => {
          enqueueToast({
            id: `level-${result.progress.level}-${Date.now()}`,
            kind: "level-up",
            title: t("lumi.levelReached", { level: result.progress.level }),
            description: t("lumi.newLook"),
            level: result.progress.level,
          });
        }, 900);
      }
    },
    [enqueueToast, t],
  );

  const bumpXP = useCallback(
    (amount: number, label?: string) => {
      const result = awardXPRaw(amount);
      setProgress(result.progress);
      enqueueToast({
        id: `xp-${Date.now()}`,
        kind: "xp",
        title: label ?? t("lumi.xpGain", { amount }),
        xp: amount,
      });
      if (result.leveledUp) {
        setTimeout(() => {
          enqueueToast({
            id: `level-${result.progress.level}-${Date.now()}`,
            kind: "level-up",
            title: t("lumi.levelReached", { level: result.progress.level }),
            description: t("lumi.newLook"),
            level: result.progress.level,
          });
        }, 900);
      }
    },
    [enqueueToast, t],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(
    () => ({ progress, toasts, award, bumpXP, dismissToast }),
    [progress, toasts, award, bumpXP, dismissToast],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLumi() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLumi must be used inside <LumiProvider>");
  return v;
}
