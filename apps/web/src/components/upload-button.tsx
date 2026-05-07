"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadBook, type Book } from "@/lib/books";
import { ApiError } from "@/lib/api";
import { parseQuotaError, upgradeUrl } from "@/lib/quota";

const ACCEPTED = ".pdf,.epub,application/pdf,application/epub+zip";

interface ActiveUpload {
  filename: string;
  loaded: number;
  total: number;
}

export function UploadButton() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  const [active, setActive] = useState<ActiveUpload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const mutation = useMutation<Book, Error, File>({
    mutationFn: async (file) => {
      setError(null);
      setActive({ filename: file.name, loaded: 0, total: file.size });
      try {
        return await uploadBook(file, {
          onProgress: (loaded, total) =>
            setActive({ filename: file.name, loaded, total }),
        });
      } finally {
        setActive(null);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["books"] });
    },
    onError: (err) => {
      const quota = parseQuotaError(err);
      if (quota) {
        window.location.href = upgradeUrl(
          quota.error === "no_active_plan" ? "no_plan" : "pages",
        );
        return;
      }
      setError(err instanceof ApiError ? err.message : err.message || "Upload failed");
    },
  });

  const onPick = () => inputRef.current?.click();
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    mutation.mutate(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) mutation.mutate(file);
  };

  return (
    <div className="flex w-full flex-col items-stretch gap-2 sm:max-w-xs">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={onChange}
      />
      <button
        type="button"
        onClick={onPick}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        disabled={mutation.isPending}
        className={`group relative flex h-auto items-center gap-3 rounded-2xl border-[1.5px] border-dashed px-5 py-4 text-left transition-all duration-200 disabled:opacity-60 ${
          dragging
            ? "border-[color:var(--color-saffron)] bg-[color:var(--color-saffron)]/10"
            : "border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)]/60 hover:-translate-y-[1px] hover:border-[color:var(--color-saffron-deep)] hover:bg-[color:var(--color-paper-2)]"
        }`}
      >
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-[color:var(--color-saffron)]/15 text-[color:var(--color-saffron-deep)] transition-transform group-hover:scale-105">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V4" />
            <path d="m6 10 6-6 6 6" />
            <path d="M5 20h14" />
          </svg>
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-[family-name:var(--font-display)] text-base font-semibold leading-tight text-[color:var(--color-ink)]">
            {mutation.isPending ? "Uploading…" : "Add a book"}
          </p>
          <p className="text-xs text-[color:var(--color-ink-soft)]">
            Drop a PDF or EPUB here
          </p>
        </div>
      </button>

      {active && (
        <div className="rounded-xl border border-[color:var(--color-border)] bg-white/70 p-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-medium text-[color:var(--color-ink)]">
              {active.filename}
            </span>
            <span className="shrink-0 tabular-nums text-[color:var(--color-ink-soft)]">
              {Math.round((active.loaded / Math.max(1, active.total)) * 100)}%
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--color-paper-3)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[color:var(--color-saffron)] to-[color:var(--color-saffron-deep)] transition-[width] duration-150"
              style={{ width: `${active.total ? (active.loaded / active.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-[color:var(--color-destructive)]/30 bg-[color:var(--color-destructive)]/8 px-3 py-2 text-xs text-[color:var(--color-destructive)]">
          {error}
        </p>
      )}
    </div>
  );
}
