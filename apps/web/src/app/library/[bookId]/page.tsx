"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBook, type Book } from "@/lib/books";
import {
  getBookFileUrl,
  getTranslationFileUrl,
} from "@/lib/translations";
import { getToken } from "@/lib/api";
import { PdfViewer } from "@/components/pdf-viewer-lazy";
import { EpubViewer } from "@/components/epub-viewer-lazy";
import { TranslifyIcon } from "@/components/translify-mark";
import { useI18n } from "@/lib/i18n";
import { TranslatePanel } from "@/components/translate-panel";
import { ChatPanel } from "@/components/chat-panel";
import { QuizPanel } from "@/components/quiz-panel";
import {
  HighlightsPanel,
  type OpenHighlightState,
} from "@/components/highlights-panel";
import { TrialBanner } from "@/components/trial-banner";
import type { Citation } from "@/lib/chats";
import {
  createHighlight,
  listBookHighlights,
  type Highlight as SavedHighlightT,
} from "@/lib/highlights";
import { useReadingTracker } from "@/lib/reading-tracker";
import {
  ReaderGardenVignette,
  type ReaderGardenVignetteHandle,
} from "@/components/garden/reader-garden-vignette";
import { Lumi } from "@/components/lumi/lumi";
import {
  MobileGardenTab,
  type MobileGardenTabHandle,
} from "@/components/garden/mobile-garden-tab";
import { MobileGardenPanel } from "@/components/garden/mobile-garden-panel";
import type {
  Highlight,
  HighlightAction,
  SavedHighlight,
} from "@/components/pdf-viewer";
import { PaywallModal } from "@/components/paywall-modal";
import { EmailGateModal } from "@/components/email-gate-modal";
import { getSubscription, isUnlimited, type Subscription } from "@/lib/billing";

type RightTab = "chat" | "quiz" | "notes";
type MobilePanel = null | "translate" | "chat" | "notes" | "quiz" | "garden";

