import { api } from "./api";
import type { Book } from "./books";

/**
 * Import a YouTube video as a study-able media book, built from its captions.
 * Returns an ``uploaded`` book the caller polls (via getBook) until ``ready``,
 * exactly like a document upload.
 */
export async function importYouTube(
  url: string,
  sourceLanguage?: string | null,
): Promise<Book> {
  return api<Book>("/media/youtube", {
    method: "POST",
    body: { url, source_language: sourceLanguage ?? null },
  });
}

/** Extract an 11-char YouTube video ID from a watch / youtu.be / embed URL. */
export function youtubeVideoId(urlOrId: string | null | undefined): string | null {
  const raw = (urlOrId ?? "").trim();
  if (!raw) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;
  try {
    const u = new URL(raw.includes("//") ? raw : `https://${raw}`);
    const host = u.hostname.replace(/^www\./, "").replace(/^m\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0] ?? "";
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (u.pathname === "/watch") {
        const v = u.searchParams.get("v") ?? "";
        return /^[A-Za-z0-9_-]{11}$/.test(v) ? v : null;
      }
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length >= 2 && ["embed", "shorts", "v", "live"].includes(parts[0])) {
        return /^[A-Za-z0-9_-]{11}$/.test(parts[1]) ? parts[1] : null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/** Seconds → "M:SS" or "H:MM:SS". */
export function formatDuration(totalSeconds: number | null | undefined): string {
  const s = Math.max(0, Math.floor(totalSeconds ?? 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}
