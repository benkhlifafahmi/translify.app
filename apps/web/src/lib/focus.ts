// Focus / study-session engine — client-side, localStorage-backed.
//
// Encodes a few evidence-based study mechanics so the reading space actively
// helps students rather than just translating:
//   • Distributed practice + managed attention — Pomodoro-style focus/break
//     cycles keep attention fresh and schedule recovery before fatigue sets in.
//   • Specific goal-setting (Locke & Latham, 1990) — a concrete per-book session
//     goal ("study 50 minutes today") measurably lifts effort and follow-through.
//   • Externalising intentions — a tiny task list offloads working memory so
//     attention stays on the text.
//
// The timer is global (one running session at a time; survives navigation and
// reload). Goals + tasks + daily progress are per-book.

import { useCallback, useEffect, useRef, useState } from "react";

export type FocusMode = "focus" | "short-break" | "long-break";

/** Science-backed defaults. Classic Pomodoro: 25 / 5, long break every 4th. */
export const FOCUS_MINUTES: Record<FocusMode, number> = {
  "focus": 25,
  "short-break": 5,
  "long-break": 15,
};
export const LONG_BREAK_EVERY = 4;

export const MODE_LABEL: Record<FocusMode, string> = {
  "focus": "Focus",
  "short-break": "Short break",
  "long-break": "Long break",
};

const TIMER_KEY = "translify_focus_timer";
const bookKey = (bookId: string) => `translify_focus_book_${bookId}`;

function durationSec(mode: FocusMode): number {
  return FOCUS_MINUTES[mode] * 60;
}

// ---------------------------------------------------------------------------
// Global timer
// ---------------------------------------------------------------------------

interface TimerSnapshot {
  mode: FocusMode;
  running: boolean;
  /** Epoch ms when the current run ends — authoritative while running. */
  endsAt: number | null;
  /** Seconds left — authoritative while paused / idle. */
  remaining: number;
  /** Completed focus blocks in the current 4-cycle (resets after a long break). */
  cycleFocus: number;
}

function freshTimer(): TimerSnapshot {
  return {
    mode: "focus",
    running: false,
    endsAt: null,
    remaining: durationSec("focus"),
    cycleFocus: 0,
  };
}

function loadTimer(): TimerSnapshot {
  if (typeof window === "undefined") return freshTimer();
  try {
    const raw = window.localStorage.getItem(TIMER_KEY);
    if (!raw) return freshTimer();
    const t = { ...freshTimer(), ...(JSON.parse(raw) as Partial<TimerSnapshot>) };
    if (!(t.mode in FOCUS_MINUTES)) t.mode = "focus";
    return t;
  } catch {
    return freshTimer();
  }
}

function saveTimer(t: TimerSnapshot) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TIMER_KEY, JSON.stringify(t));
  } catch {
    /* quota / private mode — non-fatal */
  }
}

function remainingOf(t: TimerSnapshot): number {
  if (t.running && t.endsAt != null) {
    return Math.max(0, Math.round((t.endsAt - Date.now()) / 1000));
  }
  return Math.max(0, t.remaining);
}

export interface FocusTimer {
  mode: FocusMode;
  running: boolean;
  /** Seconds remaining in the current block. */
  remaining: number;
  /** Whole duration of the current block, in seconds. */
  total: number;
  /** Completed focus blocks in the current 4-cycle (0–LONG_BREAK_EVERY). */
  cycleFocus: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  /** Skip to the next block without crediting the current one. */
  skip: () => void;
}

/**
 * Drives the global focus timer.
 *
 * @param onFocusDone Called once each time a *focus* block reaches zero, with
 *   the block length in minutes — use it to credit goal progress, water the
 *   Garden, etc.
 */