export default function BookDetailPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [selectedTranslationId, setSelectedTranslationId] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>("chat");
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [openHighlight, setOpenHighlight] = useState<OpenHighlightState | null>(null);
  const [goToPage, setGoToPage] = useState<{ page: number; nonce: number } | null>(null);

  // Mobile state — which drawer is open. Null = none (viewer is full screen).
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);

  const onCitationClick = (citation: Citation) => {
    if (citation.page_start == null) return;
    setHighlight({
      page: citation.page_start,
      snippet: citation.snippet,
      nonce: Date.now(),
    });
    // On mobile, close the chat drawer so the citation flash is visible.
    setMobilePanel(null);
  };

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && !getToken()) router.replace("/login");
  }, [mounted, router]);

  // Garden tracker — counts furthest-page-reached and flushes a "read" event
  // to /gardens/{bookId}/events when the user passes a threshold or leaves.
  const { markReached } = useReadingTracker(bookId);

  // Floating "the farmer is doing something" vignette — desktop bottom-left
  // tile and the mobile bottom-tab garden chip both animate from the same
  // activity signals. We hold refs so the page-reached / highlight-save
  // handlers can trigger them without re-rendering on every event.
  const vignetteRef = useRef<ReaderGardenVignetteHandle | null>(null);
  const mobileGardenRef = useRef<MobileGardenTabHandle | null>(null);
  const furthestPageRef = useRef(0);

  const playGardenActivity = useCallback(
    (kind: "water" | "plant", caption?: string) => {
      vignetteRef.current?.play(kind, caption);
      mobileGardenRef.current?.play(kind);
    },
    [],
  );

  // Plan info — used to gate seed-book pages on Free.
  const { data: sub } = useQuery<Subscription>({
    queryKey: ["subscription"],
    queryFn: getSubscription,
    staleTime: 60_000,
    enabled: mounted && !!getToken(),
  });

  // Paywall state — set by onPageReached when a Free reader crosses the cap.
  const [paywallPage, setPaywallPage] = useState<number | null>(null);

  // Anonymous-user gate state. Action drives the headline copy in the modal
  // ("Chat with the book?" vs "Quiz me?" vs "Translate?"). Open via the
  // onEmailRequired callback that ChatPanel/QuizPanel surface on a 402.
  const [emailGate, setEmailGate] = useState<{ action: string } | null>(null);
  const openEmailGate = useCallback((action: string) => {
    setEmailGate({ action });
    return true;
  }, []);

  // The paywall fires when a Free reader on a seed book crosses
  // ``sub.quota.seed_book_page_cap``. Paid plans get UNLIMITED and never trip.
  const seedCap = sub?.quota.seed_book_page_cap ?? Number.POSITIVE_INFINITY;
  const isCapBound = !!sub && !isUnlimited(seedCap);

  // The Book query has to precede onPageReached because the callback closes
  // over ``book.is_seed`` for the paywall check.
  const { data: book, isLoading, isError } = useQuery<Book>({
    queryKey: ["book", bookId],
    queryFn: () => getBook(bookId),
    enabled: mounted && !!getToken(),
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === "uploaded" || s === "processing" ? 3000 : false;
    },
  });

  const onPageReached = useCallback(
    (page: number) => {
      markReached(page);
      if (page > furthestPageRef.current) {
        furthestPageRef.current = page;
        playGardenActivity("water", `+ page ${page}`);
      }
      // Free + seed book + over cap → paywall. Paid plans pass straight through.
      if (isCapBound && book?.is_seed && page > seedCap) {
        setPaywallPage((cur) => cur ?? page);
      }
    },
    [markReached, playGardenActivity, isCapBound, book?.is_seed, seedCap],
  );

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

  const { data: highlights = [] } = useQuery<SavedHighlightT[]>({
    queryKey: ["highlights", bookId],
    queryFn: () => listBookHighlights(bookId),
    enabled: ready,
  });

  useEffect(() => {
    const target = searchParams.get("highlight");
    if (!target || !ready || !highlights.length) return;
    const h = highlights.find((x) => x.id === target);
    if (!h) return;
    setRightTab("notes");
    setOpenHighlight({ id: h.id, nonce: Date.now() });
    setGoToPage({ page: h.page, nonce: Date.now() });
    // On mobile, surface the Notes drawer.
    setMobilePanel("notes");
  }, [searchParams, ready, highlights]);

  const createHl = useMutation({
    mutationFn: async (input: {
      action: HighlightAction;
      page: number;
      text: string;
      cfi?: string;
    }) =>
      createHighlight(bookId, {
        page: input.page,
        text: input.text,
        position_cfi: input.cfi ?? null,
      }),
    onSuccess: (saved, vars) => {
      qc.setQueryData<SavedHighlightT[]>(["highlights", bookId], (old) =>
        old ? [...old, saved] : [saved],
      );
      qc.invalidateQueries({ queryKey: ["highlights", bookId] });
      qc.invalidateQueries({ queryKey: ["highlights", "all"] });
      setRightTab("notes");
      setOpenHighlight({
        id: saved.id,
        autoEditNote: vars.action === "note",
        autoAskAi: vars.action === "ask-ai",
        nonce: Date.now(),
      });
      // On mobile, open the Notes drawer so the user lands on the new card.
      setMobilePanel("notes");
      // Plant a sapling in the garden vignette to celebrate the highlight —
      // fires on both the desktop tile and the mobile tab.
      playGardenActivity("plant", "+ new leaf");
    },
  });

  const onSelectionAction = (
    action: HighlightAction,
    page: number,
    text: string,
    cfi?: string,
  ) => {
    createHl.mutate({ action, page, text, cfi });
  };

  const savedHighlightsForViewer: SavedHighlight[] = highlights.map((h) => ({
    id: h.id,
    page: h.page,
    text: h.text,
    color: h.color,
    hasNote: !!h.note,
    cfi: h.position_cfi ?? undefined,
  }));

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

  // The viewer surface (PDF or EPUB) — shared across desktop + mobile.
  const viewerNode = book.format === "pdf" ? (
    <PdfViewer
      fileUrl={fileUrlQuery.data ?? null}
      emptyMessage={
        fileUrlQuery.isLoading ? "Preparing your book…" : "No file URL"
      }
      highlight={highlight}
      savedHighlights={savedHighlightsForViewer}
      onSelectionAction={onSelectionAction}
      onClickSavedHighlight={(id) => {
        setRightTab("notes");
        setOpenHighlight({ id, nonce: Date.now() });
        setMobilePanel("notes");
      }}
      goToPage={goToPage}
      onPageReached={onPageReached}
    />
  ) : (
    <EpubViewer
      fileUrl={fileUrlQuery.data ?? null}
      emptyMessage={
        fileUrlQuery.isLoading ? "Preparing your book…" : "No file URL"
      }
      highlight={highlight}
      savedHighlights={savedHighlightsForViewer}
      onSelectionAction={onSelectionAction}
      onClickSavedHighlight={(id) => {
        setRightTab("notes");
        setOpenHighlight({ id, nonce: Date.now() });
        setMobilePanel("notes");
      }}
      goToPage={goToPage}
      onPageReached={onPageReached}
    />
  );

  const translatePanelNode = (
    <TranslatePanel
      bookId={bookId}
      sourceLanguage={book.source_language}
      selectedTranslationId={selectedTranslationId}
      onSelectTranslation={(id) => {
        setSelectedTranslationId(id);
        // On mobile, close the drawer once the user picks a translation —
        // the act of choosing implies "go read it now."
        setMobilePanel(null);
      }}
    />
  );

  const chatPanelNode = (
    <ChatPanel
      bookId={bookId}
      selectedTranslationId={selectedTranslationId}
      onCitationClick={onCitationClick}
      onEmailRequired={openEmailGate}
    />
  );

  const notesPanelNode = (
    <HighlightsPanel
      bookId={bookId}
      open={openHighlight}
      onConsumed={() =>
        setOpenHighlight((prev) =>
          prev ? { ...prev, autoAskAi: false, autoEditNote: false } : prev,
        )
      }
      onJumpToPage={(page) => {
        setGoToPage({ page, nonce: Date.now() });
        // Close the drawer on mobile so the user sees the page.
        setMobilePanel(null);
      }}
    />
  );

  const quizPanelNode = (
    <QuizPanel
      bookId={bookId}
      selectedTranslationId={selectedTranslationId}
      onEmailRequired={openEmailGate}
    />
  );

  return (
    <main className="flex h-[100dvh] flex-col bg-[color:var(--color-paper)]">
      <TrialBanner />

      <EmailGateModal
        open={emailGate !== null}
        action={emailGate?.action ?? "save"}
        onClose={() => setEmailGate(null)}
      />

      <PaywallModal
        open={paywallPage !== null}
        page={paywallPage ?? undefined}
        cap={seedCap}
        bookTitle={book.title}
        onClose={() => setPaywallPage(null)}
      />

      <BookHeader book={book} />

      {!ready ? (
        <NotReadyState book={book} />
      ) : (
        <>
          {/* Desktop layout — 3 columns at lg+, hidden on mobile */}
          <div className="hidden flex-1 overflow-hidden lg:grid lg:grid-cols-12">
            <aside className="col-span-3 flex flex-col overflow-y-auto border-r border-[color:var(--color-border)] bg-[color:var(--color-paper-2)]/40">
              {translatePanelNode}
            </aside>

            <section className="col-span-5 flex flex-col overflow-hidden border-r border-[color:var(--color-border)]">
              {viewerNode}
            </section>

            <aside className="col-span-4 flex flex-col overflow-hidden bg-[color:var(--color-paper-2)]/30">
              <div className="flex shrink-0 items-center gap-1 border-b border-[color:var(--color-border)] bg-[color:var(--color-paper)]/60 px-3 py-2">
                <TabPill
                  active={rightTab === "chat"}
                  onClick={() => setRightTab("chat")}
                  tone="sage"
                  icon="💬"
                  label={t("app.tab.chat")}
                />
                <TabPill
                  active={rightTab === "notes"}
                  onClick={() => setRightTab("notes")}
                  tone="saffron"
                  icon="✎"
                  label={highlights.length > 0 ? `${t("app.tab.notes")} (${highlights.length})` : t("app.tab.notes")}
                />
                <TabPill
                  active={rightTab === "quiz"}
                  onClick={() => setRightTab("quiz")}
                  tone="coral"
                  icon="★"
                  label={t("app.tab.quiz")}
                />
              </div>
              <div className="flex-1 overflow-hidden">
                {rightTab === "chat" ? chatPanelNode
                  : rightTab === "notes" ? notesPanelNode
                    : quizPanelNode}
              </div>
            </aside>
          </div>

          {/* Mobile layout — viewer fullscreen + paper-tab drawers */}
          <div className="relative flex flex-1 flex-col overflow-hidden lg:hidden">
            <section className="flex flex-1 flex-col overflow-hidden">
              {viewerNode}
            </section>

            {/* Paper-tab bottom strip — sits flush with the bottom edge. The
                Garden tab is a live mini-vignette that animates on activity,
                rendered inline rather than as a flat icon. */}
            <PaperTabBar
              counts={{ notes: highlights.length }}
              onOpen={setMobilePanel}
              gardenSlot={
                <MobileGardenTab
                  ref={mobileGardenRef}
                  bookId={bookId}
                  label={t("app.tab.garden") || "Garden"}
                  onOpen={() => setMobilePanel("garden")}
                />
              }
            />
          </div>

          {/* Mobile drawer overlay */}
          <MobileDrawer
            open={mobilePanel !== null}
            onClose={() => setMobilePanel(null)}
            title={mobilePanel ? t(`app.tab.${mobilePanel}`) : ""}
            tone={mobilePanel ? PANEL_TONES[mobilePanel] : "sage"}
          >
            {mobilePanel === "translate" && translatePanelNode}
            {mobilePanel === "chat"      && chatPanelNode}
            {mobilePanel === "notes"     && notesPanelNode}
            {mobilePanel === "quiz"      && quizPanelNode}
            {mobilePanel === "garden"    && <MobileGardenPanel bookId={bookId} />}
          </MobileDrawer>

          {/* Floating garden vignette — desktop-only. The farmer comes out
              to water the plant whenever a new page is reached, and plants
              a sapling whenever a highlight is saved. See
              reader-garden-vignette.tsx for the animation choreography. */}
          <ReaderGardenVignette ref={vignetteRef} bookId={bookId} />
        </>
      )}
    </main>
  );
}

