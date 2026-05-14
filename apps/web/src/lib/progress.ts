import { api } from "./api";

export interface BookProgress {
  current_page: number | null;
  current_cfi: string | null;
  reading_time_seconds: number;
  last_read_at: string;
  updated_at: string;
}

export interface BookProgressListItem {
  book_id: string;
  current_page: number | null;
  current_cfi: string | null;
  reading_time_seconds: number;
  last_read_at: string;
}

export interface BookProgressUpdate {
  current_page?: number | null;
  current_cfi?: string | null;
  reading_time_delta_seconds?: number;
}

export async function getBookProgress(bookId: string): Promise<BookProgress> {
  return api<BookProgress>(`/books/${bookId}/progress`);
}

export async function putBookProgress(
  bookId: string,
  body: BookProgressUpdate,
): Promise<BookProgress> {
  return api<BookProgress>(`/books/${bookId}/progress`, {
    method: "PUT",
    body,
  });
}

export async function listBookProgress(): Promise<BookProgressListItem[]> {
  return api<BookProgressListItem[]>("/books/progress");
}