export function useFocusTimer(onFocusDone?: (minutes: number) => void): FocusTimer {
  const [snap, setSnap] = useState<TimerSnapshot>(loadTimer);
  const [now, setNow] = useState<number>(() => Date.now());
  const doneRef = useRef(onFocusDone);
  doneRef.current = onFocusDone;

  const update = useCallback((next: TimerSnapshot) => {
    saveTimer(next);
    setSnap(next);
  }, []);

  // Advance to the next block. `credited` = the focus block finished naturally.
  const advance = useCallback(
    (cur: TimerSnapshot, credited: boolean): TimerSnapshot => {
      if (cur.mode === "focus") {
        const cycleFocus = credited ? cur.cycleFocus + 1 : cur.cycleFocus;
        const longBreak = credited && cycleFocus % LONG_BREAK_EVERY === 0;
        const mode: FocusMode = longBreak ? "long-break" : "short-break";
        if (credited) doneRef.current?.(FOCUS_MINUTES.focus);
        return {
          mode,
          running: false,
          endsAt: null,
          remaining: durationSec(mode),
          cycleFocus: longBreak ? 0 : cycleFocus,
        };
      }
      // a break ended → back to focus
      return {
        mode: "focus",
        running: false,
        endsAt: null,
        remaining: durationSec("focus"),
        cycleFocus: cur.cycleFocus,
      };
    },
    [],
  );

  // Tick — only while running. A single interval recomputes from `endsAt`, so
  // the countdown stays correct across reload, tab-switch and sleep.
  useEffect(() => {
    if (!snap.running) return;
    const id = setInterval(() => {
      const left = remainingOf(snap);
      if (left <= 0) {
        update(advance(snap, true));
      } else {
        setNow(Date.now());
      }
    }, 500);
    return () => clearInterval(id);
  }, [snap, update, advance]);

  // Pick up changes made in other tabs.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === TIMER_KEY) setSnap(loadTimer());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const start = useCallback(() => {
    setSnap((cur) => {
      if (cur.running) return cur;
      const remaining = Math.max(1, cur.remaining || durationSec(cur.mode));
      const next: TimerSnapshot = {
        ...cur,
        running: true,
        remaining,
        endsAt: Date.now() + remaining * 1000,
      };
      saveTimer(next);
      return next;
    });
  }, []);

  const pause = useCallback(() => {
    setSnap((cur) => {
      if (!cur.running) return cur;
      const next: TimerSnapshot = {
        ...cur,
        running: false,
        remaining: remainingOf(cur),
        endsAt: null,
      };
      saveTimer(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setSnap((cur) => {
      const next: TimerSnapshot = {
        ...cur,
        running: false,
        endsAt: null,
        remaining: durationSec(cur.mode),
      };
      saveTimer(next);
      return next;
    });
  }, []);

  const skip = useCallback(() => {
    setSnap((cur) => {
      const next = advance(cur, false);
      saveTimer(next);
      return next;
    });
  }, [advance]);

  // `now` is referenced so the component re-renders each tick.
  void now;
  return {
    mode: snap.mode,
    running: snap.running,
    remaining: remainingOf(snap),
    total: durationSec(snap.mode),
    cycleFocus: snap.cycleFocus,
    start,
    pause,
    reset,
    skip,
  };
}

// ---------------------------------------------------------------------------
// Per-book goal + tasks + daily progress
// ---------------------------------------------------------------------------

export type GoalUnit = "minutes" | "sessions";

export interface StudyGoal {
  unit: GoalUnit;
  target: number;
}

export interface StudyTask {
  id: string;
  text: string;
  done: boolean;
}

interface BookStudyState {
  goal: StudyGoal | null;
  tasks: StudyTask[];
  /** YYYY-MM-DD the daily counters below belong to. */
  day: string;
  minutesToday: number;
  sessionsToday: number;
}

function today(): string {
  // Local date — a "study day" follows the reader's clock.
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function freshBook(): BookStudyState {
  return { goal: null, tasks: [], day: today(), minutesToday: 0, sessionsToday: 0 };
}

function loadBook(bookId: string): BookStudyState {
  if (typeof window === "undefined") return freshBook();
  try {
    const raw = window.localStorage.getItem(bookKey(bookId));
    const s = raw
      ? { ...freshBook(), ...(JSON.parse(raw) as Partial<BookStudyState>) }
      : freshBook();
    // Roll over the daily counters when the date changes.
    if (s.day !== today()) {
      s.day = today();
      s.minutesToday = 0;
      s.sessionsToday = 0;
    }
    return s;
  } catch {
    return freshBook();
  }
}

function saveBook(bookId: string, s: BookStudyState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(bookKey(bookId), JSON.stringify(s));
  } catch {
    /* non-fatal */
  }
}

function uid(): string {
  return `t_${Math.floor(performance.now() * 1000).toString(36)}_${(
    globalThis.crypto?.getRandomValues(new Uint32Array(1))[0] ?? 0
  ).toString(36)}`;
}

export interface BookStudy {
  goal: StudyGoal | null;
  tasks: StudyTask[];
  minutesToday: number;
  sessionsToday: number;
  /** 0–1 progress toward the goal (0 when no goal set). */
  goalProgress: number;
  goalMet: boolean;
  setGoal: (goal: StudyGoal | null) => void;
  addTask: (text: string) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  /** Credit a completed focus block (call from useFocusTimer's onFocusDone). */
  creditFocus: (minutes: number) => void;
}

export function useBookStudy(bookId: string): BookStudy {
  const [state, setState] = useState<BookStudyState>(() => loadBook(bookId));

  // Reload when the book changes.
  useEffect(() => {
    setState(loadBook(bookId));
  }, [bookId]);

  const mutate = useCallback(
    (fn: (s: BookStudyState) => BookStudyState) => {
      setState((cur) => {
        const next = fn(cur);
        saveBook(bookId, next);
        return next;
      });
    },
    [bookId],
  );

  const setGoal = useCallback(
    (goal: StudyGoal | null) => mutate((s) => ({ ...s, goal })),
    [mutate],
  );

  const addTask = useCallback(
    (text: string) =>
      mutate((s) => {
        const t = text.trim();
        if (!t) return s;
        return { ...s, tasks: [...s.tasks, { id: uid(), text: t, done: false }] };
      }),
    [mutate],
  );

  const toggleTask = useCallback(
    (id: string) =>
      mutate((s) => ({
        ...s,
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
      })),
    [mutate],
  );

  const removeTask = useCallback(
    (id: string) => mutate((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) })),
    [mutate],
  );

  const creditFocus = useCallback(
    (minutes: number) =>
      mutate((s) => ({
        ...s,
        minutesToday: s.minutesToday + minutes,
        sessionsToday: s.sessionsToday + 1,
      })),
    [mutate],
  );

  const goalProgress = (() => {
    if (!state.goal) return 0;
    const have = state.goal.unit === "minutes" ? state.minutesToday : state.sessionsToday;
    return Math.min(1, state.goal.target > 0 ? have / state.goal.target : 0);
  })();

  return {
    goal: state.goal,
    tasks: state.tasks,
    minutesToday: state.minutesToday,
    sessionsToday: state.sessionsToday,
    goalProgress,
    goalMet: !!state.goal && goalProgress >= 1,
    setGoal,
    addTask,
    toggleTask,
    removeTask,
    creditFocus,
  };
}

/** "25:00" */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const mm = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}