const PANEL_TONES: Record<Exclude<MobilePanel, null>, "sage" | "saffron" | "coral" | "plum"> = {
  translate: "plum",
  chat: "sage",
  notes: "saffron",
  quiz: "coral",
  garden: "sage",
};

// ───────────────────────── Book header ─────────────────────────

function BookHeader({ book }: { book: Book }) {
  const { t } = useI18n();
  return (
    <header className="flex shrink-0 items-center gap-2 border-b border-[color:var(--color-border)] bg-[color:var(--color-paper)]/80 px-3 py-2.5 backdrop-blur sm:gap-3 sm:py-3 sm:px-4 lg:px-7">
      {/* Back button — always visible. Slightly smaller on mobile. */}
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

      {/* Translify mark — always visible, always clickable. On mobile, just
          the icon. On desktop, icon + wordmark + divider before the book
          title. This keeps the brand present even when the user is deep
          inside a book, which the previous header lost. */}
      <Link
        href="/library"
        aria-label="Translify"
        className="flex shrink-0 items-center gap-2 font-[family-name:var(--font-display)] font-semibold tracking-tight text-[color:var(--color-ink)]"
      >
        <TranslifyIcon size={32} />
        <span className="hidden text-lg lg:inline">Translify</span>
      </Link>

      {/* Divider before the book title on desktop only. On mobile space is
          too tight; the icon alone is the brand cue. */}
      <span
        aria-hidden
        className="hidden h-7 w-px shrink-0 bg-[color:var(--color-border)] lg:block"
      />

      <div className="min-w-0 flex-1">
        <h1 className="truncate font-[family-name:var(--font-display)] text-base font-semibold leading-tight tracking-tight sm:text-lg">
          {book.title}
        </h1>
        <p className="truncate text-[0.7rem] text-[color:var(--color-ink-soft)] sm:text-xs">
          {book.author && <>{book.author} · </>}
          {book.format.toUpperCase()}
          {book.source_language && <> · {book.source_language.toUpperCase()}</>}
          {book.page_count != null && <> · {book.page_count}p</>}
        </p>
      </div>

      {/* Garden chip — quick step out to this book's reading garden. Kept
          compact on mobile (just the leaf), full label from sm up. */}
      <Link
        href={`/garden/${book.id}`}
        aria-label="Open this book's garden"
        title="Open this book's garden"
        className="ml-auto inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-paper)] px-2.5 text-xs font-semibold text-[color:var(--color-ink-soft)] transition-all hover:-translate-y-[1px] hover:border-[color:var(--color-sage)] hover:text-[color:var(--color-sage-deep)] sm:h-9 sm:px-3.5"
      >
        <span aria-hidden>🌿</span>
        <span className="hidden sm:inline">Garden</span>
      </Link>
    </header>
  );
}

