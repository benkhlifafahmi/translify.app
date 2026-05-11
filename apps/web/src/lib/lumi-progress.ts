// Lumi gamification state — XP, levels, streaks, achievements.
//
// Persisted in localStorage so it survives reloads without needing a backend.
// All client-side; safe to extend with server-side sync later.

export interface LumiProgress {
  xp: number;
  level: 1 | 2 | 3 | 4 | 5;
  streakDays: number;
  lastVisitISO: string | null;
  achievements: string[];
  /** One-shot XP awards we've already given (e.g. "welcome", "first-upload"). */
  awarded: string[];
}

const STORAGE_KEY = "translify:lumi-progress:v1";

// XP thresholds for each level. Level N requires LEVELS[N-1] total XP.
export const LEVELS: readonly number[] = [0, 100, 300, 700, 1500];

export const LEVEL_TITLES: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "Apprentice",
  2: "Reader",
  3: "Scholar",
  4: "Translator",
  5: "Master Librarian",
};

export const ACHIEVEMENTS: Record<
  string,
  { title: string; description: string; xp: number; emoji: string }
> = {
  welcome: {
    title: "Welcome to the library",
    description: "Lumi is so glad you're here",
    xp: 25,
    emoji: "🦉",
  },
  "first-upload": {
    title: "First book uploaded",
    description: "The shelf is no longer empty",
    xp: 50,
    emoji: "📚",
  },
  "first-translation": {
    title: "First translation complete",
    description: "One language down — many to go",
    xp: 100,
    emoji: "✨",
  },
  "five-books": {
    title: "Bookworm",
    description: "Five books in your library",
    xp: 150,
    emoji: "🐛",
  },
  "first-quiz": {
    title: "Quizzed",
    description: "You completed your first quiz",
    xp: 50,
    emoji: "🎓",
  },
  "perfect-quiz": {
    title: "Quiz Master",
    description: "Aced a quiz with a perfect score",
    xp: 200,
    emoji: "🏆",
  },
  "week-streak": {
    title: "Seven-day streak",
    description: "A whole week of reading",
    xp: 100,
    emoji: "🔥",
  },
};

const INITIAL: LumiProgress = {
  xp: 0,
  level: 1,
  streakDays: 0,
  lastVisitISO: null,
  achievements: [],
  awarded: [],
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadProgress(): LumiProgress {
  if (!isBrowser()) return INITIAL;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL;
    const parsed = JSON.parse(raw) as LumiProgress;
    return { ...INITIAL, ...parsed };
  } catch {
    return INITIAL;
  }
}

export function saveProgress(p: LumiProgress) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

function computeLevel(xp: number): 1 | 2 | 3 | 4 | 5 {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i]) return (i + 1) as 1 | 2 | 3 | 4 | 5;
  }
  return 1;
}

/** XP needed to reach the next level (or null if already at max). */
export function xpToNextLevel(p: LumiProgress): { next: number; needed: number; pct: number } | null {
  if (p.level >= 5) return null;
  // p.level is 1-4 here, so LEVELS[p.level] and LEVELS[p.level - 1] are defined.
  const nextThreshold = LEVELS[p.level]!;
  const currentThreshold = LEVELS[p.level - 1]!;
  const needed = nextThreshold - p.xp;
  const progressInLevel = p.xp - currentThreshold;
  const levelSpan = nextThreshold - currentThreshold;
  const pct = Math.max(0, Math.min(100, (progressInLevel / levelSpan) * 100));
  return { next: nextThreshold, needed, pct };
}

interface AwardResult {
  progress: LumiProgress;
  xpGained: number;
  leveledUp: boolean;
  unlocked: string[];
}

/** Award an XP grant by achievement id. Idempotent — re-awarding the same id is a no-op. */
export function awardAchievement(id: string): AwardResult {
  const p = loadProgress();
  const ach = ACHIEVEMENTS[id];
  if (!ach) return { progress: p, xpGained: 0, leveledUp: false, unlocked: [] };
  if (p.awarded.includes(id)) {
    return { progress: p, xpGained: 0, leveledUp: false, unlocked: [] };
  }
  const prevLevel = p.level;
  const nextXp = p.xp + ach.xp;
  const nextLevel = computeLevel(nextXp);
  const next: LumiProgress = {
    ...p,
    xp: nextXp,
    level: nextLevel,
    awarded: [...p.awarded, id],
    achievements: p.achievements.includes(id) ? p.achievements : [...p.achievements, id],
  };
  saveProgress(next);
  return {
    progress: next,
    xpGained: ach.xp,
    leveledUp: nextLevel > prevLevel,
    unlocked: [id],
  };
}

/** Award raw XP (no achievement card). Useful for activity like reading time. */
export function awardXP(amount: number): AwardResult {
  const p = loadProgress();
  const prevLevel = p.level;
  const nextXp = p.xp + amount;
  const nextLevel = computeLevel(nextXp);
  const next = { ...p, xp: nextXp, level: nextLevel };
  saveProgress(next);
  return { progress: next, xpGained: amount, leveledUp: nextLevel > prevLevel, unlocked: [] };
}

/** Update the streak counter based on last-visit date. Run once per session. */
export function pingStreak(): LumiProgress {
  const p = loadProgress();
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const last = p.lastVisitISO?.slice(0, 10);

  if (last === todayKey) return p; // already counted today

  let streakDays = p.streakDays;
  if (last) {
    const lastDate = new Date(last + "T00:00:00");
    const diffDays = Math.round((today.getTime() - lastDate.getTime()) / 86400000);
    streakDays = diffDays === 1 ? streakDays + 1 : 1;
  } else {
    streakDays = 1;
  }
  const next = { ...p, streakDays, lastVisitISO: today.toISOString() };
  saveProgress(next);
  return next;
}

export function resetProgress() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}
