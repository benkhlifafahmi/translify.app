"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  createTranslation,
  listTranslations,
  retryTranslation,
  type Translation,
} from "@/lib/translations";
import { ApiError } from "@/lib/api";

const LANGUAGES: { code: string; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "sv", label: "Svenska", flag: "🇸🇪" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
];

interface Props {
  bookId: string;
  sourceLanguage: string | null;
  selectedTranslationId: string | null;
  onSelectTranslation: (id: string | null) => void;
}

export function TranslatePanel({
  bookId,
  sourceLanguage,
  selectedTranslationId,
  onSelectTranslation,
}: Props) {
  const qc = useQueryClient();
  const [target, setTarget] = useState<string>(() => {
    if (sourceLanguage === "en") return "fr";
    return "en";
  });

  const { data: translations = [] } = useQuery<Translation[]>({
    queryKey: ["translations", bookId],
    queryFn: () => listTranslations(bookId),
    refetchInterval: (q) => {
      const data = q.state.data;
      if (!data) return false;
      const pending = data.some(
        (t) => t.status === "queued" || t.status === "in_progress",
      );
      return pending ? 4000 : false;
    },
  });

  const create = useMutation<Translation, Error, string>({
    mutationFn: (lang) => createTranslation(bookId, lang),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ["translations", bookId] });
      onSelectTranslation(t.id);
    },
  });

  const retry = useMutation<Translation, Error, string>({
    mutationFn: (id) => retryTranslation(id),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ["translations", bookId] });
      qc.invalidateQueries({ queryKey: ["file-url", bookId, t.id] });
    },
  });

  const isPending =
    create.isPending ||
    translations.some(
      (t) => t.target_language === target && (t.status === "queued" || t.status === "in_progress"),
    );

  const sourceLabel =
    LANGUAGES.find((l) => l.code === sourceLanguage)?.label ??
    (sourceLanguage ? sourceLanguage.toUpperCase() : "Unknown");

  return (
    <div className="flex flex-col gap-5 p-5">
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-ink-soft)]">
          The book
        </p>
        <h3 className="mt-1.5 font-[family-name:var(--font-display)] text-xl font-semibold leading-tight tracking-tight">
          Read it your way.
        </h3>
        <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
          Choose a language and we'll keep the layout exactly the same.
        </p>
      </div>

      <div className="card-paper flex flex-col gap-3 p-4">
        <label className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-ink-soft)]">
          Translate into
        </label>
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="rounded-xl border-[1.5px] border-[color:var(--color-border)] bg-white/70 px-3 py-2.5 text-sm font-medium focus:border-[color:var(--color-saffron)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-saffron)]/30"
        >
          {LANGUAGES.filter((l) => l.code !== sourceLanguage).map((l) => (
            <option key={l.code} value={l.code}>
              {l.flag}  {l.label}
            </option>
          ))}
        </select>
        <Button
          variant="accent"
          size="default"
          onClick={() => create.mutate(target)}
          disabled={isPending}
        >
          {isPending ? "Translating…" : "Translate this book"}
        </Button>

        {create.isError && (
          <p className="rounded-lg bg-[color:var(--color-destructive)]/10 px-3 py-2 text-xs text-[color:var(--color-destructive)]">
            {create.error instanceof ApiError
              ? create.error.message
              : create.error.message || "Translation failed"}
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-ink-soft)]">
          Versions
        </p>
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => onSelectTranslation(null)}
            className={`group flex items-center justify-between gap-2 rounded-xl border-[1.5px] px-3.5 py-2.5 text-left text-sm transition-all ${
              selectedTranslationId === null
                ? "border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4)]"
                : "border-[color:var(--color-border)] bg-white/40 hover:border-[color:var(--color-border-strong)]"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="text-base">📖</span>
              <span>
                <span className="block font-semibold">Original</span>
                <span
                  className={`block text-[0.7rem] ${
                    selectedTranslationId === null
                      ? "text-[color:var(--color-paper-3)]"
                      : "text-[color:var(--color-ink-soft)]"
                  }`}
                >
                  {sourceLabel}
                </span>
              </span>
            </span>
            {selectedTranslationId === null && (
              <span className="text-xs">●</span>
            )}
          </button>
          {translations.map((t) => (
            <TranslationRow
              key={t.id}
              t={t}
              selected={selectedTranslationId === t.id}
              onSelect={() => t.status === "ready" && onSelectTranslation(t.id)}
              onRetry={() => retry.mutate(t.id)}
              retryPending={retry.isPending && retry.variables === t.id}
            />
          ))}

          {translations.length === 0 && (
            <p className="rounded-xl border-[1.5px] border-dashed border-[color:var(--color-border)] px-3.5 py-3 text-xs text-[color:var(--color-ink-soft)]">
              No translations yet. Pick a language above to make one.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TranslationRow({
  t,
  selected,
  onSelect,
  onRetry,
  retryPending,
}: {
  t: Translation;
  selected: boolean;
  onSelect: () => void;
  onRetry: () => void;
  retryPending: boolean;
}) {
  const lang = LANGUAGES.find((l) => l.code === t.target_language);
  const label = lang?.label ?? t.target_language.toUpperCase();
  const flag = lang?.flag ?? "🌐";
  const ready = t.status === "ready";
  const canRetry = t.status === "ready" || t.status === "failed";

  return (
    <div
      className={`flex items-stretch gap-1 rounded-xl border-[1.5px] transition-all ${
        selected
          ? "border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4)]"
          : "border-[color:var(--color-border)] bg-white/40 hover:border-[color:var(--color-border-strong)]"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        disabled={!ready}
        className="flex flex-1 items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm disabled:cursor-not-allowed"
      >
        <span className="flex items-center gap-2.5">
          <span className="text-base">{flag}</span>
          <span>
            <span className="block font-semibold">{label}</span>
            <span
              className={`block text-[0.7rem] ${
                selected ? "text-[color:var(--color-paper-3)]" : "text-[color:var(--color-ink-soft)]"
              }`}
            >
              {statusBadge(t)}
            </span>
          </span>
        </span>
        {selected && <span className="text-xs">●</span>}
      </button>
      <button
        type="button"
        onClick={onRetry}
        disabled={!canRetry || retryPending}
        title="Re-run translation"
        className={`grid w-9 place-items-center rounded-r-[10px] text-base transition-colors disabled:opacity-40 ${
          selected
            ? "text-[color:var(--color-paper-3)] hover:bg-white/10 hover:text-white"
            : "text-[color:var(--color-ink-soft)] hover:bg-[color:var(--color-paper-3)]/60 hover:text-[color:var(--color-ink)]"
        }`}
      >
        {retryPending ? "…" : "↻"}
      </button>
    </div>
  );
}

function statusBadge(t: Translation): string {
  if (t.status === "ready") return "Ready to read";
  if (t.status === "in_progress") return "Translating…";
  if (t.status === "queued") return "Up next";
  if (t.status === "failed") return "Hit a snag — try again";
  return t.status;
}