// ───────────────────────── Desktop tab pill ─────────────────────────

function TabPill({
  active,
  onClick,
  tone,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  tone: "sage" | "coral" | "saffron";
  icon: string;
  label: string;
}) {
  const activeClass =
    tone === "sage"
      ? "bg-[color:var(--color-sage)]/15 text-[color:var(--color-sage-deep)] ring-1 ring-[color:var(--color-sage)]/30"
      : tone === "saffron"
        ? "bg-[color:var(--color-saffron)]/15 text-[color:var(--color-saffron-deep)] ring-1 ring-[color:var(--color-saffron)]/30"
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

// ───────────────────────── Mobile: paper tab bar ─────────────────────────

function PaperTabBar({
  counts,
  onOpen,
  gardenSlot,
}: {
  counts: { notes: number };
  onOpen: (panel: MobilePanel) => void;
  /** Live mini-vignette tab rendered next to Quiz. Passed in from the page
   *  so it can hold an animation ref triggered by reading activity. */
  gardenSlot?: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <nav
      aria-label="Reading tools"
      className="relative shrink-0 border-t border-[color:var(--color-border)] bg-[color:var(--color-paper)]/85 backdrop-blur"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom), 0px)",
        backgroundImage:
          "radial-gradient(at 0% 0%, rgba(212, 194, 156, 0.18) 0, transparent 60%)",
      }}
    >
      {/* The page-edge: a thin saffron strip echoing a folded-page corner */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-px left-1/2 h-px w-32 -translate-x-1/2 bg-gradient-to-r from-transparent via-[color:var(--color-saffron)]/60 to-transparent"
      />
      <div className={`grid ${gardenSlot ? "grid-cols-5" : "grid-cols-4"} gap-1 px-2 py-2`}>
        <PaperTabBtn
          tone="plum"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 8h14" />
              <path d="M5 12h14" />
              <path d="M5 16h10" />
            </svg>
          }
          label={t("app.tab.translate")}
          onClick={() => onOpen("translate")}
        />
        <PaperTabBtn
          tone="sage"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          }
          label={t("app.tab.chat")}
          onClick={() => onOpen("chat")}
        />
        <PaperTabBtn
          tone="saffron"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 11-6 6v3h3l6-6" />
              <path d="m13 8 6-6 3 3-6 6" />
            </svg>
          }
          label={t("app.tab.notes")}
          badge={counts.notes > 0 ? counts.notes : undefined}
          onClick={() => onOpen("notes")}
        />
        <PaperTabBtn
          tone="coral"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 14.7 8.5 22 9.3l-5.6 4.9 1.7 7.1L12 17.7 5.9 21.3l1.7-7.1L2 9.3l7.3-.8z" />
            </svg>
          }
          label={t("app.tab.quiz")}
          onClick={() => onOpen("quiz")}
        />
        {gardenSlot}
      </div>
    </nav>
  );
}

