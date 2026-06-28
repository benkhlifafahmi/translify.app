"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createFolder,
  deleteFolder as deleteFolderApi,
  updateFolder,
  uploadFolderCover,
  folderColorToken,
  FOLDER_COLORS,
  FOLDER_EMOJI_SUGGESTIONS,
  type Folder,
  type FolderColor,
} from "@/lib/folders";

/**
 * Modal/sheet for creating or editing a folder.
 *
 * Drives all four sides of folder personalisation: name, colour token,
 * emoji, and optional cover image. The cover upload uses the same
 * presigned-URL pattern as books — the browser PUTs the file directly
 * to MinIO, then we PATCH the folder with the resulting key.
 */
interface Props {
  /** Existing folder to edit, or null for the "create new" mode. */
  folder: Folder | null;
  open: boolean;
  onClose: () => void;
  /** Called after a successful save so the parent can refetch the list. */
  onSaved?: (folder: Folder) => void;
  /** Called after a successful delete. */
  onDeleted?: (folderId: string) => void;
}

export function FolderEditor({ folder, open, onClose, onSaved, onDeleted }: Props) {
  const queryClient = useQueryClient();

  const [name, setName] = useState(folder?.name ?? "");
  const [color, setColor] = useState<FolderColor | string>(folder?.color ?? "saffron");
  const [emoji, setEmoji] = useState(folder?.emoji ?? "📚");
  const [coverUrl, setCoverUrl] = useState<string | null>(folder?.cover_url ?? null);
  const [coverKey, setCoverKey] = useState<string | null>(folder?.cover_image_key ?? null);
  const [err, setErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset fields whenever the modal opens with a different folder (or none).
  useEffect(() => {
    if (!open) return;
    setName(folder?.name ?? "");
    setColor(folder?.color ?? "saffron");
    setEmoji(folder?.emoji ?? "📚");
    setCoverUrl(folder?.cover_url ?? null);
    setCoverKey(folder?.cover_image_key ?? null);
    setErr(null);
  }, [open, folder]);

  // Lock body scroll while the modal is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const save = useMutation({
    mutationFn: async (): Promise<Folder> => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Folder name can't be empty.");
      if (folder) {
        return updateFolder(folder.id, {
          name: trimmed,
          color,
          emoji: emoji.trim() || "📚",
        });
      }
      return createFolder({ name: trimmed, color: color as FolderColor, emoji: emoji.trim() || "📚" });
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      onSaved?.(saved);
      onClose();
    },
    onError: (e: unknown) => setErr(e instanceof Error ? e.message : "Couldn't save."),
  });

  const uploadCover = useMutation({
    mutationFn: async (file: File) => {
      if (!folder) {
        // Need a folder id to attach the cover to — save first.
        throw new Error("Save the folder before adding a cover.");
      }
      return uploadFolderCover(folder.id, file);
    },
    onSuccess: (updated) => {
      setCoverUrl(updated.cover_url);
      setCoverKey(updated.cover_image_key);
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
    onError: (e: unknown) =>
      setErr(e instanceof Error ? e.message : "Cover upload failed."),
  });

  const clearCover = useMutation({
    mutationFn: async () => {
      if (!folder) return null;
      return updateFolder(folder.id, { cover_image_key: "" });
    },
    onSuccess: () => {
      setCoverUrl(null);
      setCoverKey(null);
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  const deleteThis = useMutation({
    mutationFn: async () => {
      if (!folder) return;
      await deleteFolderApi(folder.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      if (folder) onDeleted?.(folder.id);
      onClose();
    },
  });

  if (!open) return null;

  const token = folderColorToken(color);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={folder ? "Edit folder" : "Create folder"}
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6"
      style={{ background: "rgba(20,16,8,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl"
        style={{
          background: "white",
          border: "2px solid var(--color-border-strong)",
          boxShadow: "0 24px 60px -20px rgba(20,16,8,0.45), 0 8px 0 rgba(74,60,30,0.10)",
          animation: "paywall-rise 0.32s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Live preview header — shows what the folder will look like. */}
        <div
          className="relative h-32 px-6"
          style={{
            background: coverUrl
              ? `center/cover no-repeat url("${coverUrl}"), ${token.gradient}`
              : token.gradient,
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.25) 100%)" }}
          />
          <div className="relative flex h-full items-end pb-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/85 text-2xl shadow-md backdrop-blur-sm">
              {emoji || "📚"}
            </span>
            <span className="ml-3 max-w-[18ch] truncate text-balance font-[family-name:var(--font-display)] text-[1.15rem] font-semibold text-white drop-shadow-md">
              {name.trim() || "Untitled folder"}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute end-3 top-3 grid h-9 w-9 place-items-center rounded-full transition-all active:scale-90"
            style={{ background: "white", color: "var(--color-ink)", boxShadow: "0 2px 0 rgba(74,60,30,0.18)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 px-6 pb-7 pt-5">
          {/* Name */}
          <label className="block">
            <span className="mb-1 block text-[0.74rem] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--color-ink-soft)" }}>
              Name
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder="e.g. Currently reading, Philosophy, French books"
              autoFocus
              className="h-11 w-full rounded-xl border-2 px-3 text-[0.96rem] outline-none transition-all"
              style={{
                borderColor: "var(--color-border-strong)",
                background: "white",
                color: "var(--color-ink)",
              }}
            />
          </label>

          {/* Color palette */}
          <div>
            <p className="mb-2 text-[0.74rem] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--color-ink-soft)" }}>
              Colour
            </p>
            <div className="flex flex-wrap gap-2">
              {FOLDER_COLORS.map((c) => {
                const t = folderColorToken(c);
                const selected = color === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={c}
                    className="h-9 w-9 rounded-full transition-all active:scale-90"
                    style={{
                      background: t.gradient,
                      boxShadow: selected
                        ? `0 0 0 3px white, 0 0 0 5px ${t.ring}`
                        : "0 2px 0 rgba(74,60,30,0.12)",
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Emoji */}
          <div>
            <p className="mb-2 text-[0.74rem] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--color-ink-soft)" }}>
              Icon
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value.slice(0, 4))}
                maxLength={4}
                placeholder="📚"
                className="h-11 w-16 rounded-xl border-2 text-center text-[1.4rem] outline-none"
                style={{ borderColor: "var(--color-border-strong)", background: "white" }}
              />
              <div className="flex flex-1 flex-wrap gap-1.5 rounded-xl border-2 p-2" style={{ borderColor: "var(--color-border)", background: "var(--color-paper)" }}>
                {FOLDER_EMOJI_SUGGESTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className="grid h-7 w-7 place-items-center rounded-lg text-[1rem] transition-all active:scale-90"
                    style={{
                      background: emoji === e ? "white" : "transparent",
                      boxShadow: emoji === e ? "0 2px 0 rgba(74,60,30,0.12)" : "none",
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cover image */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[0.74rem] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--color-ink-soft)" }}>
                Cover image (optional)
              </p>
              {coverKey && (
                <button
                  type="button"
                  onClick={() => clearCover.mutate()}
                  disabled={clearCover.isPending}
                  className="text-[0.78rem] font-semibold underline underline-offset-4"
                  style={{ color: "var(--color-ink-soft)" }}
                >
                  Remove
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadCover.mutate(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!folder || uploadCover.isPending}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed text-[0.86rem] font-semibold transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                borderColor: "var(--color-border-strong)",
                background: "var(--color-paper)",
                color: "var(--color-ink-soft)",
              }}
            >
              {uploadCover.isPending ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Uploading…
                </>
              ) : coverUrl ? (
                "Replace cover"
              ) : (
                "Upload an image (PNG / JPG / WebP)"
              )}
            </button>
            {!folder && (
              <p className="mt-1 text-[0.72rem]" style={{ color: "var(--color-ink-soft)" }}>
                Save the folder first, then come back to add a cover.
              </p>
            )}
          </div>

          {err && (
            <div className="rounded-xl px-3 py-2 text-[0.84rem] font-medium" style={{ background: "rgba(220,38,38,0.07)", color: "#B91C1C", border: "1.5px solid rgba(220,38,38,0.22)" }}>
              {err}
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center gap-2">
            {folder && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete "${folder.name}"? Books inside will return to the Unsorted shelf.`)) {
                    deleteThis.mutate();
                  }
                }}
                disabled={deleteThis.isPending}
                className="h-12 rounded-xl px-4 text-[0.86rem] font-semibold transition-all active:translate-y-1 disabled:opacity-50"
                style={{ background: "rgba(220,38,38,0.08)", color: "#B91C1C", border: "1.5px solid rgba(220,38,38,0.22)" }}
              >
                {deleteThis.isPending ? "Deleting…" : "Delete"}
              </button>
            )}
            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={save.isPending || !name.trim()}
              className="ml-auto h-12 rounded-xl px-6 font-[family-name:var(--font-display)] text-[0.96rem] font-bold text-white transition-all active:translate-y-1 disabled:opacity-50"
              style={{
                background: "linear-gradient(to bottom,#EDB86A,#D09040)",
                boxShadow: "0 4px 0 rgba(152,96,24,0.50)",
              }}
            >
              {save.isPending ? "Saving…" : folder ? "Save" : "Create folder"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
