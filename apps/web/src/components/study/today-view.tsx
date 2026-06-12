"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  Coffee,
  Layers,
  Network,
  Pause,
  Play,
  Sparkles,
  Star,
  Timer,
} from "lucide-react";
import { listBookHighlights, type Highlight } from "@/lib/highlights";
import { countUncarded, type FlashcardDeck } from "@/lib/flashcards";
import {
  formatClock,
  FOCUS_MINUTES,
  type BookStudy,
  type FocusTimer,
} from "@/lib/focus";
import { useI18n } from "@/lib/i18n";

/** Tools the home can route to. Mirrors StudyPanel's rail (minus "today"). */
type Target = "focus" | "cards" | "quiz" | "map";

type Tone = "saffron" | "sage" | "coral" | "plum";

// Tailwind needs literal class names, so tones are spelled out rather than
// interpolated. Tiles sit at 12% and hovers at 5% — well within the restrained
// palette, and only ever on actionable rows.
const TONE: Record<Tone, { tile: string; text: string; hover: string }> = {
  saffron: {
    tile: "bg-[color:var(--color-saffron)]/12",
    text: "text-[color:var(--color-saffron-deep)]",
    hover: "hover:border-[color:var(--color-saffron)] hover:bg-[color:var(--color-saffron)]/5",
  },
  sage: {
    tile: "bg-[color:var(--color-sage)]/12",
    text: "text-[color:var(--color-sage-deep)]",
    hover: "hover:border-[color:var(--color-sage)] hover:bg-[color:var(--color-sage)]/5",
  },
  coral: {
    tile: "bg-[color:var(--color-coral)]/12",
    text: "text-[color:var(--color-coral-deep)]",
    hover: "hover:border-[color:var(--color-coral)] hover:bg-[color:var(--color-coral)]/5",
  },
  plum: {
    tile: "bg-[color:var(--color-plum)]/12",
    text: "text-[color:var(--color-plum)]",
    hover: "hover:border-[color:var(--color-plum)] hover:bg-[color:var(--color-plum)]/5",
  },
};

interface Props {
  study: BookStudy;
  timer: FocusTimer;
  deck: FlashcardDeck;
  bookId: string;
  /** Furthest page reached this book — drives the reading-progress meter. */
  currentPage: number;
  pageCount: number | null;
  onNavigate: (tool: Target) => void;
}

export function TodayView({
  study,
  timer,
  deck,
  bookId,
  currentPage,
  pageCount,
  onNavigate,
}: Props) {
  const { t, tn } = useI18n();
  // Shares the page's cache key, so this is a cache hit, not a second fetch.
  const { data: highlights = [] } = useQuery<Highlight[]>({
    queryKey: ["highlights", bookId],
    queryFn: () => listBookHighlights(bookId),
  });

  const [genBusy, setGenBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const due = deck.due.length;
  const uncarded = countUncarded(deck.cards, highlights);

  async function makeCards() {
    setGenBusy(true);
    setFlash(null);
    try {
      const n = await deck.generateFromHighlights(bookId);
      setFlash(n > 0 ? tn("study.today.added", n) : null);
    } catch {
      setFlash(t("study.today.addError"));
    } finally {
      setGenBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      <header>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-ink-soft)]">
          {t("study.today.eyebrow")}
        </p>
        <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold leading-tight tracking-tight">
          {t("study.today.title")}
        </h3>
      </header>

      <div className="flex flex-col gap-4">
        <ProgressMeter currentPage={currentPage} pageCount={pageCount} />
        <GoalMeter study={study} onEdit={() => onNavigate("focus")} />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-ink-soft)]">
          {t("study.today.nextUp")}
        </p>

        <FocusRow timer={timer} onOpen={() => onNavigate("focus")} />

        {due > 0 && (
          <ActionRow
            tone="sage"
            icon={<Layers size={18} />}
            title={tn("study.today.review", due)}
            sub={t("study.today.review.sub")}
            trailing={<CountChip n={due} />}
            onClick={() => onNavigate("cards")}
          />
        )}

        {uncarded > 0 && (
          <ActionRow
            tone="sage"
            icon={<Sparkles size={18} />}
            title={tn("study.today.make", uncarded)}
            sub={t("study.today.make.sub")}
            trailing={
              genBusy ? (
                <span className="shrink-0 text-[0.7rem] font-semibold text-[color:var(--color-sage-deep)]">
                  {t("study.today.adding")}
                </span>
              ) : (
                <Chevron />
              )
            }
            onClick={makeCards}
            disabled={genBusy}
          />
        )}

        {flash && (
          <p className="px-1 text-[0.72rem] font-medium text-[color:var(--color-sage-deep)]">{flash}</p>
        )}

        <ActionRow
          tone="coral"
          icon={<Star size={18} />}
          title={t("study.today.quiz.title")}
          sub={t("study.today.quiz.sub")}
          trailing={<Chevron />}
          onClick={() => onNavigate("quiz")}
        />

        <ActionRow
          tone="plum"
          icon={<Network size={18} />}
          title={t("study.today.map.title")}
          sub={t("study.today.map.sub")}
          trailing={<Chevron />}
          onClick={() => onNavigate("map")}
        />
      </div>

      <Momentum minutes={study.minutesToday} sessions={study.sessionsToday} />
    </div>
  );
}