function PaperTabBtn({
  icon,
  label,
  tone,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "sage" | "saffron" | "coral" | "plum";
  badge?: number;
  onClick: () => void;
}) {
  const toneClasses = {
    sage:    { bg: "bg-[color:var(--color-sage)]/12",    text: "text-[color:var(--color-sage-deep)]" },
    saffron: { bg: "bg-[color:var(--color-saffron)]/12", text: "text-[color:var(--color-saffron-deep)]" },
    coral:   { bg: "bg-[color:var(--color-coral)]/12",   text: "text-[color:var(--color-coral-deep)]" },
    plum:    { bg: "bg-[color:var(--color-plum)]/12",    text: "text-[color:var(--color-plum)]" },
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative flex flex-col items-center gap-0.5 rounded-2xl px-2 py-2 text-[color:var(--color-ink-soft)] transition-all active:scale-[0.97]"
    >
      <span className={`grid h-9 w-9 place-items-center rounded-xl ${toneClasses.bg} ${toneClasses.text}`}>
        {icon}
      </span>
      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-ink-soft)]">
        {label}
      </span>
      {badge != null && (
        <span
          aria-hidden
          className="absolute right-2 top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-[color:var(--color-saffron)] px-1 text-[0.6rem] font-bold text-white"
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

// ───────────────────────── Mobile: bottom-sheet drawer ─────────────────────────

function MobileDrawer({
  open,
  onClose,
  title,
  tone,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  tone: "sage" | "saffron" | "coral" | "plum";
  children: React.ReactNode;
}) {
  // Lock body scroll when open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const toneBar = {
    sage: "bg-[color:var(--color-sage)]",
    saffron: "bg-[color:var(--color-saffron)]",
    coral: "bg-[color:var(--color-coral)]",
    plum: "bg-[color:var(--color-plum)]",
  }[tone];

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-50 transition-opacity duration-200 lg:hidden ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 bg-[color:var(--color-ink)]/40 backdrop-blur-[1.5px]"
      />

      {/* Sheet — explicit height so inner scrollables get a defined viewport.
          Using max-h alone leaves the height undefined when content overflows,
          which breaks flex-1 + overflow-y-auto inside the panels. */}
      <div
        className={`absolute inset-x-0 bottom-0 flex h-[88dvh] flex-col rounded-t-3xl bg-[color:var(--color-paper)] shadow-[0_-12px_40px_-12px_rgba(20,16,8,0.4)] transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Tone bar — a saturated stripe along the top of the sheet,
            echoing the "paper tabs" so the user knows which one they opened */}
        <span aria-hidden className={`h-1 w-full shrink-0 rounded-t-3xl ${toneBar} opacity-90`} />

        {/* Drag handle */}
        <div className="flex shrink-0 justify-center pb-1 pt-2">
          <span aria-hidden className="h-1 w-10 rounded-full bg-[color:var(--color-border-strong)]/70" />
        </div>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[color:var(--color-border)] px-4 py-2.5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-full text-[color:var(--color-ink-soft)] hover:bg-[color:var(--color-paper-2)] hover:text-[color:var(--color-ink)]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body — min-h-0 is the magic that lets flex-1 + overflow-y-auto
            inside the panel actually clip and scroll instead of growing to
            fit content. */}
        <div className="min-h-0 flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Loading / failed states ─────────────────────────

function NotReadyState({ book }: { book: Book }) {
  const { t } = useI18n();
  if (book.status === "failed") {
    return (
      <div className="mx-auto mt-12 max-w-xl px-6">
        <div className="card-paper relative flex flex-col items-center gap-4 rounded-3xl border-[color:var(--color-destructive)]/30 p-8 text-center">
          <Lumi state="sad" size={140} animate />
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl font-semibold text-[color:var(--color-ink)]">
              {t("book.failed.title")}
            </p>
            {book.error_message && (
              <p className="mt-2 text-sm text-[color:var(--color-destructive)]/80">
                {book.error_message}
              </p>
            )}
            <p className="mt-3 text-xs italic text-[color:var(--color-ink-soft)]">
              Lumi tried her best. Want to upload again?
            </p>
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
        {t("book.processing.title")}
      </h2>
      <p className="mt-2 text-sm text-[color:var(--color-ink-soft)]">
        {t("book.processing.body")}
      </p>
      <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-saffron)]/15 px-3 py-1 text-[11px] font-semibold text-[color:var(--color-saffron-deep)]">
        <span aria-hidden>✨</span> Lumi is reading it now
      </p>
    </div>
  );
}
