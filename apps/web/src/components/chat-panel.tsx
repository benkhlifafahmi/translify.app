"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import {
  createBookChat,
  deleteChat,
  listBookChats,
  listMessages,
  sendMessage,
  type Chat,
  type ChatMessage,
  type Citation,
} from "@/lib/chats";
import { ApiError } from "@/lib/api";
import { parseQuotaError } from "@/lib/quota";
import { UpgradeNudge } from "@/components/upgrade-nudge";

interface Props {
  bookId: string;
  selectedTranslationId: string | null;
  onCitationClick?: (citation: Citation) => void;
}

const STARTERS = [
  "Summarize this book in 3 sentences",
  "What's the main idea so far?",
  "Quiz me on this chapter",
  "Explain page 12 like I'm 10",
];

export function ChatPanel({ bookId, selectedTranslationId, onCitationClick }: Props) {
  const qc = useQueryClient();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { data: chats } = useQuery<Chat[]>({
    queryKey: ["chats", bookId],
    queryFn: () => listBookChats(bookId),
  });

  const newChat = useMutation({
    mutationFn: () => createBookChat(bookId),
    onSuccess: (chat) => {
      qc.invalidateQueries({ queryKey: ["chats", bookId] });
      setActiveChatId(chat.id);
    },
  });

  const removeChat = useMutation({
    mutationFn: (id: string) => deleteChat(id),
    onSuccess: (_, id) => {
      qc.setQueryData<Chat[]>(["chats", bookId], (old) =>
        old ? old.filter((c) => c.id !== id) : old,
      );
      qc.removeQueries({ queryKey: ["chat-messages", id] });
      if (id === activeChatId) {
        setActiveChatId(null);
      }
    },
  });

  useEffect(() => {
    if (activeChatId || !chats) return;
    if (chats.length > 0) {
      setActiveChatId(chats[0].id);
    } else if (!newChat.isPending && !newChat.isError) {
      newChat.mutate();
    }
  }, [chats, activeChatId, newChat]);

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["chat-messages", activeChatId],
    queryFn: () => listMessages(activeChatId!),
    enabled: !!activeChatId,
  });

  const send = useMutation({
    mutationFn: async (content: string) => {
      if (!activeChatId) throw new Error("No active chat");
      return sendMessage(activeChatId, content, selectedTranslationId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-messages", activeChatId] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, send.isPending]);

  const onSend = (override?: string) => {
    const content = (override ?? draft).trim();
    if (!content || send.isPending) return;
    setDraft("");
    send.mutate(content);
  };

  const sortedChats = chats ?? [];
  const activeChat = sortedChats.find((c) => c.id === activeChatId) ?? null;

  const onDeleteActive = () => {
    if (!activeChat) return;
    const label = activeChat.title || "this chat";
    if (!confirm(`Delete "${label}"? This can't be undone.`)) return;
    removeChat.mutate(activeChat.id);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-1.5 border-b border-[color:var(--color-border)] bg-[color:var(--color-paper)]/60 px-3 py-2">
        <div className="relative min-w-0 flex-1">
          <select
            value={activeChatId ?? ""}
            onChange={(e) => setActiveChatId(e.target.value || null)}
            disabled={sortedChats.length === 0}
            className="w-full appearance-none truncate rounded-full border-[1.5px] border-[color:var(--color-border)] bg-white/70 py-1.5 pl-3.5 pr-8 text-xs font-semibold text-[color:var(--color-ink)] focus:border-[color:var(--color-saffron)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-saffron)]/30"
          >
            {sortedChats.length === 0 && <option value="">No chats yet</option>}
            {sortedChats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title || "New chat"}
              </option>
            ))}
          </select>
          <svg
            aria-hidden
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[color:var(--color-ink-soft)]"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
        <button
          type="button"
          onClick={() => newChat.mutate()}
          disabled={newChat.isPending}
          title="Start a new chat"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-[1.5px] border-[color:var(--color-border)] bg-white/60 text-[color:var(--color-ink-soft)] transition-colors hover:border-[color:var(--color-sage)] hover:bg-[color:var(--color-sage)]/10 hover:text-[color:var(--color-sage-deep)] disabled:opacity-50"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onDeleteActive}
          disabled={!activeChat || removeChat.isPending}
          title="Delete current chat"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-[1.5px] border-[color:var(--color-border)] bg-white/60 text-[color:var(--color-ink-soft)] transition-colors hover:border-[color:var(--color-destructive)] hover:bg-[color:var(--color-destructive)]/10 hover:text-[color:var(--color-destructive)] disabled:opacity-40"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {newChat.isError && (() => {
          const quota = parseQuotaError(newChat.error);
          return quota ? (
            <div className="mx-auto max-w-sm">
              <UpgradeNudge error={quota} kind="chat" />
            </div>
          ) : null;
        })()}
        {messages.length === 0 && !send.isPending && !newChat.isError ? (
          <EmptyChatState onPick={(text) => onSend(text)} />
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                onCitationClick={onCitationClick}
              />
            ))}
            {send.isPending && <ThinkingBubble />}
            {send.isError &&
              (() => {
                const quota = parseQuotaError(send.error);
                if (quota) {
                  return <UpgradeNudge error={quota} kind="chat" />;
                }
                return (
                  <p className="rounded-lg bg-[color:var(--color-destructive)]/10 px-3 py-2 text-xs text-[color:var(--color-destructive)]">
                    {send.error instanceof ApiError
                      ? send.error.message
                      : (send.error as Error).message || "Send failed"}
                  </p>
                );
              })()}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-[color:var(--color-border)] bg-[color:var(--color-paper)]/70 p-3">
        <div className="flex items-end gap-2 rounded-2xl border-[1.5px] border-[color:var(--color-border)] bg-white/80 p-2 transition-colors focus-within:border-[color:var(--color-saffron)] focus-within:ring-2 focus-within:ring-[color:var(--color-saffron)]/25">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            rows={2}
            placeholder="Ask anything about the book…"
            className="flex-1 resize-none bg-transparent px-2 py-1 text-sm focus:outline-none disabled:opacity-50"
            disabled={!activeChatId || send.isPending}
          />
          <Button
            size="sm"
            variant="sage"
            onClick={() => onSend()}
            disabled={!activeChatId || send.isPending || !draft.trim()}
            className="rounded-full"
          >
            Ask →
          </Button>
        </div>
        <p className="mt-1.5 px-1 text-[0.65rem] text-[color:var(--color-ink-soft)]">
          ⏎ to send · ⇧⏎ for a new line
        </p>
      </div>
    </div>
  );
}

