import { api } from "./api";

export type MessageRole = "user" | "assistant" | "system";

export interface Citation {
  chunk_id: string;
  page_start: number | null;
  page_end: number | null;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  role: MessageRole;
  content: string;
  citations: Citation[] | null;
  created_at: string;
}

export interface Chat {
  id: string;
  book_id: string | null;
  scope: "book" | "library";
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface SendMessageResponse {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
}

export async function listBookChats(bookId: string): Promise<Chat[]> {
  return api<Chat[]>(`/books/${bookId}/chats`);
}

export async function createBookChat(bookId: string): Promise<Chat> {
  return api<Chat>(`/books/${bookId}/chats`, { method: "POST" });
}

export async function deleteChat(chatId: string): Promise<void> {
  await api(`/chats/${chatId}`, { method: "DELETE" });
}

export async function listMessages(chatId: string): Promise<ChatMessage[]> {
  return api<ChatMessage[]>(`/chats/${chatId}/messages`);
}

export async function sendMessage(
  chatId: string,
  content: string,
  translationId?: string | null,
): Promise<SendMessageResponse> {
  return api<SendMessageResponse>(`/chats/${chatId}/messages`, {
    method: "POST",
    body: {
      content,
      translation_id: translationId ?? null,
    },
  });
}
