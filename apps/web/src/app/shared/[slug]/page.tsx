"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { getToken } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { TranslifyMark } from "@/components/translify-mark";
import { YouTubePlayer, type YouTubePlayerHandle } from "@/components/youtube-player";
import { formatDuration, youtubeVideoId } from "@/lib/media";
import { getSharedWorkspace, saveSharedCopy, type SharedWorkspace } from "@/lib/shares";
import type { Book } from "@/lib/books";
import type { StudySection } from "@/lib/study-guide";

export default function SharedWorkspacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const playerRef = useRef<YouTubePlayerHandle | null>(null);

  useEffect(() => setMounted(true), []);

  const { data, isLoading, isError } = useQuery<SharedWorkspace>({
    queryKey: ["shared", slug],
    queryFn: () => getSharedWorkspace(slug),
    retry: false,
  });

  const save = useMutation<Book, Error, void>({
    mutationFn: () => saveSharedCopy(slug),
    onSuccess: (book) => router.push(`/watch/${book.id}`),
  });

  const onSave = () => {
    if (!getToken()) {
      router.push("/register");
      return;
    }
    save.mutate();
  };

  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds);
    document.getElementById("shared-player")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  if (!mounted || isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-[color:var(--color-ink-soft)]">
        {t("shared.loading")}
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-20 text-center">
        <TranslifyMark href="/" size={40} />
        <p className="mt-8 text-[color:var(--color-ink)]">{t("shared.notFound")}</p>
        <Link href="/" className="mt-4 inline-block text-sm font-semibold text-[color:var(--color-sage-deep)] underline">
          {t("shared.cta")} →
        </Link>
      </main>
    );
  }

  const videoId = youtubeVideoId(data.source_url);

  return (
    <main className="min-h-[100dvh] bg-[color:var(--color-paper)]">
      <header className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-[color:var(--color-border)] bg-[color:var(--color-paper)]/85 px-4 py-3 backdrop-blur lg:px-8">
        <TranslifyMark href="/" size={32} wordmarkClassName="text-lg" />
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full bg-[color:var(--color-paper-3)]/70 px-2.5 py-1 text-[0.7rem] font-semibold text-[color:var(--color-ink-soft)] sm:inline">
            {t("shared.viewOnlyBadge")}
          </span>
          <Button variant="accent" size="sm" onClick={onSave} disabled={save.isPending}>
            {save.isPending ? t("shared.saving") : t("shared.save")}
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8 lg:py-8">
        <div id="shared-player" className="scroll-mt-20">
          {videoId ? (
            <YouTubePlayer ref={playerRef} videoId={videoId} />
          ) : (
            <div className="grid aspect-video w-full place-items-center rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-paper-2)] text-sm text-[color:var(--color-ink-soft)]">
              {t("watch.noVideo")}
            </div>
          )}
        </div>

        <div className="mt-5">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
            {data.title}
          </h1>
          <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
            {data.author && <>{data.author} · </>}
            <span className="inline-flex items-center gap-1"><span aria-hidden>▶</span> {t("watch.youtubeLabel")}</span>
            {data.duration_seconds != null && <> · {formatDuration(data.duration_seconds)}</>}
          </p>
        </div>

        <section className="mt-8">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
            {t("studyGuide.title")}
          </h2>
          {data.sections.length === 0 ? (
            <p className="text-sm text-[color:var(--color-ink-soft)]">{t("media.captionsNote")}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {data.sections.map((s) => (
                <SharedSection key={s.id} section={s} onSeek={seekTo} t={t} />
              ))}
            </div>
          )}
        </section>

        <div className="mt-10 rounded-2xl border-[1.5px] border-[color:var(--color-saffron)] bg-[color:var(--color-saffron)]/5 p-6 text-center">
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold">{t("shared.cta")}</p>
          <Button variant="accent" size="lg" className="mt-3" onClick={onSave} disabled={save.isPending}>
            {save.isPending ? t("shared.saving") : t("shared.save")}
          </Button>
        </div>
      </div>
    </main>
  );
}

function SharedSection({
  section,
  onSeek,
  t,
}: {
  section: StudySection;
  onSeek: (s: number) => void;
  t: (k: string) => string;
}) {
  const start = section.time_start_seconds;
  return (
    <div className="card-paper overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4">
        {start != null && (
          <button
            type="button"
            onClick={() => onSeek(start)}
            title={t("studyGuide.watchSection")}
            aria-label={t("studyGuide.watchSection")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--color-coral)] text-white shadow-[0_2px_0_rgba(140,50,40,0.35)] transition-transform hover:scale-105 active:scale-95"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}
        <div className="min-w-0">
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold leading-tight tracking-tight">
            {section.title}
          </h3>
          {start != null && (
            <span className="mt-0.5 block text-[0.7rem] font-semibold tabular-nums text-[color:var(--color-ink-soft)]">
              {formatDuration(start)}
              {section.time_end_seconds != null && <>–{formatDuration(section.time_end_seconds)}</>}
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-[color:var(--color-border)] px-5 py-4">
        <div className="text-[0.95rem] leading-relaxed text-[color:var(--color-ink)] [&_li]:mb-1 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_strong]:font-semibold [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.summary}</ReactMarkdown>
        </div>

        {section.key_points.length > 0 && (
          <div className="mt-4 rounded-xl bg-[color:var(--color-sage)]/8 p-4">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-sage-deep)]">
              {t("studyGuide.keyPoints")}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {section.key_points.map((kp, i) => (
                <li key={i}>{kp}</li>
              ))}
            </ul>
          </div>
        )}

        {section.exercises.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {section.exercises.map((ex) => (
              <li
                key={ex.id}
                className="rounded-2xl border-[1.5px] border-[color:var(--color-border)] bg-white/60 p-4 text-sm font-medium text-[color:var(--color-ink)]"
              >
                <span className="mr-2 font-bold text-[color:var(--color-coral-deep)]">?</span>
                {ex.question}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
