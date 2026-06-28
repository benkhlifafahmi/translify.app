/**
 * Library folders — typed client for the personalised shelf feature.
 *
 * Folders carry a colour token (mapped to the palette in the UI), an emoji,
 * an optional uploaded cover image, and a position for manual ordering.
 * They're the "boxes" the user files books into.
 */
import { api } from "./api";

export type FolderColor =
  | "saffron" | "sage" | "plum" | "coral"
  | "ink" | "ocean" | "rose" | "honey";

/** Palette tokens — kept in sync with the FolderCard renderer. */
export const FOLDER_COLORS: FolderColor[] = [
  "saffron", "sage", "plum", "coral",
  "ink", "ocean", "rose", "honey",
];

/** Curated emoji shortcuts — used by the folder editor's quick-pick row.
 *  Users can type any emoji into the input; this is just inspiration. */
export const FOLDER_EMOJI_SUGGESTIONS = [
  "📚", "📖", "📕", "📗", "📘", "📙",
  "✨", "🌿", "🌲", "🌸", "🏛️", "🎨",
  "🧠", "💡", "🔬", "⚔️", "💼", "🌊",
  "☕", "🪐", "🎭", "📜", "🪶", "🕯️",
] as const;

export type ColorToken = {
  gradient: string;
  ring: string;
  ink: string;
  badgeBg: string;
};

/** Translate a folder colour token into a gradient + ring + ink set. Shared by
 *  the folder chips, the folder editor, and anywhere a folder shows its colour. */
export function folderColorToken(color: string): ColorToken {
  const t: Record<string, ColorToken> = {
    saffron: { gradient: "linear-gradient(135deg,#F4D6A2,#D09040)", ring: "#D09040", ink: "var(--color-saffron-deep)", badgeBg: "rgba(224,164,80,0.18)" },
    sage:    { gradient: "linear-gradient(135deg,#C9DCC8,#5A8C5A)", ring: "#5A8C5A", ink: "var(--color-sage-deep)",    badgeBg: "rgba(123,161,124,0.18)" },
    plum:    { gradient: "linear-gradient(135deg,#D6CFE5,#6B5B95)", ring: "#6B5B95", ink: "var(--color-plum)",          badgeBg: "rgba(107,91,149,0.18)" },
    coral:   { gradient: "linear-gradient(135deg,#F2BAB1,#C0604A)", ring: "#C0604A", ink: "var(--color-coral-deep)",    badgeBg: "rgba(226,120,108,0.18)" },
    ink:     { gradient: "linear-gradient(135deg,#5C5C70,#20283A)", ring: "#20283A", ink: "#20283A",                    badgeBg: "rgba(32,40,58,0.18)" },
    ocean:   { gradient: "linear-gradient(135deg,#A6CBD8,#3F6F86)", ring: "#3F6F86", ink: "#2F546A",                    badgeBg: "rgba(63,111,134,0.18)" },
    rose:    { gradient: "linear-gradient(135deg,#F8C8D6,#B85775)", ring: "#B85775", ink: "#9A3F5C",                    badgeBg: "rgba(184,87,117,0.18)" },
    honey:   { gradient: "linear-gradient(135deg,#FBE08C,#C99325)", ring: "#C99325", ink: "#8E6710",                    badgeBg: "rgba(201,147,37,0.20)" },
  };
  return t[color] ?? t.saffron;
}

export interface Folder {
  id: string;
  name: string;
  color: FolderColor | string;
  emoji: string;
  cover_image_key: string | null;
  /** Presigned read URL for the cover, valid ~24h. Null if no cover set. */
  cover_url: string | null;
  position: number;
  book_count: number;
  created_at: string;
  updated_at: string;
}

export async function listFolders(): Promise<Folder[]> {
  return api<Folder[]>("/folders");
}

export async function createFolder(input: {
  name: string;
  color?: FolderColor;
  emoji?: string;
}): Promise<Folder> {
  return api<Folder>("/folders", { method: "POST", body: input });
}

export async function updateFolder(
  id: string,
  patch: {
    name?: string;
    color?: FolderColor | string;
    emoji?: string;
    /** Pass "" to clear the cover; undefined to leave it as-is. */
    cover_image_key?: string;
  },
): Promise<Folder> {
  return api<Folder>(`/folders/${id}`, { method: "PATCH", body: patch });
}

export async function deleteFolder(id: string): Promise<void> {
  await api(`/folders/${id}`, { method: "DELETE" });
}

export async function reorderFolders(
  items: { id: string; position: number }[],
): Promise<void> {
  await api("/folders/reorder", { method: "POST", body: { items } });
}

interface CoverUrlResponse {
  upload_url: string;
  file_key: string;
  expires_in_seconds: number;
}

/**
 * Cover image upload — two-step (presign + PUT).
 *
 * The browser uploads the file straight to MinIO via the presigned URL,
 * then we PATCH the folder with the resulting key. Same pattern as book
 * uploads.
 */
export async function uploadFolderCover(
  folderId: string,
  file: File,
): Promise<Folder> {
  const presign = await api<CoverUrlResponse>(
    `/folders/${folderId}/cover-url`,
    {
      method: "POST",
      body: {
        content_type: file.type || "image/png",
        size_bytes: file.size,
      },
    },
  );

  const putRes = await fetch(presign.upload_url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "image/png" },
  });
  if (!putRes.ok) {
    throw new Error(`Cover upload failed: ${putRes.status}`);
  }

  return await updateFolder(folderId, { cover_image_key: presign.file_key });
}
