"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";

import { PlantSvg } from "./plant-svg";
import { FarmerSvg } from "./farmer-svg";
import {
  getTendingQuestions,
  submitTending,
  type Garden,
  type TendingQuestion,
  type TendingResult,
} from "@/lib/garden";
import { useI18n } from "@/lib/i18n";

type Phase = "intro" | "asking" | "submitting" | "result";

export function WeeklyTendingFlow({ garden }: { garden: Garden }) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>("intro");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<TendingResult | null>(null);

  const { data: questions } = useQuery<TendingQuestion[]>({
    queryKey: ["tending", garden.bookId],
    queryFn: () => getTendingQuestions(garden.bookId),
  });

  const submit = useMutation<TendingResult, Error, void>({
    mutationFn: async () => {
      if (!questions) throw new Error("questions not loaded");
      return submitTending(
        garden.bookId,
        Object.entries(answers).map(([questionId, choiceIndex]) => ({
          questionId,
          choiceIndex,
        })),
      );
    },
    onSuccess: (r) => {
      setResult(r);
      setPhase("result");
    },
  });

  // When the user answers the last question, auto-submit.
  useEffect(() => {
    if (!questions) return;
    if (phase !== "asking") return;
    const allAnswered = questions.every((q) => answers[q.id] !== undefined);
    if (allAnswered && !submit.isPending && !submit.isSuccess) {
      setPhase("submitting");
      submit.mutate();
    }
  }, [answers, questions, phase, submit]);

  if (!questions) {
    return (
      <p className="font-[family-name:var(--font-display)] italic text-[color:var(--color-ink-soft)]">
        {t("tend.preparing")}
      </p>
    );
  }

  if (phase === "intro") {
    return <IntroPanel garden={garden} count={questions.length} onBegin={() => setPhase("asking")} />;
  }

  if (phase === "result" && result) {
    return <ResultPanel garden={garden} result={result} questions={questions} />;
  }

  const q = questions[current];
  return (
    <AskingPanel
      garden={garden}
      questions={questions}
      current={current}
      question={q}
      answers={answers}
      submitting={phase === "submitting"}
      onAnswer={(choiceIndex) => {
        const next = { ...answers, [q.id]: choiceIndex };
        setAnswers(next);
        if (current < questions.length - 1) {
          setTimeout(() => setCurrent((c) => c + 1), 220);
        }
      }}
      onBack={() => setCurrent((c) => Math.max(0, c - 1))}
    />
  );
}

// ---------------------------------------------------------------------------
// Sub-panels
// ---------------------------------------------------------------------------

