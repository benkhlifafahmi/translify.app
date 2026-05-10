"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  createQuiz,
  getQuiz,
  listQuizzes,
  submitAttempt,
  type Quiz,
  type QuizAttempt,
  type QuizSummary,
} from "@/lib/quizzes";
import { ApiError } from "@/lib/api";
import { getSubscription, isUnlimited, type Subscription } from "@/lib/billing";
import { parseQuotaError } from "@/lib/quota";
import { UpgradeNudge } from "@/components/upgrade-nudge";

interface Props {
  bookId: string;
  selectedTranslationId: string | null;
}

export function QuizPanel({ bookId, selectedTranslationId }: Props) {
  const qc = useQueryClient();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [count, setCount] = useState<number>(8);

  // All hooks must run on every render, regardless of which view we render.
  // questionRefs used to live further down (after early returns) which
  // violated the rules of hooks → React #310.
  const questionRefs = useRef<Record<string, HTMLLIElement | null>>({});

  const { data: existing = [] } = useQuery<QuizSummary[]>({
    queryKey: ["quizzes", bookId],
    queryFn: () => listQuizzes(bookId),
  });
  const { data: sub } = useQuery<Subscription>({
    queryKey: ["subscription"],
    queryFn: getSubscription,
    staleTime: 60_000,
  });

  const limit = sub?.quota.quizzes_per_book ?? 0;
  const used = existing.length;
  const unlimited = isUnlimited(limit);
  const atLimit = !unlimited && used >= limit;

  const generate = useMutation<Quiz, Error, number>({
    mutationFn: (n) => createQuiz(bookId, n, selectedTranslationId),
    onSuccess: (q) => {
      setQuiz(q);
      setAnswers({});
      setAttempt(null);
      qc.invalidateQueries({ queryKey: ["quizzes", bookId] });
    },
  });

  // Load an existing quiz and start it fresh — no Anthropic call, no quota
  // hit, no rate-limit risk. Used by the "Retake" button on saved quizzes.
  const loadExisting = useMutation<Quiz, Error, string>({
    mutationFn: (quizId) => getQuiz(quizId),
    onSuccess: (q) => {
      setQuiz(q);
      setAnswers({});
      setAttempt(null);
    },
  });

  const submit = useMutation<QuizAttempt, Error, void>({
    mutationFn: async () => {
      if (!quiz) throw new Error("No quiz");
      return submitAttempt(
        quiz.id,
        Object.entries(answers).map(([qid, idx]) => ({
          question_id: qid,
          answer_index: idx,
        })),
      );
    },
    onSuccess: setAttempt,
  });

  if (attempt && quiz) {
    return (
      <ResultsView
        quiz={quiz}
        attempt={attempt}
        onRetake={() => {
          setAnswers({});
          setAttempt(null);
        }}
        onNew={() => {
          setQuiz(null);
          setAnswers({});
          setAttempt(null);
        }}
      />
    );
  }

  if (!quiz) {
    const generateError = generate.isError ? parseQuotaError(generate.error) : null;
    // Friendlier message when Anthropic itself rate-limits us, vs. when our
    // own per-book quota is hit (the existing UpgradeNudge handles that).
    const rateLimited =
      generate.error instanceof ApiError &&
      (generate.error.status === 429 ||
        /rate_limit|429/i.test(generate.error.message ?? ""));
    const hasSaved = existing.length > 0;

    return (
      <div className="flex h-full flex-col">
        {/* Saved quizzes — surfaced as primary content when they exist, so
            users don't burn AI tokens regenerating something they already
            have. */}
        {hasSaved && (
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
                Your quizzes
              </h3>
              {sub && (
                <span className="rounded-full bg-[color:var(--color-paper-3)] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-ink-soft)]">
                  <span className="tabular-nums">
                    {used}
                    <span className="opacity-50"> / </span>
                    {unlimited ? "∞" : limit}
                  </span>
                </span>
              )}
            </div>

            <ul className="flex flex-col gap-2">
              {existing.map((q) => (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => loadExisting.mutate(q.id)}
                    disabled={loadExisting.isPending}
                    className="group flex w-full items-center gap-3 rounded-2xl border-[1.5px] border-[color:var(--color-border)] bg-white/60 p-3 text-left transition-all hover:-translate-y-[1px] hover:border-[color:var(--color-coral)] hover:bg-[color:var(--color-coral)]/5 disabled:pointer-events-none disabled:opacity-50"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color:var(--color-coral)]/12 text-[color:var(--color-coral-deep)]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {q.title}
                      </span>
                      <span className="mt-0.5 block text-[0.7rem] text-[color:var(--color-ink-soft)]">
                        {q.question_count} questions · {formatRelative(q.created_at)}
                      </span>
                    </span>
                    <span className="shrink-0 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[color:var(--color-ink-soft)] transition-colors group-hover:text-[color:var(--color-coral-deep)]">
                      Retake →
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {/* New-quiz CTA — compact when there are existing quizzes, since
                the primary action is usually retake. */}
            <div className="mt-6 rounded-2xl border-[1.5px] border-dashed border-[color:var(--color-border)] bg-[color:var(--color-paper-2)]/40 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-ink-soft)]">
                  Generate a new one
                </p>
                <div className="flex gap-1">
                  {[5, 8, 12].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCount(n)}
                      className={`h-7 w-9 rounded-full text-xs font-semibold transition-all ${
                        count === n
                          ? "bg-[color:var(--color-coral)] text-white"
                          : "bg-white/60 text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-coral-deep)]"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                size="sm"
                variant="accent"
                className="mt-3 w-full"
                onClick={() => generate.mutate(count)}
                disabled={generate.isPending || atLimit}
              >
                {generate.isPending
                  ? "Writing your quiz…"
                  : atLimit
                    ? "Quiz cap reached"
                    : `Make a ${count}-question quiz`}
              </Button>
              {renderGenerateError({ generateError, rateLimited, error: generate.error })}
            </div>
          </div>
        )}

        {/* Empty state — no saved quizzes, full-screen CTA */}
        {!hasSaved && (
          <div className="flex h-full flex-col items-center justify-center gap-5 px-6 py-8 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-[color:var(--color-coral)]/15 text-[color:var(--color-coral-deep)]">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div>
              <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
                Ready for a quiz?
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-[color:var(--color-ink-soft)]">
                We'll write fresh questions from this book. No looking back —
                unless you want to.
              </p>
            </div>

            {sub && (
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-ink-soft)]">
                <span className="tabular-nums">
                  {used}
                  <span className="opacity-50"> / </span>
                  {unlimited ? "∞" : limit}
                </span>{" "}
                quizzes for this book
              </p>
            )}

            <div className="flex flex-col items-center gap-2">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-ink-soft)]">
                How many questions?
              </p>
              <div className="flex gap-1.5">
                {[5, 8, 12].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCount(n)}
                    className={`h-9 w-12 rounded-full text-sm font-semibold transition-all ${
                      count === n
                        ? "bg-[color:var(--color-coral)] text-white shadow-[0_2px_0_rgba(140,50,40,0.4)]"
                        : "border-[1.5px] border-[color:var(--color-border)] bg-white/60 text-[color:var(--color-ink-soft)] hover:border-[color:var(--color-coral)] hover:text-[color:var(--color-coral-deep)]"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <Button
              size="lg"
              variant="accent"
              onClick={() => generate.mutate(count)}
              disabled={generate.isPending || atLimit}
            >
              {generate.isPending
                ? "Writing your quiz…"
                : atLimit
                  ? "Quiz cap reached"
                  : "Make my quiz"}
            </Button>

            {renderGenerateError({ generateError, rateLimited, error: generate.error })}
          </div>
        )}
      </div>
    );
  }

  const allAnswered = quiz.questions.every((q) => answers[q.id] !== undefined);
  const answeredCount = quiz.questions.filter(
    (q) => answers[q.id] !== undefined,
  ).length;
  const progress = (answeredCount / quiz.questions.length) * 100;

  // Auto-scroll the next unanswered question into view after each answer.
  // Essential on mobile, where the drawer only shows one question at a time.
  // questionRefs itself is declared as a hook above (rules-of-hooks).
  const setQuestionRef = (id: string) => (el: HTMLLIElement | null) => {
    questionRefs.current[id] = el;
  };

  const pickAnswer = (questionId: string, choiceIdx: number) => {
    const updated = { ...answers, [questionId]: choiceIdx };
    setAnswers(updated);
    // Find the next still-unanswered question after this one and scroll it
    // into view. If they're answering out of order, this jumps to whatever
    // comes next that they haven't done — which is usually what you want.
    const currentIdx = quiz!.questions.findIndex((qq) => qq.id === questionId);
    const next = quiz!.questions
      .slice(currentIdx + 1)
      .find((qq) => updated[qq.id] == null);
    if (!next) return;
    requestAnimationFrame(() => {
      questionRefs.current[next.id]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-[color:var(--color-border)] bg-[color:var(--color-paper)]/60 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="line-clamp-1 font-[family-name:var(--font-display)] text-base font-semibold tracking-tight">
            {quiz.title}
          </h3>
          <span className="shrink-0 rounded-full bg-[color:var(--color-paper-3)] px-2.5 py-0.5 text-[0.7rem] font-semibold text-[color:var(--color-ink-soft)]">
            {answeredCount} / {quiz.questions.length}
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--color-paper-3)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[color:var(--color-coral)] to-[color:var(--color-saffron)] transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <ol className="flex flex-col gap-5">
          {quiz.questions.map((q, i) => (
            <li
              key={q.id}
              ref={setQuestionRef(q.id)}
              className="card-paper scroll-mt-2 p-4"
            >
              <p className="text-sm font-medium leading-relaxed">
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--color-coral)]/15 text-[0.7rem] font-bold text-[color:var(--color-coral-deep)]">
                  {i + 1}
                </span>
                {q.prompt}
              </p>
              <div className="mt-3 flex flex-col gap-1.5">
                {q.choices.map((choice, idx) => {
                  const checked = answers[q.id] === idx;
                  return (
                    <label
                      key={idx}
                      className={`flex min-h-[44px] cursor-pointer touch-manipulation items-start gap-2.5 rounded-xl border-[1.5px] px-3 py-2.5 text-sm transition-all ${
                        checked
                          ? "border-[color:var(--color-coral)] bg-[color:var(--color-coral)]/8 text-[color:var(--color-ink)]"
                          : "border-[color:var(--color-border)] bg-white/40 hover:border-[color:var(--color-border-strong)] active:bg-[color:var(--color-paper-2)]"
                      }`}
                    >
                      <span
                        className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border-[1.5px] ${
                          checked
                            ? "border-[color:var(--color-coral)] bg-[color:var(--color-coral)]"
                            : "border-[color:var(--color-border-strong)]"
                        }`}
                      >
                        {checked && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      <input
                        type="radio"
                        name={q.id}
                        className="sr-only"
                        checked={checked}
                        onChange={() => pickAnswer(q.id, idx)}
                      />
                      <span className="flex-1">{choice}</span>
                    </label>
                  );
                })}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-[color:var(--color-border)] bg-[color:var(--color-paper)]/70 px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setQuiz(null);
            setAnswers({});
          }}
        >
          Cancel
        </Button>
        <Button
          variant="accent"
          size="default"
          onClick={() => submit.mutate()}
          disabled={!allAnswered || submit.isPending}
        >
          {submit.isPending ? "Checking…" : allAnswered ? "Check my answers ✓" : `Pick ${quiz.questions.length - answeredCount} more`}
        </Button>
      </div>
      {submit.isError && (
        <p className="bg-[color:var(--color-destructive)]/10 px-4 py-2 text-xs text-[color:var(--color-destructive)]">
          {(submit.error as Error).message}
        </p>
      )}
    </div>
  );
}

// ───────────────────────── helpers ─────────────────────────

function renderGenerateError({
  generateError,
  rateLimited,
  error,
}: {
  generateError: ReturnType<typeof parseQuotaError>;
  rateLimited: boolean;
  error: Error | null;
}) {
  if (generateError) {
    return (
      <div className="mt-3 w-full max-w-sm">
        <UpgradeNudge
          error={generateError}
          kind={generateError.error === "no_active_plan" ? "no_plan" : "quizzes"}
        />
      </div>
    );
  }
  if (rateLimited) {
    return (
      <p className="mt-3 max-w-xs rounded-lg bg-[color:var(--color-saffron)]/12 px-3 py-2 text-xs text-[color:var(--color-saffron-deep)]">
        The AI provider is at capacity right now. Wait about a minute and
        try again — your existing quizzes are still here to retake.
      </p>
    );
  }
  if (error) {
    return (
      <p className="mt-3 max-w-xs rounded-lg bg-[color:var(--color-destructive)]/10 px-3 py-2 text-xs text-[color:var(--color-destructive)]">
        {error instanceof ApiError
          ? error.message
          : (error as Error).message || "Quiz generation failed"}
      </p>
    );
  }
  return null;
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const m = Math.round(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function ResultsView({
  quiz,
  attempt,
  onRetake,
  onNew,
}: {
  quiz: Quiz;
  attempt: QuizAttempt;
  onRetake: () => void;
  onNew: () => void;
}) {
  const pct =
    attempt.total > 0 ? Math.round((attempt.score / attempt.total) * 100) : 0;
  const flavor = pickFlavor(pct);

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-[color:var(--color-border)] bg-gradient-to-br from-[color:var(--color-saffron)]/12 via-transparent to-[color:var(--color-coral)]/10 px-5 py-5">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-ink-soft)]">
          {flavor.kicker}
        </p>
        <div className="mt-2 flex items-baseline gap-3">
          <span className="font-[family-name:var(--font-display)] text-5xl font-semibold leading-none tracking-tight text-[color:var(--color-ink)]">
            {attempt.score}
            <span className="text-[color:var(--color-ink-soft)]">/{attempt.total}</span>
          </span>
          <span className={`badge-pill ${flavor.tone}`}>{pct}%</span>
        </div>
        <p className="mt-3 max-w-md text-sm text-[color:var(--color-ink-soft)]">
          {flavor.message}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <ol className="flex flex-col gap-3">
          {quiz.questions.map((q, i) => {
            const r = attempt.results.find((x) => x.question_id === q.id);
            const correct = r?.correct ?? false;
            const correctIdx = r?.correct_index ?? -1;
            const givenIdx = r?.given_index ?? -1;
            return (
              <li
                key={q.id}
                className={`card-paper overflow-hidden p-4 ${
                  correct
                    ? "ring-1 ring-[color:var(--color-sage)]/30"
                    : "ring-1 ring-[color:var(--color-destructive)]/25"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                      correct
                        ? "bg-[color:var(--color-sage)]/15 text-[color:var(--color-sage-deep)]"
                        : "bg-[color:var(--color-destructive)]/15 text-[color:var(--color-destructive)]"
                    }`}
                  >
                    {correct ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    )}
                  </span>
                  <p className="flex-1 text-sm font-medium leading-relaxed">
                    <span className="mr-1 text-[color:var(--color-ink-soft)]">
                      {i + 1}.
                    </span>
                    {q.prompt}
                  </p>
                </div>
                <div className="mt-3 flex flex-col gap-1.5 pl-10">
                  {q.choices.map((choice, idx) => {
                    const isCorrect = idx === correctIdx;
                    const isGiven = idx === givenIdx;
                    let cls =
                      "rounded-lg border-[1.5px] border-[color:var(--color-border)] bg-white/40 px-3 py-2 text-xs";
                    if (isCorrect) {
                      cls =
                        "rounded-lg border-[1.5px] border-[color:var(--color-sage)] bg-[color:var(--color-sage)]/10 px-3 py-2 text-xs text-[color:var(--color-sage-deep)]";
                    } else if (isGiven) {
                      cls =
                        "rounded-lg border-[1.5px] border-[color:var(--color-destructive)] bg-[color:var(--color-destructive)]/8 px-3 py-2 text-xs text-[color:var(--color-destructive)]";
                    }
                    return (
                      <div key={idx} className={cls}>
                        <span className="font-medium">{choice}</span>
                        {isCorrect && (
                          <span className="ml-2 font-semibold">✓ correct</span>
                        )}
                        {isGiven && !isCorrect && (
                          <span className="ml-2 font-semibold">your pick</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {r?.explanation && (
                  <p
                    className={`mt-3 rounded-lg px-3 py-2 pl-10 text-xs italic leading-relaxed ${
                      correct
                        ? "text-[color:var(--color-sage-deep)]"
                        : "text-[color:var(--color-ink-soft)]"
                    }`}
                  >
                    {r.explanation}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-[color:var(--color-border)] bg-[color:var(--color-paper)]/70 px-4 py-3">
        <Button variant="outline" size="sm" onClick={onRetake}>
          Retake
        </Button>
        <Button variant="accent" size="default" onClick={onNew}>
          New quiz →
        </Button>
      </div>
    </div>
  );
}

function pickFlavor(pct: number) {
  if (pct >= 90) {
    return {
      kicker: "★ Perfect aim",
      message: "Honestly impressive. You really get this book.",
      tone: "bg-[color:var(--color-sage)]/15 text-[color:var(--color-sage-deep)]",
    };
  }
  if (pct >= 70) {
    return {
      kicker: "Strong work",
      message: "You're got the big ideas. A quick reread on the missed bits and you'll nail the next one.",
      tone: "bg-[color:var(--color-saffron)]/20 text-[color:var(--color-saffron-deep)]",
    };
  }
  if (pct >= 50) {
    return {
      kicker: "Halfway there",
      message: "Solid start. Try the chapters you stumbled on — answers cite where to look.",
      tone: "bg-[color:var(--color-saffron)]/20 text-[color:var(--color-saffron-deep)]",
    };
  }
  return {
    kicker: "Keep going",
    message: "Tough one. Skim the cited passages and try again — that's exactly how learning works.",
    tone: "bg-[color:var(--color-coral)]/15 text-[color:var(--color-coral-deep)]",
  };
}
