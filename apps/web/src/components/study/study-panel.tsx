"use client";

import { useState } from "react";
import { Timer, Layers, Network, type LucideIcon } from "lucide-react";
import { FocusTool } from "@/components/study/focus-tool";
import { FlashcardsTool } from "@/components/study/flashcards-tool";
import { MindmapTool } from "@/components/study/mindmap-tool";

type Tool = "focus" | "cards" | "map";

const TOOLS: { id: Tool; label: string; short: string; icon: LucideIcon }[] = [
  { id: "focus", label: "Focus", short: "Focus", icon: Timer },
  { id: "cards", label: "Flashcards", short: "Cards", icon: Layers },
  { id: "map", label: "Mind map", short: "Map", icon: Network },
];

interface Props {
  bookId: string;
  onFocusComplete?: (minutes: number) => void;
}

export function StudyPanel({ bookId, onFocusComplete }: Props) {
  const [tool, setTool] = useState<Tool>("focus");

  return (
    <div className="flex h-full min-h-0">
      <nav className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1 border-r border-[color:var(--color-border)] bg-[color:var(--color-paper-2)]/60 py-3">
        {TOOLS.map(({ id, label, short, icon: Icon }) => {
          const active = tool === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTool(id)}
              title={label}
              className={`relative flex w-[3.5rem] flex-col items-center gap-1 rounded-xl py-1.5 transition-colors ${
                active
                  ? "bg-[color:var(--color-saffron)]/15 text-[color:var(--color-saffron-deep)] ring-1 ring-[color:var(--color-saffron)]/30"
                  : "text-[color:var(--color-ink-soft)] hover:bg-[color:var(--color-paper-3)]/60 hover:text-[color:var(--color-ink)]"
              }`}
            >
              <Icon size={18} />
              <span className="text-[0.6rem] font-semibold leading-none tracking-tight">{short}</span>
            </button>
          );
        })}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tool === "focus" && <FocusTool bookId={bookId} onFocusComplete={onFocusComplete} />}
        {tool === "cards" && <FlashcardsTool bookId={bookId} />}
        {tool === "map" && <MindmapTool bookId={bookId} />}
      </div>
    </div>
  );
}
