/**
 * Seed catalogue + clone-on-open client.
 *
 * The shelf step of /join lists books from this catalogue. Tapping one
 * clones it into the user's library (or returns their existing clone if
 * they've opened it before).
 */
import { api } from "./api";
import type { Book, BookStatus } from "./books";

export interface Seed {
  slug: string;
  title: string;
  author: string;
  source_language: string;
  topics: string[];
  attribution: string;
  /** User's personal clone if they've already opened this seed; null otherwise. */
  clone_id: string | null;
  clone_status: BookStatus | null;
}

export async function listSeeds(): Promise<Seed[]> {
  return api<Seed[]>("/seeds");
}

/** Idempotent — returns the user's existing clone if they've already opened
 *  this seed, otherwise materialises a new one (Book row + chunk copy). */
export async function cloneSeed(slug: string): Promise<Book> {
  return api<Book>(`/seeds/${encodeURIComponent(slug)}/clone`, {
    method: "POST",
  });
}