// ───────────────────────── Reading progress ─────────────────────────

function ProgressMeter({ currentPage, pageCount }: { currentPage: number; pageCount: number | null }) {
  const { t } = useI18n();
  const hasPages = typeof pageCount === "number" && pageCount > 0;
  const shown = hasPages ? Math.min(currentPage, pageCount!) : currentPage;
  const pct = hasPages ? Math.min(100, Math.round((shown / pageCount!) * 100)) : null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-[color:var(--color-ink)]">{t("study.today.progress.label")}</p>
        {pct != null && (
          <p className="text-[0.78rem] font-semibold tabular-nums text-[color:var(--color-saffron-deep)]">
            {pct}%
          </p>
        )}
      </div>
      {pct != null ? (
        <>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--color-paper-3)]">
            <div
              className="h-full rounded-full bg-[color:var(--color-saffron)] transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[0.72rem] text-[color:var(--color-ink-soft)]">
            {t("study.today.progress.reached", { page: shown, total: pageCount! })}
          </p>
        </>
      ) : (
        <p className="text-[0.72rem] text-[color:var(--color-ink-soft)]">
          {t("study.today.progress.saved")}
        </p>
      )}
    </div>
  );
}

// ───────────────────────── Today's goal ─────────────────────────

const GOAL_PRESETS = [20, 30, 45];

function GoalMeter({ study, onEdit }: { study: BookStudy; onEdit: () => void }) {
  const { t } = useI18n();
  if (!study.goal) {
    return (
      <div className="flex flex-col gap-2">
        <div>
          <p className="text-sm font-semibold text-[color:var(--color-ink)]">{t("study.today.goal.setTitle")}</p>
          <p className="text-[0.72rem] text-[color:var(--color-ink-soft)]">
            {t("study.goal.body")}
          </p>
        </div>
        <div className="flex gap-1.5">
          {GOAL_PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => study.setGoal({ unit: "minutes", target: n })}
              className="rounded-full border-[1.5px] border-[color:var(--color-border)] bg-white/60 px-3 py-1 text-[0.78rem] font-semibold text-[color:var(--color-ink-soft)] transition-colors hover:border-[color:var(--color-saffron)] hover:text-[color:var(--color-saffron-deep)]"
            >
              {t("study.today.goal.preset", { n })}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const have = study.goal.unit === "minutes" ? study.minutesToday : study.sessionsToday;
  const pct = Math.round(study.goalProgress * 100);

  return (
    <button type="button" onClick={onEdit} className="group flex flex-col gap-1.5 text-left">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-[color:var(--color-ink)]">
          {t("study.goal.title")}
          <span className="ml-1.5 text-[0.68rem] font-medium text-[color:var(--color-ink-soft)] opacity-0 transition-opacity group-hover:opacity-100">
            {t("study.today.goal.edit")}
          </span>
        </p>
        <p className="text-[0.78rem] font-semibold tabular-nums text-[color:var(--color-ink-soft)]">
          {have} / {study.goal.target} {t(`study.unit.${study.goal.unit}`)}
        </p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--color-paper-3)]">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            study.goalMet ? "bg-[color:var(--color-sage)]" : "bg-[color:var(--color-saffron)]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {study.goalMet && (
        <p className="text-[0.72rem] font-semibold text-[color:var(--color-sage-deep)]">
          {t("study.today.goal.met")}
        </p>
      )}
    </button>
  );
}

