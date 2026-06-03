"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  formatClock,
  FOCUS_MINUTES,
  LONG_BREAK_EVERY,
  MODE_LABEL,
  type BookStudy,
  type FocusTimer,
  type GoalUnit,
} from "@/lib/focus";

const RING = 54; // radius
const CIRC = 2 * Math.PI * RING;

interface Props {
  /** Shared session state, lifted to StudyPanel so the Today desk and this
   *  tab drive one and the same timer / goal within the tab. */
  study: BookStudy;
  timer: FocusTimer;
}

export function FocusTool({ study, timer }: Props) {
  const isFocus = timer.mode === "focus";
  const tone = isFocus ? "saffron" : "sage";
  const fraction = timer.total > 0 ? timer.remaining / timer.total : 0;

  return (
    <div className="flex flex-col gap-5 p-5">
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-ink-soft)]">
          Study mode
        </p>
        <h3 className="mt-1.5 font-[family-name:var(--font-display)] text-xl font-semibold leading-tight tracking-tight">
          Focus session
        </h3>
        <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
          Short, timed sprints with built-in breaks — proven to keep attention
          fresh and beat procrastination.
        </p>
      </div>

      {/* Timer */}
      <div className="card-paper flex flex-col items-center gap-4 p-5">
        <div className="relative grid place-items-center">
          <svg width="156" height="156" viewBox="0 0 132 132" className="-rotate-90">
            <circle
              cx="66"
              cy="66"
              r={RING}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="8"
            />
            <circle
              cx="66"
              cy="66"
              r={RING}
              fill="none"
              stroke={`var(--color-${tone})`}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - fraction)}
              className="transition-[stroke-dashoffset] duration-500 ease-linear"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="font-[family-name:var(--font-display)] text-4xl font-semibold tabular-nums tracking-tight">
              {formatClock(timer.remaining)}
            </span>
            <span
              className={`mt-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-${tone}-deep)]`}
            >
              {MODE_LABEL[timer.mode]}
            </span>
          </div>
        </div>

        {/* Cycle dots — progress toward the long break */}
        <div className="flex items-center gap-1.5" aria-hidden>
          {Array.from({ length: LONG_BREAK_EVERY }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i < timer.cycleFocus
                  ? "bg-[color:var(--color-saffron)]"
                  : "bg-[color:var(--color-border-strong)]"
              }`}
            />
          ))}
        </div>

        <div className="flex w-full items-center gap-2">
          <Button
            variant={isFocus ? "accent" : "sage"}
            className="flex-1"
            onClick={() => (timer.running ? timer.pause() : timer.start())}
          >
            {timer.running ? "Pause" : timer.remaining < timer.total ? "Resume" : "Start"}
          </Button>
          <button
            type="button"
            onClick={timer.reset}
            title="Reset this block"
            className="grid h-10 w-10 place-items-center rounded-xl border-[1.5px] border-[color:var(--color-border)] text-[color:var(--color-ink-soft)] transition-colors hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-ink)]"
          >
            ↺
          </button>
          <button
            type="button"
            onClick={timer.skip}
            title="Skip to the next block"
            className="grid h-10 w-10 place-items-center rounded-xl border-[1.5px] border-[color:var(--color-border)] text-[color:var(--color-ink-soft)] transition-colors hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-ink)]"
          >
            ⇥
          </button>
        </div>
        <p className="text-center text-[0.7rem] text-[color:var(--color-ink-soft)]">
          {FOCUS_MINUTES.focus}-min focus · {FOCUS_MINUTES["short-break"]}-min break ·
          long break every {LONG_BREAK_EVERY}
        </p>
      </div>

      <GoalCard study={study} />
      <TaskList study={study} />
      <ScienceNote />
    </div>
  );
}

// ---------------------------------------------------------------------------

function GoalCard({ study }: { study: BookStudy }) {
  const [editing, setEditing] = useState(false);
  const [unit, setUnit] = useState<GoalUnit>(study.goal?.unit ?? "minutes");
  const [target, setTarget] = useState<string>(String(study.goal?.target ?? 50));

  const have = study.goal
    ? study.goal.unit === "minutes"
      ? study.minutesToday
      : study.sessionsToday
    : 0;

  function save() {
    const n = Math.max(1, Math.round(Number(target) || 0));
    study.setGoal({ unit, target: n });
    setEditing(false);
  }

  if (!study.goal && !editing) {
    return (
      <div className="card-paper flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm font-semibold">Today&apos;s goal</p>
          <p className="text-[0.75rem] text-[color:var(--color-ink-soft)]">
            A specific target makes you far more likely to follow through.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          Set goal
        </Button>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="card-paper flex flex-col gap-3 p-4">
        <p className="text-sm font-semibold">Today&apos;s goal</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-20 rounded-xl border-[1.5px] border-[color:var(--color-border)] bg-white/70 px-3 py-2 text-sm font-medium focus:border-[color:var(--color-saffron)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-saffron)]/30"
          />
          <div className="flex overflow-hidden rounded-xl border-[1.5px] border-[color:var(--color-border)]">
            {(["minutes", "sessions"] as GoalUnit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={`px-3 py-2 text-sm transition-colors ${
                  unit === u
                    ? "bg-[color:var(--color-ink)] text-[color:var(--color-paper)]"
                    : "text-[color:var(--color-ink-soft)] hover:bg-[color:var(--color-paper-3)]/60"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="accent" size="sm" onClick={save}>
            Save goal
          </Button>
          {study.goal && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                study.setGoal(null);
                setEditing(false);
              }}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Goal set — show progress
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="card-paper flex flex-col gap-2 p-4 text-left transition-transform hover:-translate-y-[1px]"
    >
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold">Today&apos;s goal</p>
        <p className="text-[0.78rem] font-semibold tabular-nums text-[color:var(--color-ink-soft)]">
          {have} / {study.goal!.target} {study.goal!.unit}
        </p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--color-paper-3)]">
        <div
          className="h-full rounded-full bg-[color:var(--color-saffron)] transition-[width] duration-500"
          style={{ width: `${Math.round(study.goalProgress * 100)}%` }}
        />
      </div>
      {study.goalMet && (
        <p className="text-[0.75rem] font-semibold text-[color:var(--color-sage-deep)]">
          🎉 Goal reached — nice work today.
        </p>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------

function TaskList({ study }: { study: BookStudy }) {
  const [draft, setDraft] = useState("");

  function add() {
    study.addTask(draft);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-ink-soft)]">
        Session checklist
      </p>
      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
          placeholder="e.g. Re-read §2 and summarise it"
          className="flex-1 rounded-xl border-[1.5px] border-[color:var(--color-border)] bg-white/70 px-3 py-2 text-sm focus:border-[color:var(--color-saffron)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-saffron)]/30"
        />
        <button
          type="button"
          onClick={add}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[color:var(--color-ink)] text-lg text-[color:var(--color-paper)] transition-transform hover:-translate-y-[1px]"
          title="Add task"
        >
          +
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        {study.tasks.map((task) => (
          <div
            key={task.id}
            className="group flex items-center gap-2.5 rounded-xl border-[1.5px] border-[color:var(--color-border)] bg-white/40 px-3 py-2"
          >
            <button
              type="button"
              onClick={() => study.toggleTask(task.id)}
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border-[1.5px] text-xs transition-colors ${
                task.done
                  ? "border-[color:var(--color-sage)] bg-[color:var(--color-sage)] text-white"
                  : "border-[color:var(--color-border-strong)] text-transparent"
              }`}
            >
              ✓
            </button>
            <span
              className={`flex-1 text-sm ${
                task.done
                  ? "text-[color:var(--color-ink-soft)] line-through"
                  : "text-[color:var(--color-ink)]"
              }`}
            >
              {task.text}
            </span>
            <button
              type="button"
              onClick={() => study.removeTask(task.id)}
              className="text-[color:var(--color-ink-soft)] opacity-0 transition-opacity hover:text-[color:var(--color-destructive)] group-hover:opacity-100"
              title="Remove"
            >
              ✕
            </button>
          </div>
        ))}
        {study.tasks.length === 0 && (
          <p className="rounded-xl border-[1.5px] border-dashed border-[color:var(--color-border)] px-3 py-2.5 text-xs text-[color:var(--color-ink-soft)]">
            Jot down what you want to get done this session.
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function ScienceNote() {
  const [open, setOpen] = useState(false);
  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
      className="rounded-xl bg-[color:var(--color-paper-3)]/50 px-3.5 py-2.5"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-ink-soft)]">
        Why this works
        <span className="transition-transform" style={{ transform: open ? "rotate(90deg)" : "" }}>
          ›
        </span>
      </summary>
      <p className="mt-2 text-[0.78rem] leading-relaxed text-[color:var(--color-ink-soft)]">
        Attention naturally fades after a stretch of work. Short, timed focus
        blocks with deliberate breaks (distributed practice) keep you fresher and
        retain more than one long cram. Setting a specific, measurable goal
        reliably lifts effort and follow-through.
      </p>
    </details>
  );
}
