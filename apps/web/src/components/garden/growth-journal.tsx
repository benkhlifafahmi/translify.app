import type { JournalEntry } from "@/lib/garden";
import { formatJournalDate } from "@/lib/garden";

const KIND_ICON: Record<JournalEntry["kind"], { bg: string; fg: string; path: React.ReactNode }> = {
  read: {
    bg: "bg-[color:var(--color-ink)]",
    fg: "text-[color:var(--color-paper)]",
    path: <path d="M3 2 L 11 2 L 11 12 L 7 10 L 3 12 Z" fill="currentColor" />,
  },
  quiz: {
    bg: "bg-[color:var(--color-saffron)]",
    fg: "text-[color:var(--color-ink)]",
    path: (
      <path
        d="M7 1 L 9 5 L 13 6 L 10 9 L 11 13 L 7 11 L 3 13 L 4 9 L 1 6 L 5 5 Z"
        fill="currentColor"
      />
    ),
  },
  water: {
    bg: "bg-[color:var(--color-paper-3)]",
    fg: "text-[color:var(--color-sage-deep)]",
    path: <circle cx="7" cy="7" r="3" fill="currentColor" />,
  },
  skip: {
    bg: "bg-[color:var(--color-coral)]",
    fg: "text-[color:var(--color-paper)]",
    path: <path d="M7 2 C 3 6, 3 9, 7 12 C 11 9, 11 6, 7 2 Z" fill="currentColor" />,
  },
  translate: {
    bg: "bg-[color:var(--color-sage-deep)]",
    fg: "text-[color:var(--color-paper)]",
    path: (
      <path
        d="M2 4 L 6 4 L 6 10 L 2 10 Z M 8 4 L 12 4 L 12 10 L 8 10 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    ),
  },
  tend: {
    bg: "bg-[color:var(--color-saffron-deep)]",
    fg: "text-[color:var(--color-paper)]",
    path: (
      <path
        d="M7 1 L 9 5 L 13 6 L 10 9 L 11 13 L 7 11 L 3 13 L 4 9 L 1 6 L 5 5 Z"
        fill="currentColor"
      />
    ),
  },
};

export function GrowthJournal({ entries }: { entries: JournalEntry[] }) {
  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between border-b border-[color:var(--color-border)] pb-3">
        <h2 className="font-[family-name:var(--font-display)] text-[34px] font-light italic leading-none tracking-[-0.01em]">
          Growth Journal
        </h2>
        <span className="font-[family-name:var(--font-display)] text-[13px] italic uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
          last seven days
        </span>
      </div>

      <ul className="relative list-none">
        {/* timeline rail */}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-2 left-[112px] top-2 border-l border-dashed border-[color:var(--color-border)]"
        />
        {entries.map((e) => {
          const icon = KIND_ICON[e.kind];
          return (
            <li
              key={e.id}
              className="grid grid-cols-[112px_28px_1fr_auto] items-center gap-4 border-b border-[color:var(--color-border)]/40 py-4 last:border-b-0"
            >
              <span className="text-right font-[family-name:var(--font-display)] text-[13px] italic text-[color:var(--color-muted-foreground)]">
                {formatJournalDate(e.at)}
              </span>
              <span
                className={`grid h-7 w-7 place-items-center rounded-full border border-[color:var(--color-border)] ${icon.bg} ${icon.fg}`}
              >
                <svg width="14" height="14" viewBox="0 0 14 14">
                  {icon.path}
                </svg>
              </span>
              <span
                className="text-[16px] [&_em]:italic [&_em]:text-[color:var(--color-ink-soft)]"
                dangerouslySetInnerHTML={{ __html: e.what }}
              />
              <span
                className={`font-[family-name:var(--font-display)] text-[15px] font-medium tabular-nums ${
                  e.warn
                    ? "text-[color:var(--color-coral-deep)]"
                    : "text-[color:var(--color-sage-deep)]"
                }`}
              >
                {e.delta}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