function EmptyChatState({ onPick }: { onPick: (s: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-2 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-3xl bg-[color:var(--color-sage)]/15 text-[color:var(--color-sage-deep)]">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <h4 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
        Ask about the book.
      </h4>
      <p className="mb-5 mt-1.5 max-w-xs text-sm leading-relaxed text-[color:var(--color-ink-soft)]">
        Every answer points back to the exact passage — click the page chip to
        see it in the book.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {STARTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="rounded-full border-[1.5px] border-[color:var(--color-border)] bg-white/60 px-3 py-1.5 text-xs font-medium text-[color:var(--color-ink-soft)] transition-all hover:-translate-y-[1px] hover:border-[color:var(--color-sage)] hover:bg-[color:var(--color-sage)]/10 hover:text-[color:var(--color-sage-deep)]"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl rounded-bl-md bg-[color:var(--color-paper-3)]/70 px-4 py-3 text-sm text-[color:var(--color-ink-soft)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--color-sage)]" style={{ animationDelay: "0ms" }} />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--color-sage)]" style={{ animationDelay: "150ms" }} />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--color-sage)]" style={{ animationDelay: "300ms" }} />
          <span className="ml-2 italic">flipping pages…</span>
        </span>
      </div>
    </div>
  );
}

function AssistantMarkdown({ content }: { content: string }) {
  return (
    <div className="prose-chat text-sm leading-relaxed text-[color:var(--color-ink)]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-2 whitespace-pre-wrap last:mb-0">{children}</p>
          ),
          h1: ({ children }) => (
            <h1 className="mb-2 mt-3 font-[family-name:var(--font-display)] text-base font-semibold first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-3 font-[family-name:var(--font-display)] text-sm font-semibold first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-1 mt-2 font-[family-name:var(--font-display)] text-sm font-semibold first:mt-0">{children}</h3>
          ),
          ul: ({ children }) => (
            <ul className="mb-2 list-disc pl-5 last:mb-0 marker:text-[color:var(--color-saffron-deep)]">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2 list-decimal pl-5 last:mb-0 marker:text-[color:var(--color-saffron-deep)] marker:font-semibold">{children}</ol>
          ),
          li: ({ children }) => <li className="mb-0.5">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[color:var(--color-sage-deep)] underline decoration-[color:var(--color-sage)]/50 underline-offset-2 hover:decoration-[color:var(--color-sage)]"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-[color:var(--color-ink)]">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="font-[family-name:var(--font-display)] italic">{children}</em>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-2 rounded-r-md border-l-2 border-[color:var(--color-saffron)] bg-[color:var(--color-saffron)]/8 px-3 py-1.5 italic last:mb-0">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const isBlock = (className ?? "").includes("language-");
            if (isBlock) {
              return (
                <code className={`block ${className ?? ""}`} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code {...props}>{children}</code>
            );
          },
          pre: ({ children }) => <pre className="mb-2 last:mb-0">{children}</pre>,
          table: ({ children }) => (
            <div className="mb-2 overflow-x-auto rounded-lg border border-[color:var(--color-border)] last:mb-0">
              <table className="w-full border-collapse text-xs">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-[color:var(--color-border)] bg-[color:var(--color-paper-3)]/60 px-2.5 py-1.5 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-[color:var(--color-border)] px-2.5 py-1.5">{children}</td>
          ),
          hr: () => <hr className="my-3 border-[color:var(--color-border)]" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function MessageBubble({
  message,
  onCitationClick,
}: {
  message: ChatMessage;
  onCitationClick?: (citation: Citation) => void;
}) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-float-in`}>
      <div
        className={
          isUser
            ? "max-w-[85%] rounded-2xl rounded-br-md bg-[color:var(--color-ink)] px-4 py-2.5 text-sm text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.15)]"
            : "max-w-[85%] rounded-2xl rounded-bl-md bg-white/80 px-4 py-3 text-sm text-[color:var(--color-ink)] shadow-[0_1px_0_rgba(74,60,30,0.04),0_8px_18px_-12px_rgba(74,60,30,0.18)] ring-1 ring-[color:var(--color-border)]"
        }
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <AssistantMarkdown content={message.content} />
        )}
        {!isUser && message.citations && message.citations.length > 0 && (
          <details className="group/details mt-3 -mx-1" open>
            <summary className="flex cursor-pointer list-none items-center gap-1.5 px-1 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]">
              <svg
                className="transition-transform group-open/details:rotate-90"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
              {message.citations.length} {message.citations.length === 1 ? "source" : "sources"}
            </summary>
            <ol className="mt-2 flex flex-col gap-1.5 px-1">
              {message.citations.map((c, i) => (
                <li key={c.chunk_id}>
                  <button
                    type="button"
                    onClick={() => onCitationClick?.(c)}
                    disabled={!onCitationClick || c.page_start == null}
                    className="group flex w-full items-start gap-2 rounded-xl border-[1.5px] border-[color:var(--color-border)] bg-[color:var(--color-paper-2)]/40 p-2.5 text-left transition-all hover:-translate-y-[1px] hover:border-[color:var(--color-saffron)] hover:bg-[color:var(--color-saffron)]/8 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[color:var(--color-saffron)]/20 text-[0.65rem] font-bold text-[color:var(--color-saffron-deep)]">
                      {i + 1}
                    </span>
                    <span className="flex-1 min-w-0">
                      {c.page_start != null && (
                        <span className="block text-[0.7rem] font-semibold uppercase tracking-wide text-[color:var(--color-ink-soft)] group-hover:text-[color:var(--color-saffron-deep)]">
                          page {c.page_start}
                          {c.page_end && c.page_end !== c.page_start
                            ? `–${c.page_end}`
                            : ""}{" "}
                          → tap to find
                        </span>
                      )}
                      <span className="mt-1 block text-xs italic leading-relaxed text-[color:var(--color-ink-soft)]">
                        “{c.snippet}”
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </details>
        )}
      </div>
    </div>
  );
}