// ───────────────────────── Focus sprint row ─────────────────────────

function FocusRow({ timer, onOpen }: { timer: FocusTimer; onOpen: () => void }) {
  const { t } = useI18n();
  const isFocus = timer.mode === "focus";
  const tone: Tone = isFocus ? "saffron" : "sage";
  const c = TONE[tone];
  const idle = !timer.running && timer.remaining >= timer.total;

  const title = timer.running
    ? `${t(`study.focus.mode.${timer.mode}`)} · ${formatClock(timer.remaining)}`
    : idle
      ? t("study.today.focus.start")
      : `${t("study.today.focus.resume")} · ${formatClock(timer.remaining)}`;

  const sub = timer.running
    ? isFocus
      ? t("study.today.focus.deep")
      : t("study.today.focus.break")
    : idle
      ? t("study.today.focus.idleSub", { n: FOCUS_MINUTES.focus })
      : t("study.today.focus.pausedSub");

  return (
    <div
      className={`group flex items-center gap-3 rounded-2xl border-[1.5px] border-[color:var(--color-border)] bg-white/55 p-3 transition-colors ${c.hover}`}
    >
      <button onClick={onOpen} type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${c.tile} ${c.text}`}>
          {isFocus ? <Timer size={18} /> : <Coffee size={18} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold tabular-nums text-[color:var(--color-ink)]">
            {title}
          </span>
          <span className="mt-0.5 block text-[0.72rem] leading-snug text-[color:var(--color-ink-soft)]">
            {sub}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => (timer.running ? timer.pause() : timer.start())}
        aria-label={timer.running ? t("study.today.focus.pauseAria") : t("study.today.focus.startAria")}
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-transform active:scale-95 ${
          isFocus
            ? "bg-[color:var(--color-saffron)] text-[color:var(--color-accent-foreground)]"
            : "bg-[color:var(--color-sage)] text-white"
        }`}
      >
        {timer.running ? <Pause size={16} /> : <Play size={16} className="translate-x-[1px]" />}
      </button>
    </div>
  );
}

// ───────────────────────── Generic action row ─────────────────────────

function ActionRow({
  tone,
  icon,
  title,
  sub,
  trailing,
  onClick,
  disabled,
}: {
  tone: Tone;
  icon: React.ReactNode;
  title: string;
  sub: string;
  trailing: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  const c = TONE[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group flex w-full items-center gap-3 rounded-2xl border-[1.5px] border-[color:var(--color-border)] bg-white/55 p-3 text-left transition-all hover:-translate-y-[1px] disabled:pointer-events-none disabled:opacity-60 ${c.hover}`}
    >
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${c.tile} ${c.text}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[color:var(--color-ink)]">{title}</span>
        <span className="mt-0.5 block text-[0.72rem] leading-snug text-[color:var(--color-ink-soft)]">
          {sub}
        </span>
      </span>
      {trailing}
    </button>
  );
}

function Chevron() {
  return (
    <ChevronRight
      size={16}
      className="shrink-0 text-[color:var(--color-ink-soft)] transition-colors group-hover:text-[color:var(--color-ink)]"
    />
  );
}

function CountChip({ n }: { n: number }) {
  return (
    <span className="shrink-0 rounded-full bg-[color:var(--color-sage)]/15 px-2 py-0.5 text-[0.72rem] font-bold tabular-nums text-[color:var(--color-sage-deep)]">
      {n}
    </span>
  );
}

// ───────────────────────── Momentum footer ─────────────────────────

function Momentum({ minutes, sessions }: { minutes: number; sessions: number }) {
  const { t, tn } = useI18n();
  if (minutes <= 0 && sessions <= 0) {
    return (
      <p className="text-center text-[0.72rem] text-[color:var(--color-ink-soft)]">
        {t("study.today.momentum.empty")}
      </p>
    );
  }
  return (
    <p className="text-center text-[0.72rem] text-[color:var(--color-ink-soft)]">
      {t("study.today.momentum.today")}{" "}
      <b className="font-semibold text-[color:var(--color-ink)]">
        {minutes} {t("study.unit.min")}
      </b>{" "}
      {t("study.today.momentum.focused")}
      {sessions > 0 && <> · {tn("study.today.momentum.sessions", sessions)}</>}
    </p>
  );
}
