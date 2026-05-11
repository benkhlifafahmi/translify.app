"use client";

// LumiGuide — Lumi with a speech bubble. Used in empty states, onboarding,
// or any "Lumi wants to tell you something" moment. The bubble can cycle
// through a small queue of lines, or just show one.

import { useEffect, useState } from "react";
import { Lumi, type LumiState } from "./lumi";

interface LumiGuideProps {
  state?: LumiState;
  size?: number;
  level?: 1 | 2 | 3 | 4 | 5;
  /** Single line OR a rotating array of lines (cycles every 5s). */
  lines: string | string[];
  /** Bubble side relative to Lumi. */
  bubblePosition?: "right" | "left" | "top";
  /** Optional CTA below the bubble. */
  cta?: { label: string; onClick?: () => void; href?: string };
  className?: string;
}

export function LumiGuide({
  state = "waving",
  size = 140,
  level = 1,
  lines,
  bubblePosition = "right",
  cta,
  className = "",
}: LumiGuideProps) {
  const arr = Array.isArray(lines) ? lines : [lines];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (arr.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % arr.length), 5000);
    return () => clearInterval(t);
  }, [arr.length]);

  const isSide = bubblePosition === "right" || bubblePosition === "left";

  return (
    <div
      className={`flex items-center gap-5 ${
        bubblePosition === "left" ? "flex-row-reverse" : ""
      } ${bubblePosition === "top" ? "flex-col-reverse" : ""} ${className}`}
    >
      <div className="shrink-0">
        <Lumi state={state} size={size} level={level} animate />
      </div>

      <div className="flex flex-col items-start gap-3">
        <div
          className={[
            "lumi-bubble-in relative max-w-sm rounded-2xl border-[1.5px] border-[color:var(--color-saffron)]/40",
            "bg-gradient-to-br from-[#FFF7E5] to-[#FBEDD0]",
            "px-5 py-3.5 shadow-[var(--shadow-paper)]",
          ].join(" ")}
        >
          {/* Tail */}
          <span
            aria-hidden
            className="absolute h-3 w-3 rotate-45 border-[1.5px] border-[color:var(--color-saffron)]/40 bg-[#FFF7E5]"
            style={
              isSide
                ? bubblePosition === "right"
                  ? { left: -7, top: 28, borderRight: "none", borderTop: "none" }
                  : { right: -7, top: 28, borderLeft: "none", borderBottom: "none" }
                : { bottom: -7, left: 28, borderRight: "none", borderTop: "none" }
            }
          />
          <p
            key={idx}
            className="lumi-line-fade font-[family-name:var(--font-display)] text-[15px] leading-snug text-[color:var(--color-ink)]"
          >
            {arr[idx]}
          </p>
        </div>

        {cta && (
          <a
            href={cta.href}
            onClick={cta.onClick}
            className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-ink)] px-4 py-2 text-[13px] font-semibold text-[color:var(--color-paper)] shadow-[var(--shadow-paper)] transition-all hover:-translate-y-0.5 hover:bg-[color:var(--color-ink-soft)]"
          >
            {cta.label}
            <span aria-hidden>→</span>
          </a>
        )}
      </div>
    </div>
  );
}
