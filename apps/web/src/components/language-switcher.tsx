"use client";

import { useEffect, useRef, useState } from "react";
import { LOCALES, useI18n, type Locale } from "@/lib/i18n";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`group inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-paper)] px-3 py-1.5 text-sm font-semibold text-[color:var(--color-ink)] shadow-[0_1px_0_rgba(74,60,30,0.04)] transition-all hover:border-[color:var(--color-border-strong)] hover:-translate-y-[1px] ${
          compact ? "h-9" : ""
        }`}
      >
        <span className="text-base leading-none">{current.flag}</span>
        {!compact && (
          <span className="hidden font-[family-name:var(--font-display)] tracking-tight md:inline">
            {current.label}
          </span>
        )}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute end-0 z-50 mt-2 min-w-[180px] origin-top-end animate-pop-in overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-1.5 shadow-[var(--shadow-paper-lg)]"
        >
          {LOCALES.map((l) => {
            const selected = l.code === locale;
            return (
              <button
                key={l.code}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setLocale(l.code as Locale);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                  selected
                    ? "bg-[color:var(--color-saffron)]/15 text-[color:var(--color-saffron-deep)]"
                    : "text-[color:var(--color-ink)] hover:bg-[color:var(--color-paper-2)]"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-base leading-none">{l.flag}</span>
                  <span className="font-[family-name:var(--font-display)] font-semibold tracking-tight">
                    {l.label}
                  </span>
                </span>
                {l.dir === "rtl" && (
                  <span className="rounded-md bg-[color:var(--color-paper-3)] px-1.5 py-0.5 text-[0.6rem] font-bold tracking-wider text-[color:var(--color-ink-soft)]">
                    RTL
                  </span>
                )}
                {selected && (
                  <span className="text-[color:var(--color-saffron-deep)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
