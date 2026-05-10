import { api } from "./api";

export type HighlightColor = "yellow" | "green" | "blue" | "pink";

export interface Highlight {
  id: string;
  book_id: string;
  page: number;
  text: string;
  color: HighlightColor;
  note: string | null;
  ai_question: string | null;
  ai_answer: string | null;
  created_at: string;
  updated_at: string;
}

export async function listAllHighlights(): Promise<Highlight[]> {
  return api<Highlight[]>("/highlights");
}

export async function listBookHighlights(bookId: string): Promise<Highlight[]> {
  return api<Highlight[]>(`/books/${bookId}/highlights`);
}

export async function createHighlight(
  bookId: string,
  payload: {
    page: number;
    text: string;
    color?: HighlightColor;
    note?: string | null;
  },
): Promise<Highlight> {
  return api<Highlight>(`/books/${bookId}/highlights`, {
    method: "POST",
    body: {
      page: payload.page,
      text: payload.text,
      color: payload.color ?? "yellow",
      note: payload.note ?? null,
    },
  });
}

export async function updateHighlight(
  id: string,
  payload: { note?: string | null; color?: HighlightColor },
): Promise<Highlight> {
  return api<Highlight>(`/highlights/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteHighlight(id: string): Promise<void> {
  await api(`/highlights/${id}`, { method: "DELETE" });
}

export async function askAiAboutHighlight(
  id: string,
  question?: string | null,
): Promise<Highlight> {
  return api<Highlight>(`/highlights/${id}/ask-ai`, {
    method: "POST",
    body: { question: question ?? null },
  });
}

export const HIGHLIGHT_COLOR_CLASS: Record<HighlightColor, string> = {
  yellow: "bg-[#FDE68A]/70",
  green: "bg-[#BBF7D0]/70",
  blue: "bg-[#BFDBFE]/70",
  pink: "bg-[#FBCFE8]/70",
};
