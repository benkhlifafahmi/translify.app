"use client";

import { useState } from "react";
import { Timer, Layers, Network, ChevronLeft, type LucideIcon } from "lucide-react";
import { FocusTool } from "@/components/study/focus-tool";

type Tool = "focus" | "cards" | "map";

const TOOLS: { id: Tool; label: string; icon: LucideIcon; ready: boolean }[] = [
  { id: "focus", label: "Focus", icon: Timer, ready: true },
  { id: "cards", label: "Flashcards", icon: Layers, ready: false },
  { id: "map", label: "Mind map", icon: Network, ready: false },
];

interface Props {
  bookId: string;
  /** Hook for crediting the Garden / streaks when a focus block finishes. */
  onFocusComplete?: (minutes: number) => void;
  /** Collapses the panel column to give the reader more room. */
  onCollapse?: () => void;
}

export function StudyPanel({ bookId, onFocusComplete, onCollapse }: Props) {
  const [tool, setTool] = useState<Tool>("focus");

  return (
    <div className="flex h-full min-h-0">
      {/* Icon rail */}
      <nav className="flex w-14 shrink-0 flex-col items-center gap-1.5 border-r border-[color:var(--color-border)] bg-[color:var(--color-paper-2)]/60 py-3">
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            title="Hide study panel"
            className="mb-1 grid h-9 w-9 place-items-center rounded-xl text-[color:var(--color-ink-soft)] transition-colors hover:bg-[color:var(--color-paper-3)]/70 hover:text-[color:var(--color-ink)]"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        {TOOLS.map(({ id, label, icon: Icon, ready }) => {
          const active = tool === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTool(id)}
              title={ready ? label : `${label} — coming soon`}
              className={`relative grid h-10 w-10 place-items-center rounded-xl transition-colors ${
                active
                  ? "bg-[color:var(--color-saffron)]/15 text-[color:var(--color-saffron-deep)] ring-1 ring-[color:var(--color-saffron)]/30"
                  : "text-[color:var(--color-ink-soft)] hover:bg-[color:var(--color-paper-3)]/60 hover:text-[color:var(--color-ink)]"
              }`}
            >
              <Icon size={18} />
              {!ready && (
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[color:var(--color-sage)]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tool === "focus" && <FocusTool bookId={bookId} onFocusComplete={onFocusComplete} />}
        {tool === "cards" && (
          <ComingSoon
            title="Flashcards"
            tagline="Turn your highlights into a deck and review with spaced repetition."
            why="Active recall (testing yourself) and spaced repetition are two of the most strongly supported techniques in learning science — far better than re-reading."
          />
        )}
        {tool === "map" && (
          <ComingSoon
            title="Mind map"
            tagline="Connect the ideas in this book into a visual web."
            why="Dual coding — pairing words with visual structure — helps you encode and recall complex relationships."
          />
        )}
      </div>
    </div>
  );
}

function ComingSoon({
  title,
  tagline,
  why,
}: {
  title: string;
  tagline: string;
  why: string;
}) {
  return (
    <div className="flex flex-col gap-3 p-5">
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-ink-soft)]">
          Study mode
        </p>
        <h3 className="mt-1.5 font-[family-name:var(--font-display)] text-xl font-semibold leading-tight tracking-tight">
          {title}
        </h3>
        <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">{tagline}</p>
      </div>
      <div className="card-paper flex flex-col gap-2 p-4">
        <span className="w-fit rounded-full bg-[color:var(--color-sage)]/15 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-sage-deep)]">
          Coming soon
        </span>
        <p className="text-[0.8rem] leading-relaxed text-[color:var(--color-ink-soft)]">{why}</p>
      </div>
    </div>
  );
}
