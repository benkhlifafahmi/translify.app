import { api } from "./api";

export type TranslationStatus = "queued" | "in_progress" | "ready" | "failed";

export interface Translation {
  id: string;
  book_id: string;
  target_language: string;
  provider: "deepl" | "anthropic";
  status: TranslationStatus;
  progress_pct: number;
  output_format: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface FileUrlResponse {
  url: string;
  expires_in_seconds: number;
}

export async function getBookFileUrl(bookId: string): Promise<FileUrlResponse> {
  return api<FileUrlResponse>(`/books/${bookId}/file-url`);
}

export async function listTranslations(bookId: string): Promise<Translation[]> {
  return api<Translation[]>(`/books/${bookId}/translations`);
}

export async function createTranslation(
  bookId: string,
  targetLanguage: string,
): Promise<Translation> {
  return api<Translation>(`/books/${bookId}/translations`, {
    method: "POST",
    body: { target_language: targetLanguage },
  });
}

export async function getTranslation(translationId: string): Promise<Translation> {
  return api<Translation>(`/translations/${translationId}`);
}

export async function retryTranslation(translationId: string): Promise<Translation> {
  return api<Translation>(`/translations/${translationId}/retry`, {
    method: "POST",
  });
}

export async function getTranslationFileUrl(
  translationId: string,
): Promise<FileUrlResponse> {
  return api<FileUrlResponse>(`/translations/${translationId}/file-url`);
}
