"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getBook, type Book } from "@/lib/books";
import { getToken } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { YouTubePlayer, type YouTubePlayerHandle } from "@/components/youtube-player";
import { ChatPanel } from "@/components/chat-panel";
import { QuizPanel } from "@/components/quiz-panel";
import { StudyGuide } from "@/components/study-guide";
import { formatDuration, youtubeVideoId } from "@/lib/media";
import type { Citation } from "@/lib/chats";
import { Lumi } from "@/components/lumi/lumi";
import { TranslifyIcon } from "@/components/translify-mark";

type Tab = "chat" | "quiz";

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("chat");
  const playerRef = useRef<YouTubePlayerHandle | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (mounted && !getToken()) router.replace("/login");
  }, [mounted, router]);

  const { data: book, isLoading, isError } = useQuery<Book>({
    queryKey: ["book", id],
    queryFn: () => getBook(id),
    enabled: mounted && !!getToken(),
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === "uploaded" || s === "processing" ? 3000 : false;
    },
  });

  // Chat citations on a media book carry a transcript timestamp — seek the
  // player to it and bring the player into view (matters on mobile, where the
  // chat panel sits below the video).
  // Seek the player and bring it into view (matters on mobile, where the
  // player sits above the scrolling content). Shared by chat citations and
  // study-guide section timelines.
  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds);
    document
      .getElementById("watch-player")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const onCitationClick = useCallback(
    (c: Citation) => {
      if (c.time_start_seconds == null) return;
      seekTo(c.time_start_seconds);
    },
    [seekTo],
  );

  if (!mounted || isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-[color:var(--color-ink-soft)]">{t("book.opening")}</p>
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
          ← {t("book.backToLibrary")}
        </Link>
        <p className="mt-6 text-[color:var(--color-destructive)]">{t("book.notFound")}</p>
      </main>
    );
  }

  const ready = book.status === "ready";
  const videoId = youtubeVideoId(book.source_url);

  return (
    <main className="flex min-h-[100dvh] flex-col bg-[color:var(--color-paper)] lg:h-[100dvh] lg:min-h-0 lg:overflow-hidden">
      <WatchHeader book={book} />

      {!ready ? (
        <NotReadyState book={book} />
      ) : (
        <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-4 px-4 py-4 lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-12 lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-x-6 lg:gap-y-4 lg:overflow-hidden lg:px-6">
          {/* Video — top of the right rail (first on mobile so it's reachable). */}
          <div
            id="watch-player"
            className="order-1 lg:order-none lg:col-span-4 lg:col-start-9 lg:row-start-1"
          >
            {videoId ? (
              <YouTubePlayer ref={playerRef} videoId={videoId} />
            ) : (
              <div className="grid aspect-video w-full place-items-center rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-paper-2)] text-sm text-[color:var(--color-ink-soft)]">
                {t("watch.noVideo")}
              </div>
            )}
            <p className="mt-2 px-1 text-[0.7rem] leading-relaxed text-[color:var(--color-ink-soft)]">
              {t("media.captionsNote")}
            </p>
          </div>

          {/* Study material — the focus: wide left column, scrolls on its own. */}
          <div className="order-2 lg:order-none lg:col-span-8 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:min-h-0 lg:overflow-y-auto lg:pr-2">
            <StudyGuide bookId={id} onSeek={seekTo} />
          </div>

          {/* Chat / Quiz — under the video on the right rail (own scroll). */}
          <aside className="order-3 flex h-[70vh] flex-col overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-paper-2)]/30 lg:order-none lg:col-span-4 lg:col-start-9 lg:row-start-2 lg:h-auto lg:min-h-0">
            <div className="flex shrink-0 items-center gap-1 border-b border-[color:var(--color-border)] bg-[color:var(--color-paper)]/60 px-3 py-2">
              <WatchTab active={tab === "chat"} onClick={() => setTab("chat")} icon="💬" label={t("app.tab.chat")} />
              <WatchTab active={tab === "quiz"} onClick={() => setTab("quiz")} icon="✦" label={t("watch.tab.quiz")} />
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              {tab === "chat" ? (
                <ChatPanel
                  bookId={id}
                  selectedTranslationId={null}
                  onCitationClick={onCitationClick}
                />
              ) : (
                <QuizPanel bookId={id} selectedTranslationId={null} />
              )}
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}

function WatchHeader({ book }: { book: Book }) {
  const { t } = useI18n();
  return (
    <header className="relative z-50 flex shrink-0 items-center gap-2 border-b border-[color:var(--color-border)] bg-[color:var(--color-paper)]/80 px-3 py-2.5 backdrop-blur sm:gap-3 sm:px-4 sm:py-3 lg:px-7">
      <Link
        href="/library"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-[1.5px] border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)] text-[color:var(--color-ink-soft)] transition-colors hover:bg-[color:var(--color-paper-2)] hover:text-[color:var(--color-ink)] sm:h-9 sm:w-9"
        aria-label={t("book.backToLibrary")}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>
      </Link>

      <Link
        href="/library"
        aria-label="Translify"
        className="flex shrink-0 items-center gap-2 font-[family-name:var(--font-display)] font-semibold tracking-tight text-[color:var(--color-ink)]"
      >
        <TranslifyIcon size={32} />
        <span className="hidden text-lg lg:inline">Translify</span>
      </Link>

      <span aria-hidden className="hidden h-7 w-px shrink-0 bg-[color:var(--color-border)] lg:block" />

      <div className="min-w-0 flex-1">
        <h1 className="truncate font-[family-name:var(--font-display)] text-base font-semibold leading-tight tracking-tight sm:text-lg">
          {book.title}
        </h1>
        <p className="truncate text-[0.7rem] text-[color:var(--color-ink-soft)] sm:text-xs">
          {book.author && <>{book.author} · </>}
          <span className="inline-flex items-center gap-1">
            <span aria-hidden>▶</span> {t("watch.youtubeLabel")}
          </span>
          {book.duration_seconds != null && <> · {formatDuration(book.duration_seconds)}</>}
        </p>
      </div>

      {book.source_url && (
        <a
          href={book.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden h-9 shrink-0 items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-paper)] px-3.5 text-xs font-semibold text-[color:var(--color-ink-soft)] transition-all hover:-translate-y-[1px] hover:border-[color:var(--color-coral-deep)] hover:text-[color:var(--color-coral-deep)] sm:inline-flex"
        >
          {t("watch.openOnYouTube")}
        </a>
      )}
    </header>
  );
}

function WatchTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
        active
          ? "bg-[color:var(--color-sage)]/15 text-[color:var(--color-sage-deep)] ring-1 ring-[color:var(--color-sage)]/30"
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
  const { t } = useI18n();
  if (book.status === "failed") {
    return (
      <div className="mx-auto mt-12 max-w-xl px-6">
        <div className="card-paper relative flex flex-col items-center gap-4 rounded-3xl border-[color:var(--color-destructive)]/30 p-8 text-center">
          <Lumi state="sad" size={140} animate />
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl font-semibold text-[color:var(--color-ink)]">
              {t("media.failed.title")}
            </p>
            {book.error_message && (
              <p className="mt-2 text-sm text-[color:var(--color-destructive)]/80">
                {book.error_message}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="mx-auto mt-12 max-w-xl px-6 text-center">
      <div className="mx-auto mb-2 inline-block">
        <Lumi state="translating" size={160} animate />
      </div>
      <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
        {t("media.processing.title")}
      </h2>
      <p className="mt-2 text-sm text-[color:var(--color-ink-soft)]">
        {t("media.processing.body")}
      </p>
    </div>
  );
}
