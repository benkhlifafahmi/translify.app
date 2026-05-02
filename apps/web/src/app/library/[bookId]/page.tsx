"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getBook, type Book } from "@/lib/books";
import {
  getBookFileUrl,
  getTranslationFileUrl,
} from "@/lib/translations";
import { getToken } from "@/lib/api";
import { PdfViewer } from "@/components/pdf-viewer-lazy";
import { TranslatePanel } from "@/components/translate-panel";
import { ChatPanel } from "@/components/chat-panel";
import { QuizPanel } from "@/components/quiz-panel";
import type { Citation } from "@/lib/chats";
import type { Highlight } from "@/components/pdf-viewer";

type RightTab = "chat" | "quiz";

export default function BookDetailPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = use(params);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedTranslationId, setSelectedTranslationId] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>("chat");
  const [highlight, setHighlight] = useState<Highlight | null>(null);

  const onCitationClick = (citation: Citation) => {
    if (citation.page_start == null) return;
    setHighlight({
      page: citation.page_start,
      snippet: citation.snippet,
      nonce: Date.now(),
    });
  };

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && !getToken()) router.replace("/login");
  }, [mounted, router]);

  const { data: book, isLoading, isError } = useQuery<Book>({
    queryKey: ["book", bookId],
    queryFn: () => getBook(bookId),
    enabled: mounted && !!getToken(),
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === "uploaded" || s === "processing" ? 3000 : false;
    },
  });

  const ready = book?.status === "ready";

  const fileUrlQuery = useQuery({
    queryKey: ["file-url", bookId, selectedTranslationId],
    queryFn: async () => {
      if (selectedTranslationId) {
        return (await getTranslationFileUrl(selectedTranslationId)).url;
      }
      return (await getBookFileUrl(bookId)).url;
    },
    enabled: ready,
    staleTime: 50 * 60 * 1000,
  });

  if (!mounted || isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-[color:var(--color-ink-soft)]">Opening book…</p>
      </main>
    );
  }

  if (isError || !book) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href="/library"
          className="text-sm font-semibold text-[color:var(--color-ink-soft)] underline decoration-[color:var(--color-saffron)]"
        >
          ← Back to library
        </Link>
        <p className="mt-6 text-[color:var(--color-destructive)]">Book not found.</p>
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col bg-[color:var(--color-paper)]">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[color:var(--color-border)] bg-[color:var(--color-paper)]/80 px-5 py-3 backdrop-blur lg:px-7">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/library"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-[1.5px] border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)] text-[color:var(--color-ink-soft)] transition-colors hover:bg-[color:var(--color-paper-2)] hover:text-[color:var(--color-ink)]"
            aria-label="Back to library"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-[family-name:var(--font-display)] text-lg font-semibold leading-tight tracking-tight">
              {book.title}
            </h1>
            <p className="truncate text-xs text-[color:var(--color-ink-soft)]">
              {book.author && <>{book.author} · </>}
              {book.format.toUpperCase()}
              {book.source_language && <> · {book.source_language.toUpperCase()}</>}
              {book.page_count != null && <> · {book.page_count} pages</>}
            </p>
          </div>
        </div>
      </header>

      {!ready ? (
        <NotReadyState book={book} />
      ) : (
        <div className="grid flex-1 grid-cols-12 overflow-hidden">
          <aside className="col-span-12 flex flex-col overflow-y-auto border-r border-[color:var(--color-border)] bg-[color:var(--color-paper-2)]/40 lg:col-span-3">
            <TranslatePanel
              bookId={bookId}
              sourceLanguage={book.source_language}
              selectedTranslationId={selectedTranslationId}
              onSelectTranslation={setSelectedTranslationId}
            />
          </aside>

          <section className="col-span-12 flex flex-col overflow-hidden border-r border-[color:var(--color-border)] lg:col-span-5">
            {book.format === "pdf" ? (
              <PdfViewer
                fileUrl={fileUrlQuery.data ?? null}
                emptyMessage={
                  fileUrlQuery.isLoading ? "Preparing your book…" : "No file URL"
                }
                highlight={highlight}
              />
            ) : (
              <EpubFallback url={fileUrlQuery.data} />
            )}
          </section>

          <aside className="col-span-12 flex flex-col overflow-hidden bg-[color:var(--color-paper-2)]/30 lg:col-span-4">
            <div className="flex shrink-0 items-center gap-1 border-b border-[color:var(--color-border)] bg-[color:var(--color-paper)]/60 px-3 py-2">
              <TabPill
                active={rightTab === "chat"}
                onClick={() => setRightTab("chat")}
                tone="sage"
                icon="💬"
                label="Chat"
              />
              <TabPill
                active={rightTab === "quiz"}
                onClick={() => setRightTab("quiz")}
                tone="coral"
                icon="★"
                label="Quiz"
              />
            </div>
            <div className="flex-1 overflow-hidden">
              {rightTab === "chat" ? (
                <ChatPanel
                  bookId={bookId}
                  selectedTranslationId={selectedTranslationId}
                  onCitationClick={onCitationClick}
                />
              ) : (
                <QuizPanel
                  bookId={bookId}
                  selectedTranslationId={selectedTranslationId}
                />
              )}
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}

function TabPill({
  active,
  onClick,
  tone,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  tone: "sage" | "coral";
  icon: string;
  label: string;
}) {
  const activeClass =
    tone === "sage"
      ? "bg-[color:var(--color-sage)]/15 text-[color:var(--color-sage-deep)] ring-1 ring-[color:var(--color-sage)]/30"
      : "bg-[color:var(--color-coral)]/15 text-[color:var(--color-coral-deep)] ring-1 ring-[color:var(--color-coral)]/30";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
        active
          ? activeClass
          : "text-[color:var(--color-ink-soft)] hover:bg-[color:var(--color-paper-3)]/50 hover:text-[color:var(--color-ink)]"
      }`}
    >
      <span aria-hidden className="text-base">
        {icon}
      </span>
      {label}
    </button>
  );
}

function NotReadyState({ book }: { book: Book }) {
  if (book.status === "failed") {
    return (
      <div className="mx-auto mt-16 max-w-xl px-6">
        <div className="card-paper rounded-2xl border-[color:var(--color-destructive)]/40 p-6 text-sm text-[color:var(--color-destructive)]">
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
            We hit a snag.
          </p>
          {book.error_message && (
            <p className="mt-1 opacity-80">{book.error_message}</p>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="mx-auto mt-16 max-w-xl px-6 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-[color:var(--color-saffron)]/15 text-[color:var(--color-saffron-deep)]">
        <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 1 1-6.2-8.5" />
        </svg>
      </div>
      <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
        Reading your book…
      </h2>
      <p className="mt-2 text-sm text-[color:var(--color-ink-soft)]">
        We're noting every page so chat and quizzes work great. Big books take a
        few minutes.
      </p>
    </div>
  );
}

function EpubFallback({ url }: { url: string | undefined }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="font-[family-name:var(--font-display)] text-lg text-[color:var(--color-ink)]">
        EPUB preview is on the way.
      </p>
      <p className="max-w-xs text-sm text-[color:var(--color-ink-soft)]">
        Until we render EPUB inline, you can open it in a new tab.
      </p>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-[color:var(--color-ink)] px-5 py-2 text-sm font-semibold text-[color:var(--color-paper)]"
        >
          Open in new tab
        </a>
      )}
    </div>
  );
}
