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
