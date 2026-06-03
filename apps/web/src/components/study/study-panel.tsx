"use client";

import { useState } from "react";
import { LayoutGrid, Timer, Layers, Star, Network, type LucideIcon } from "lucide-react";
import { useBookStudy, useFocusTimer } from "@/lib/focus";
import { useFlashcards } from "@/lib/flashcards";
import { FocusTool } from "@/components/study/focus-tool";
import { FlashcardsTool } from "@/components/study/flashcards-tool";
import { MindmapTool } from "@/components/study/mindmap-tool";
import { QuizPanel } from "@/components/quiz-panel";
import { TodayView } from "@/components/study/today-view";

type Tool = "today" | "focus" | "cards" | "quiz" | "map";

const TOOLS: { id: Tool; label: string; icon: LucideIcon; anchor?: string }[] = [
  { id: "today", label: "Today", icon: LayoutGrid },
  { id: "focus", label: "Focus", icon: Timer },
  { id: "cards", label: "Cards", icon: Layers },
  { id: "quiz", label: "Quiz", icon: Star, anchor: "quiz-rail" },
  { id: "map", label: "Map", icon: Network },
];

interface Props {
  bookId: string;
  /** Furthest page reached, for the Today reading-progress meter. */
  currentPage: number;
  pageCount: number | null;
  /** Threaded into the folded-in Quiz tool. */
  selectedTranslationId: string | null;
  onEmailRequired?: (action: string) => boolean;
  /** Wired by the page so a finished focus block can water the Garden, etc. */
  onFocusComplete?: (minutes: number) => void;
}

export function StudyPanel({
  bookId,
  currentPage,
  pageCount,
  selectedTranslationId,
  onEmailRequired,
  onFocusComplete,
}: Props) {
  const [tool, setTool] = useState<Tool>("today");

  // Session state is owned here, not inside each tool, so the Today desk and
  // the Focus/Cards tabs read and write the same timer, goal, and deck — a
  // sprint started on Today shows running on Focus, and cards made on Today
  // appear in Cards, all within the one tab.
  const study = useBookStudy(bookId);
  const timer = useFocusTimer((minutes) => {
    study.creditFocus(minutes);
    onFocusComplete?.(minutes);
  });
  const deck = useFlashcards(bookId);

  return (
    <div className="flex h-full min-h-0">
      <nav className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1 border-r border-[color:var(--color-border)] bg-[color:var(--color-paper-2)]/60 py-3">
        {TOOLS.map(({ id, label, icon: Icon, anchor }) => {
          const active = tool === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTool(id)}
              title={label}
              data-tutorial-anchor={anchor}
              className={`relative flex w-[3.5rem] flex-col items-center gap-1 rounded-xl py-1.5 transition-colors ${
                active
                  ? "bg-[color:var(--color-saffron)]/15 text-[color:var(--color-saffron-deep)] ring-1 ring-[color:var(--color-saffron)]/30"
                  : "text-[color:var(--color-ink-soft)] hover:bg-[color:var(--color-paper-3)]/60 hover:text-[color:var(--color-ink)]"
              }`}
            >
              <Icon size={18} />
              <span className="text-[0.6rem] font-semibold leading-none tracking-tight">{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tool === "today" && (
          <TodayView
            study={study}
            timer={timer}
            deck={deck}
            bookId={bookId}
            currentPage={currentPage}
            pageCount={pageCount}
            onNavigate={setTool}
          />
        )}
        {tool === "focus" && <FocusTool study={study} timer={timer} />}
        {tool === "cards" && <FlashcardsTool bookId={bookId} deck={deck} />}
        {tool === "quiz" && (
          <QuizPanel
            bookId={bookId}
            selectedTranslationId={selectedTranslationId}
            onEmailRequired={onEmailRequired}
          />
        )}
        {tool === "map" && <MindmapTool bookId={bookId} />}
      </div>
    </div>
  );
}