function IntroPanel({
  garden, count, onBegin,
}: { garden: Garden; count: number; onBegin: () => void }) {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <PlantStage garden={garden} caption={t("tend.stage.begins")} />
      <div className="flex flex-col justify-center">
        <p className="font-[family-name:var(--font-display)] text-[13px] uppercase tracking-[0.2em] italic text-[color:var(--color-muted-foreground)]">
          {t("tend.intro.eyebrow")}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(40px,5vw,72px)] font-light italic leading-[1] tracking-[-0.02em]">
          {t("tend.intro.title")}
        </h1>
        <p className="mt-5 max-w-[58ch] font-[family-name:var(--font-display)] text-[18px] italic text-[color:var(--color-ink-soft)]">
          {t("tend.intro.body", { species: speciesShort(garden, t) })}
        </p>

        <dl className="mt-7 grid max-w-md grid-cols-3 border-t border-[color:var(--color-border)]">
          <Stat label={t("tend.intro.stat.questions")} val={count.toString()} />
          <Stat label={t("tend.intro.stat.time")} val={t("tend.intro.stat.time.val")} mid />
          <Stat label={t("tend.intro.stat.pass")} val={t("tend.intro.stat.pass.val")} />
        </dl>

        <div className="mt-9 flex items-center gap-4">
          <button
            type="button"
            onClick={onBegin}
            className="group inline-flex items-center gap-2.5 rounded-[2px] bg-[color:var(--color-ink)] px-6 py-3.5 font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.16em] text-[color:var(--color-paper)] transition-all hover:translate-x-1 hover:bg-[color:var(--color-sage-deep)]"
          >
            {t("tend.begin")}
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </button>
          <Link
            href={`/garden/${garden.bookId}`}
            className="font-[family-name:var(--font-display)] text-sm italic text-[color:var(--color-muted-foreground)] underline decoration-dashed underline-offset-4 hover:text-[color:var(--color-ink)]"
          >
            {t("tend.returnToGarden")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function AskingPanel({
  garden, questions, current, question, answers, submitting, onAnswer, onBack,
}: {
  garden: Garden;
  questions: TendingQuestion[];
  current: number;
  question: TendingQuestion;
  answers: Record<string, number>;
  submitting: boolean;
  onAnswer: (idx: number) => void;
  onBack: () => void;
}) {
  const { t, tn } = useI18n();
  const picked = answers[question.id];
  const progress = ((current + (picked !== undefined ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.1fr)]">
      <PlantStage
        garden={garden}
        caption={submitting
          ? t("tend.stage.weighing")
          : t("tend.stage.question", { current: current + 1, total: questions.length })}
      />

      <div className="flex flex-col">
        {/* progress */}
        <div className="mb-3 flex items-center justify-between font-[family-name:var(--font-display)] text-[12px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
          <span>
            {t("tend.progress.question", { n: current + 1 })}
            <span className="mx-2 text-[color:var(--color-border-strong)]">/</span>
            {questions.length}
          </span>
          <span>{tn("tend.progress.answered", Object.keys(answers).length)}</span>
        </div>
        <div className="mb-7 h-[2px] bg-[color:var(--color-paper-3)]">
          <div
            className="h-full bg-[color:var(--color-ink)] transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* prompt */}
        <p className="font-[family-name:var(--font-display)] text-[28px] font-light leading-[1.18] tracking-[-0.01em] text-[color:var(--color-ink)] sm:text-[32px]">
          <span className="float-left mr-2 -mt-0.5 font-medium not-italic text-[color:var(--color-coral-deep)]">
            {romanizeQ(current)}.
          </span>
          {question.prompt}
        </p>

        {/* choices */}
        <ol className="mt-7 flex flex-col gap-2.5">
          {question.choices.map((choice, idx) => {
            const isPicked = picked === idx;
            const letter = String.fromCharCode(65 + idx);
            return (
              <li key={idx}>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => onAnswer(idx)}
                  className={[
                    "group flex w-full items-center gap-4 rounded-[2px] border px-4 py-4 text-left transition-all",
                    isPicked
                      ? "border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-paper)]"
                      : "border-[color:var(--color-border)] bg-[color:var(--color-paper)] hover:-translate-y-0.5 hover:border-[color:var(--color-border-strong)] hover:shadow-[0_8px_16px_-14px_rgba(60,40,10,0.5)]",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full border font-[family-name:var(--font-display)] text-sm italic transition-colors",
                      isPicked
                        ? "border-[color:var(--color-paper)] text-[color:var(--color-paper)]"
                        : "border-[color:var(--color-border-strong)] text-[color:var(--color-ink-soft)] group-hover:border-[color:var(--color-ink)] group-hover:text-[color:var(--color-ink)]",
                    ].join(" ")}
                  >
                    {letter}
                  </span>
                  <span className="font-[family-name:var(--font-display)] text-[18px]">{choice}</span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* nav */}
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            disabled={current === 0 || submitting}
            onClick={onBack}
            className="font-[family-name:var(--font-display)] text-sm italic text-[color:var(--color-muted-foreground)] underline decoration-dashed underline-offset-4 transition-colors hover:text-[color:var(--color-ink)] disabled:cursor-not-allowed disabled:no-underline disabled:opacity-40"
          >
            {t("tend.previousQuestion")}
          </button>
          {picked !== undefined && current === questions.length - 1 && !submitting && (
            <span className="font-[family-name:var(--font-display)] text-[12px] uppercase tracking-[0.18em] italic text-[color:var(--color-muted-foreground)]">
              {t("tend.weighingAnswers")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultPanel({
  garden, result, questions,
}: { garden: Garden; result: TendingResult; questions: TendingQuestion[] }) {
  const { t } = useI18n();
  const flavor = pickFlavor(result, t);

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <PlantStage
        garden={{ ...garden, stage: result.newStage, vitality: garden.vitality + result.vitalityRestored }}
        caption={result.passed ? t("tend.stage.watered") : t("tend.stage.thirsty")}
        stamp={result.passed ? t("tend.stamp.tended") : t("tend.stamp.missed")}
        stampWarn={!result.passed}
      />

      <div className="flex flex-col">
        <p className="font-[family-name:var(--font-display)] text-[13px] uppercase tracking-[0.2em] italic text-[color:var(--color-muted-foreground)]">
          {t("tend.result.eyebrow")}
        </p>
        <h1
          className={[
            "mt-3 font-[family-name:var(--font-display)] text-[clamp(40px,5vw,72px)] font-light italic leading-[1] tracking-[-0.02em]",
            result.passed ? "text-[color:var(--color-ink)]" : "text-[color:var(--color-coral-deep)]",
          ].join(" ")}
        >
          {flavor.headline}
        </h1>
        <p className="mt-5 max-w-[58ch] font-[family-name:var(--font-display)] text-[18px] italic text-[color:var(--color-ink-soft)]">
          {flavor.body}
        </p>

        {/* score bar */}
        <div className="mt-7 flex items-baseline gap-3">
          <span className="font-[family-name:var(--font-display)] text-[64px] font-light leading-none tracking-[-0.04em] tabular-nums">
            {result.score}
            <span className="text-[color:var(--color-muted-foreground)]">/{result.total}</span>
          </span>
          <span
            className={[
              "rounded-full border px-3 py-1 font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.18em]",
              result.passed
                ? "border-[color:var(--color-sage)] bg-[color:var(--color-sage)]/12 text-[color:var(--color-sage-deep)]"
                : "border-[color:var(--color-coral)] bg-[color:var(--color-coral)]/10 text-[color:var(--color-coral-deep)]",
            ].join(" ")}
          >
            {result.passed ? t("tend.result.passed") : t("tend.result.belowThreshold")}
          </span>
        </div>

        {/* rewards */}
        <dl className="mt-7 grid max-w-md grid-cols-3 border-t border-[color:var(--color-border)]">
          <Stat label={t("tend.result.stat.growth")} val={`+${result.growthGained}%`} />
          <Stat label={t("tend.result.stat.vitality")} val={result.passed ? t("tend.result.stat.vitality.full") : `+${result.vitalityRestored}`} mid />
          <Stat label={t("tend.result.stat.nextRite")} val={t("tend.result.stat.nextRite.val")} />
        </dl>

        {/* per-question review */}
        <details className="mt-7 rounded-sm border border-[color:var(--color-border)] bg-[color:var(--color-paper-2)]/40">
          <summary className="cursor-pointer list-none px-4 py-3 font-[family-name:var(--font-display)] text-[14px] italic text-[color:var(--color-ink-soft)] transition-colors hover:text-[color:var(--color-ink)]">
            ※ {t("tend.result.review")}
          </summary>
          <ul className="border-t border-dashed border-[color:var(--color-border)]">
            {questions.map((q, i) => {
              const r = result.perQuestion.find((p) => p.id === q.id);
              const correct = r?.correct ?? false;
              const answerIdx = r?.correctIndex ?? q.correctIndex;
              const explanation = r?.explanation ?? q.explanation;
              return (
                <li
                  key={q.id}
                  className="border-b border-dashed border-[color:var(--color-border)]/60 px-4 py-3 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={[
                        "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-medium",
                        correct
                          ? "bg-[color:var(--color-sage)]/15 text-[color:var(--color-sage-deep)]"
                          : "bg-[color:var(--color-coral)]/15 text-[color:var(--color-coral-deep)]",
                      ].join(" ")}
                    >
                      {correct ? "✓" : "✗"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="mr-1 font-[family-name:var(--font-display)] italic text-[color:var(--color-muted-foreground)]">
                          {romanizeQ(i)}.
                        </span>
                        {q.prompt}
                      </p>
                      {!correct && answerIdx !== undefined && answerIdx >= 0 && (
                        <p className="mt-1.5 text-xs italic text-[color:var(--color-muted-foreground)]">
                          {t("tend.result.answer")} <span className="text-[color:var(--color-ink)] not-italic">{q.choices[answerIdx]}</span>
                        </p>
                      )}
                      {explanation && (
                        <p className="mt-1.5 text-xs italic leading-relaxed text-[color:var(--color-ink-soft)]">
                          {explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </details>

        <div className="mt-9 flex items-center gap-4">
          <Link
            href={`/garden/${garden.bookId}`}
            className="group inline-flex items-center gap-2.5 rounded-[2px] bg-[color:var(--color-ink)] px-6 py-3.5 font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.16em] text-[color:var(--color-paper)] transition-all hover:translate-x-1 hover:bg-[color:var(--color-sage-deep)]"
          >
            {t("tend.returnToGarden")}
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <Link
            href="/garden"
            className="font-[family-name:var(--font-display)] text-sm italic text-[color:var(--color-muted-foreground)] underline decoration-dashed underline-offset-4 hover:text-[color:var(--color-ink)]"
          >
            {t("tend.seeOtherGardens")}
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

function PlantStage({
  garden, caption, stamp, stampWarn = false,
}: {
  garden: Garden;
  caption: string;
  stamp?: string;
  stampWarn?: boolean;
}) {
  const wilting = garden.vitality <= 1;
  return (
    <div
      className={[
        "relative overflow-hidden rounded-sm border border-[color:var(--color-border)]",
        "min-h-[440px] p-7",
        "bg-[linear-gradient(180deg,#FFFCF3_0%,var(--color-paper-2)_100%)]",
        "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6),0_20px_40px_-30px_rgba(60,40,10,0.4)]",
      ].join(" ")}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[14px] rounded-sm border border-dashed border-[color:var(--color-border-strong)]/60"
      />

      {/* dome */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-6 inset-x-[10%] z-[2] rounded-t-[220px] rounded-b-[14px] border border-[rgba(60,40,10,0.18)]"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.36) 0%, rgba(255,255,255,0.06) 30%, rgba(180,160,110,0.07) 100%)",
        }}
      />

      <div className="relative h-[360px]">
        <div className="garden-plant absolute left-1/2 top-4 z-[3]">
          <PlantSvg species={garden.species} stage={garden.stage} wilting={wilting} width={240} height={320} />
        </div>
        <div className="absolute bottom-7 right-[10%] z-[4]">
          <FarmerSvg farmer={garden.farmer} width={66} height={102} />
        </div>
        <div
          aria-hidden
          className="absolute inset-x-[10%] bottom-4 z-[3] h-12 rounded-t-md rounded-b-xl"
          style={{
            background: "linear-gradient(180deg, #8B6939 0%, #5A4423 100%)",
            boxShadow: "inset 0 2px 0 #A38456, inset 0 -8px 16px rgba(0,0,0,0.25)",
          }}
        />

        {/* stamp overlay (result phase) */}
        {stamp && (
          <span
            aria-hidden
            className={[
              "absolute left-1/2 top-1/2 z-[5] -translate-x-1/2 -translate-y-1/2",
              "rotate-[-9deg] rounded-sm border-[3px] px-5 py-2",
              "font-[family-name:var(--font-display)] text-[28px] font-medium tracking-[0.14em]",
              "shadow-[0_0_0_2px_rgba(255,250,237,0.4)]",
              stampWarn
                ? "border-[color:var(--color-coral-deep)] text-[color:var(--color-coral-deep)] bg-[color:var(--color-coral)]/15"
                : "border-[color:var(--color-sage-deep)] text-[color:var(--color-sage-deep)] bg-[color:var(--color-sage)]/15",
            ].join(" ")}
            style={{ animation: "garden-stamp 600ms cubic-bezier(0.34, 1.56, 0.64, 1) both" }}
          >
            {stamp}
          </span>
        )}
      </div>

      <div className="relative z-[2] mt-1 text-center font-[family-name:var(--font-display)] text-[13px] italic text-[color:var(--color-muted-foreground)]">
        {caption}
      </div>
    </div>
  );
}

function Stat({ label, val, mid = false }: { label: string; val: string; mid?: boolean }) {
  return (
    <div
      className={[
        "py-3 pr-3",
        mid ? "border-x border-dashed border-[color:var(--color-border-strong)]/50 px-4" : "",
      ].join(" ")}
    >
      <dt className="font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.15em] italic text-[color:var(--color-muted-foreground)]">
        {label}
      </dt>
      <dd className="mt-1 font-[family-name:var(--font-display)] text-[26px] leading-none tracking-[-0.02em] tabular-nums">
        {val}
      </dd>
    </div>
  );
}

function pickFlavor(
  result: TendingResult,
  t: (key: string) => string,
): { headline: string; body: string } {
  if (result.score === result.total) {
    return {
      headline: t("tend.flavor.perfect.headline"),
      body: t("tend.flavor.perfect.body"),
    };
  }
  if (result.passed && result.score >= 4) {
    return {
      headline: t("tend.flavor.clean.headline"),
      body: t("tend.flavor.clean.body"),
    };
  }
  if (result.passed) {
    return {
      headline: t("tend.flavor.justEnough.headline"),
      body: t("tend.flavor.justEnough.body"),
    };
  }
  return {
    headline: t("tend.flavor.thirsty.headline"),
    body: t("tend.flavor.thirsty.body"),
  };
}

function romanizeQ(i: number): string {
  return ["I", "II", "III", "IV", "V", "VI", "VII"][i] ?? `${i + 1}`;
}

function speciesShort(garden: Garden, t: (key: string) => string): string {
  switch (garden.species) {
    case "ficus": return t("tend.species.ficus");
    case "helianthus": return t("tend.species.helianthus");
    case "lavandula": return t("tend.species.lavandula");
    case "monstera": return t("tend.species.monstera");
  }
}
