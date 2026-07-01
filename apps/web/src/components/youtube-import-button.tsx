"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { importYouTube, youtubeVideoId } from "@/lib/media";
import { parseQuotaError, upgradeUrl } from "@/lib/quota";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import type { Book } from "@/lib/books";

export function YouTubeImportButton() {
  const { t } = useI18n();
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation<Book, Error, string>({
    mutationFn: (u) => importYouTube(u),
    onSuccess: (book) => {
      qc.invalidateQueries({ queryKey: ["books"] });
      setOpen(false);
      setUrl("");
      router.push(`/watch/${book.id}`);
    },
    onError: (err) => {
      const quota = parseQuotaError(err);
      if (quota) {
        window.location.href = upgradeUrl(
          quota.error === "no_active_plan" ? "no_plan" : "pages",
        );
        return;
      }
      setError(err instanceof ApiError ? err.message : err.message || t("media.import.failed"));
    },
  });

  const submit = () => {
    setError(null);
    const v = url.trim();
    if (!youtubeVideoId(v)) {
      setError(t("media.import.invalidUrl"));
      return;
    }
    mutation.mutate(v);
  };

  // ESC to close (when not mid-import).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !mutation.isPending) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, mutation.isPending]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex h-11 items-center gap-2 rounded-2xl border-[1.5px] border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)]/60 px-4 text-sm font-semibold text-[color:var(--color-ink)] transition-all hover:-translate-y-[1px] hover:border-[color:var(--color-coral-deep)] hover:bg-[color:var(--color-coral)]/5"
      >
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-[color:var(--color-coral)]/15 text-[color:var(--color-coral-deep)] transition-transform group-hover:scale-105">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
        {t("media.import.button")}
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={() => !mutation.isPending && setOpen(false)}
            className="absolute inset-0 bg-[color:var(--color-ink)]/40 backdrop-blur-[2px]"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("media.import.title")}
            className="relative w-full max-w-md rounded-3xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)] p-6 shadow-[0_24px_48px_-16px_rgba(20,16,8,0.45)]"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[color:var(--color-coral)]/15 text-[color:var(--color-coral-deep)]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <div className="min-w-0">
                <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
                  {t("media.import.title")}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-ink-soft)]">
                  {t("media.import.desc")}
                </p>
              </div>
            </div>

            <input
              type="url"
              inputMode="url"
              autoFocus
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={t("media.import.placeholder")}
              disabled={mutation.isPending}
              className="mt-5 w-full rounded-2xl border-[1.5px] border-[color:var(--color-border)] bg-white/80 px-4 py-3 text-sm text-[color:var(--color-ink)] focus:border-[color:var(--color-coral)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-coral)]/25 disabled:opacity-50"
            />

            {error && (
              <p className="mt-3 rounded-lg border border-[color:var(--color-destructive)]/30 bg-[color:var(--color-destructive)]/8 px-3 py-2 text-xs text-[color:var(--color-destructive)]">
                {error}
              </p>
            )}

            <p className="mt-3 text-[0.7rem] leading-relaxed text-[color:var(--color-ink-soft)]">
              {t("media.captionsNote")}
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={mutation.isPending}
              >
                {t("media.import.cancel")}
              </Button>
              <Button
                variant="accent"
                size="default"
                onClick={submit}
                disabled={mutation.isPending || !url.trim()}
              >
                {mutation.isPending ? t("media.import.importing") : t("media.import.submit")}
              </Button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
