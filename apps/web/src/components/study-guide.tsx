"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Lumi } from "@/components/lumi/lumi";
import { ApiError } from "@/lib/api";
import { parseQuotaError } from "@/lib/quota";
import { UpgradeNudge } from "@/components/upgrade-nudge";
import { useI18n } from "@/lib/i18n";
import {
  generateStudyGuide,
  getStudyGuide,
  gradeExercise,
  type GradeResult,
  type StudyExercise,
  type StudyGuide as StudyGuideT,
  type StudySection,
} from "@/lib/study-guide";

export function StudyGuide({ bookId }: { bookId: string }) {
  const { t } = useI18n();
  const qc = useQueryClient();

  const {
    data: guide,
    isLoading,
    error,
  } = useQuery<StudyGuideT>({
    queryKey: ["study-guide", bookId],
    queryFn: () => getStudyGuide(bookId),
    retry: false, // a 404 (no guide yet) is an expected state, not a failure
  });

  const generate = useMutation<StudyGuideT, Error, void>({
    mutationFn: () => generateStudyGuide(bookId),
    onSuccess: (g) => qc.setQueryData(["study-guide", bookId], g),
  });

  const notFound = error instanceof ApiError && error.status === 404;
  const loadError = error && !notFound ? error : null;

  if (isLoading) {
    return (
      <Shell t={t}>
        <div className="flex items-center gap-3 text-sm text-[color:var(--color-ink-soft)]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--color-border-strong)] border-t-transparent" />
          {t("studyGuide.loading")}
        </div>
      </Shell>
    );
  }

  if (!guide) {
    const quota = generate.isError ? parseQuotaError(generate.error) : null;
    return (
      <Shell t={t}>
        <div className="flex flex-col items-center gap-5 rounded-2xl border-[1.5px] border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-paper-2)]/40 px-6 py-10 text-center">
          <Lumi state={generate.isPending ? "focused" : "happy"} size={120} animate />
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
              {generate.isPending ? t("studyGuide.generating") : t("studyGuide.empty.title")}
            </h3>
            <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-[color:var(--color-ink-soft)]">
              {generate.isPending ? t("studyGuide.generatingBody") : t("studyGuide.empty.body")}
            </p>
          </div>
          {quota ? (
            <div className="w-full max-w-sm">
              <UpgradeNudge error={quota} kind={quota.error === "no_active_plan" ? "no_plan" : "quizzes"} />
            </div>
          ) : (
            <Button
              variant="accent"
              size="lg"
              onClick={() => generate.mutate()}
              disabled={generate.isPending}
            >
              {generate.isPending ? t("studyGuide.generating") : t("studyGuide.generate")}
            </Button>
          )}
          {(loadError || (generate.isError && !quota)) && (
            <p className="text-xs text-[color:var(--color-destructive)]">
              {t("studyGuide.failed")}
            </p>
          )}
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      t={t}
      action={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
        >
          {generate.isPending ? t("studyGuide.generating") : t("studyGuide.regenerate")}
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        {guide.sections.map((section, i) => (
          <SectionCard key={section.id} bookId={bookId} section={section} defaultOpen={i === 0} />
        ))}
      </div>
    </Shell>
  );
}

function Shell({
  t,
  action,
  children,
}: {
  t: (k: string, v?: Record<string, string | number>) => string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
            {t("studyGuide.title")}
          </h2>
          <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
            {t("studyGuide.subtitle")}
          </p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SectionCard({
  bookId,
  section,
  defaultOpen,
}: {
  bookId: string;
  section: StudySection;
  defaultOpen: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card-paper overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
          {section.title}
        </h3>
        <svg
          className={`shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-[color:var(--color-border)] px-5 py-4">
          <div className="text-[0.95rem] leading-relaxed text-[color:var(--color-ink)] [&_a]:underline [&_h3]:mt-3 [&_h3]:font-semibold [&_li]:mb-1 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_strong]:font-semibold [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.summary}</ReactMarkdown>
          </div>

          {section.key_points.length > 0 && (
            <div className="mt-4 rounded-xl bg-[color:var(--color-sage)]/8 p-4">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-sage-deep)]">
                {t("studyGuide.keyPoints")}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[color:var(--color-ink)]">
                {section.key_points.map((kp, i) => (
                  <li key={i}>{kp}</li>
                ))}
              </ul>
            </div>
          )}

          {section.exercises.length > 0 && (
            <div className="mt-4 flex flex-col gap-3">
              {section.exercises.map((ex) => (
                <ExerciseCard key={ex.id} bookId={bookId} exercise={ex} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExerciseCard({ bookId, exercise }: { bookId: string; exercise: StudyExercise }) {
  const { t } = useI18n();
  const [answer, setAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);

  const grade = useMutation<GradeResult, Error, string>({
    mutationFn: (a) => gradeExercise(bookId, exercise.id, a),
    onSuccess: (r) => setResult(r),
  });

  const submit = () => {
    const a = answer.trim();
    if (!a || grade.isPending) return;
    grade.mutate(a);
  };

  return (
    <div className="rounded-2xl border-[1.5px] border-[color:var(--color-border)] bg-white/60 p-4">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[color:var(--color-coral)]/15 text-[0.7rem] font-bold text-[color:var(--color-coral-deep)]">
          ?
        </span>
        <p className="flex-1 text-sm font-medium leading-relaxed text-[color:var(--color-ink)]">
          {exercise.question}
        </p>
      </div>

      {exercise.hint && (
        <button
          type="button"
          onClick={() => setShowHint((s) => !s)}
          className="mt-2 text-xs font-semibold text-[color:var(--color-ink-soft)] underline decoration-dotted hover:text-[color:var(--color-ink)]"
        >
          {t("studyGuide.showHint")}
        </button>
      )}
      {showHint && exercise.hint && (
        <p className="mt-1 text-xs italic text-[color:var(--color-ink-soft)]">{exercise.hint}</p>
      )}

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit();
          }
        }}
        rows={3}
        placeholder={t("studyGuide.answerPlaceholder")}
        disabled={grade.isPending}
        className="mt-3 w-full resize-y rounded-xl border-[1.5px] border-[color:var(--color-border)] bg-white/80 px-3 py-2 text-sm focus:border-[color:var(--color-coral)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-coral)]/20 disabled:opacity-50"
      />

      <div className="mt-2 flex items-center gap-2">
        <Button
          variant="accent"
          size="sm"
          onClick={submit}
          disabled={grade.isPending || !answer.trim()}
        >
          {grade.isPending ? t("studyGuide.checking") : t("studyGuide.check")}
        </Button>
        {result && (
          <button
            type="button"
            onClick={() => {
              setResult(null);
              grade.reset();
            }}
            className="text-xs font-semibold text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]"
          >
            {t("studyGuide.tryAgain")}
          </button>
        )}
      </div>

      {grade.isError && (
        <p className="mt-2 text-xs text-[color:var(--color-destructive)]">
          {grade.error instanceof ApiError ? grade.error.message : t("studyGuide.gradeFailed")}
        </p>
      )}

      {result && (
        <div
          className={`mt-3 rounded-xl border-[1.5px] p-3 text-sm ${
            result.correct
              ? "border-[color:var(--color-sage)] bg-[color:var(--color-sage)]/10"
              : "border-[color:var(--color-saffron)] bg-[color:var(--color-saffron)]/10"
          }`}
        >
          <p
            className={`text-[0.7rem] font-bold uppercase tracking-[0.12em] ${
              result.correct
                ? "text-[color:var(--color-sage-deep)]"
                : "text-[color:var(--color-saffron-deep)]"
            }`}
          >
            {result.correct ? t("studyGuide.correct") : t("studyGuide.incorrect")}
          </p>
          <p className="mt-1.5 leading-relaxed text-[color:var(--color-ink)]">{result.feedback}</p>
          {!result.correct && result.model_answer && (
            <p className="mt-2 border-t border-[color:var(--color-border)] pt-2 text-[color:var(--color-ink-soft)]">
              <span className="font-semibold text-[color:var(--color-ink)]">
                {t("studyGuide.modelAnswer")}:
              </span>{" "}
              {result.model_answer}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
