import { api } from "./api";
import type { Book } from "./books";
import type { StudySection } from "./study-guide";

export interface ShareInfo {
  shared: boolean;
  slug: string | null;
  url: string | null;
}

export interface SharedWorkspace {
  title: string;
  author: string | null;
  source_url: string | null;
  duration_seconds: number | null;
  sections: StudySection[];
}

/** Owner: current share status for a book. */
export async function getShare(bookId: string): Promise<ShareInfo> {
  return api<ShareInfo>(`/books/${bookId}/share`);
}

/** Owner: create (or fetch existing) public share link. */
export async function createShare(bookId: string): Promise<ShareInfo> {
  return api<ShareInfo>(`/books/${bookId}/share`, { method: "POST", body: {} });
}

/** Owner: revoke the share. */
export async function revokeShare(bookId: string): Promise<void> {
  await api(`/books/${bookId}/share`, { method: "DELETE" });
}

/** Owner: email the share link to people (creates the share if needed). */
export async function inviteToShare(bookId: string, emails: string[]): Promise<ShareInfo> {
  return api<ShareInfo>(`/books/${bookId}/share/invite`, {
    method: "POST",
    body: { emails },
  });
}

/** Public (no auth): the shared workspace by slug. */
export async function getSharedWorkspace(slug: string): Promise<SharedWorkspace> {
  return api<SharedWorkspace>(`/shared/${encodeURIComponent(slug)}`);
}

/** Save a shared course into the current user's library (auth required). */
export async function saveSharedCopy(slug: string): Promise<Book> {
  return api<Book>(`/shared/${encodeURIComponent(slug)}/save`, {
    method: "POST",
    body: {},
  });
}
