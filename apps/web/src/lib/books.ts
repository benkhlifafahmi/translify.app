import { api, ApiError } from "./api";

export type BookStatus = "uploaded" | "processing" | "ready" | "failed";
export type BookFormat = "pdf" | "epub";

export interface Book {
  id: string;
  title: string;
  author: string | null;
  source_language: string | null;
  format: BookFormat;
  file_size_bytes: number;
  page_count: number | null;
  status: BookStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface UploadUrlResponse {
  upload_id: string;
  upload_url: string;
  file_key: string;
  format: BookFormat;
  expires_in_seconds: number;
}

export async function listBooks(): Promise<Book[]> {
  return api<Book[]>("/books");
}

export async function getBook(id: string): Promise<Book> {
  return api<Book>(`/books/${id}`);
}

export async function deleteBook(id: string): Promise<void> {
  await api(`/books/${id}`, { method: "DELETE" });
}

export async function requestUploadUrl(file: File): Promise<UploadUrlResponse> {
  return api<UploadUrlResponse>("/books/upload-url", {
    method: "POST",
    body: {
      filename: file.name,
      content_type: file.type || guessContentType(file.name),
      size_bytes: file.size,
    },
  });
}

export async function finalizeUpload(opts: {
  uploadId: string;
  title?: string;
  author?: string;
  sourceLanguage?: string;
}): Promise<Book> {
  return api<Book>("/books/finalize", {
    method: "POST",
    body: {
      upload_id: opts.uploadId,
      title: opts.title ?? null,
      author: opts.author ?? null,
      source_language: opts.sourceLanguage ?? null,
    },
  });
}

/**
 * Upload a file via PUT to a presigned URL. Calls back with bytes-uploaded
 * progress for UI display.
 */
export function uploadToPresigned(
  url: string,
  file: File,
  onProgress?: (bytesUploaded: number, total: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    if (file.type) xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded, e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new ApiError(xhr.status, xhr.responseText, "Upload failed"));
    };
    xhr.onerror = () => reject(new ApiError(0, null, "Network error during upload"));
    xhr.onabort = () => reject(new ApiError(0, null, "Upload aborted"));
    xhr.send(file);
  });
}

export async function uploadBook(
  file: File,
  opts: {
    title?: string;
    author?: string;
    sourceLanguage?: string;
    onProgress?: (loaded: number, total: number) => void;
  } = {},
): Promise<Book> {
  const reservation = await requestUploadUrl(file);
  await uploadToPresigned(reservation.upload_url, file, opts.onProgress);
  return finalizeUpload({
    uploadId: reservation.upload_id,
    title: opts.title,
    author: opts.author,
    sourceLanguage: opts.sourceLanguage,
  });
}

function guessContentType(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".epub")) return "application/epub+zip";
  return "application/octet-stream";
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
