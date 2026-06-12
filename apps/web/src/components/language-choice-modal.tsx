"use client";

import { useEffect, useState } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { LOCALES, translateIn, type Locale } from "@/lib/i18n";

/**
 * One-time "choose your language" popup. Shown by the I18nProvider on a
 * visitor's first load when their IP-suggested locale (`geo`) disagrees with the
 * locale we auto-applied from their browser (`current`). Picking either one — or
 * any language from the "other languages" list — persists the choice to
 * localStorage, so this never appears again.
 *
 * Copy is bilingual on purpose: each option's label and sub-text render in that
 * option's *own* language (a flag + autonym a native speaker recognises at a
 * glance), while the framing subtitle stays in the language currently on screen.
 */
const dirOf = (l: Locale): "rtl" | "ltr" => (l === "ar" ? "rtl" : "ltr");

interface Props {
  geo: Locale;
  current: Locale;
  onPick: (l: Locale) => void;
  onDismiss: () => void;
}

export function LanguageChoiceModal({ geo, current, onPick, onDismiss }: Props) {
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onDismiss]);

  const primary: Locale[] = geo === current ? [geo] : [geo, current];
  const rest = LOCALES.filter((l) => !primary.includes(l.code));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={translateIn(geo, "langChoice.title")}
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6"
      style={{ background: "rgba(20,16,8,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onDismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-pop-in relative w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl"
        style={{
          background: "var(--color-paper)",
          border: "2px solid var(--color-border-strong)",
          boxShadow: "0 24px 60px -20px rgba(20,16,8,0.45), 0 8px 0 rgba(74,60,30,0.10)",
        }}
      >
        <div className="h-1.5" style={{ background: "linear-gradient(90deg,#EDB86A,#D09040)" }} />

        <button
          type="button"
          onClick={onDismiss}
          aria-label={translateIn(current, "langChoice.dismiss")}
          className="absolute end-3 top-3 grid h-9 w-9 place-items-center rounded-full transition-all active:scale-90"
          style={{ background: "var(--color-paper)", border: "1.5px solid var(--color-border)", color: "var(--color-ink)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="px-6 pb-6 pt-8 sm:px-7">
          <div className="flex justify-center">
            <span
              className="grid h-14 w-14 place-items-center rounded-2xl"
              style={{ background: "color-mix(in srgb, var(--color-saffron) 15%, transparent)", color: "var(--color-saffron-deep)" }}
            >
              <Globe size={28} strokeWidth={2} />
            </span>
          </div>

          {/* Title in the suggested (likely native) language; subtitle stays in
              what's currently on screen, so both readers are addressed. */}
          <h2
            dir={dirOf(geo)}
            className="mt-4 text-balance text-center font-[family-name:var(--font-display)] font-semibold leading-[1.12] tracking-tight"
            style={{ fontSize: "clamp(1.4rem,5vw,1.75rem)", color: "var(--color-ink)" }}
          >
            {translateIn(geo, "langChoice.title")}
          </h2>
          <p
            dir={dirOf(current)}
            className="mx-auto mt-2.5 max-w-[34ch] text-balance text-center text-[0.92rem] leading-relaxed"
            style={{ color: "var(--color-ink-soft)" }}
          >
            {translateIn(current, "langChoice.subtitle")}
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            {primary.map((code, i) => (
              <OptionRow
                key={code}
                code={code}
                suggested={i === 0 && geo !== current}
                onPick={onPick}
                currentLocale={current}
              />
            ))}
          </div>

          {rest.length > 0 && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="mx-auto flex items-center gap-1.5 text-[0.85rem] font-semibold transition-colors"
                style={{ color: "var(--color-ink-soft)" }}
              >
                {translateIn(current, "langChoice.more")}
                <ChevronDown
                  size={15}
                  className="transition-transform"
                  style={{ transform: showAll ? "rotate(180deg)" : "" }}
                />
              </button>

              {showAll && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {rest.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => onPick(l.code)}
                      dir={l.dir}
                      className="flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-start transition-all hover:-translate-y-[1px]"
                      style={{ borderColor: "var(--color-border)", background: "var(--color-paper-2)" }}
                    >
                      <span className="text-base leading-none">{l.flag}</span>
                      <span
                        className="truncate font-[family-name:var(--font-display)] text-[0.92rem] font-semibold tracking-tight"
                        style={{ color: "var(--color-ink)" }}
                      >
                        {l.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OptionRow({
  code,
  suggested,
  onPick,
  currentLocale,
}: {
  code: Locale;
  suggested: boolean;
  onPick: (l: Locale) => void;
  currentLocale: Locale;
}) {
  const meta = LOCALES.find((l) => l.code === code)!;
  return (
    <button
      type="button"
      onClick={() => onPick(code)}
      dir={meta.dir}
      className="group flex w-full items-center gap-3.5 rounded-2xl border-[1.5px] px-4 py-3.5 text-start transition-all hover:-translate-y-[1px] active:translate-y-0"
      style={{
        borderColor: suggested ? "var(--color-saffron)" : "var(--color-border-strong)",
        background: suggested ? "color-mix(in srgb, var(--color-saffron) 10%, var(--color-paper))" : "var(--color-paper)",
        boxShadow: "0 3px 0 rgba(74,60,30,0.08)",
      }}
    >
      <span className="text-2xl leading-none">{meta.flag}</span>
      <span className="min-w-0 flex-1">
        <span
          className="block truncate font-[family-name:var(--font-display)] text-[1.05rem] font-semibold tracking-tight"
          style={{ color: "var(--color-ink)" }}
        >
          {meta.label}
        </span>
        <span className="block text-[0.8rem] font-medium" style={{ color: "var(--color-ink-soft)" }}>
          {translateIn(code, "langChoice.continue")}
        </span>
      </span>
      {suggested && (
        <span
          dir={dirOf(currentLocale)}
          className="shrink-0 rounded-full px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.08em]"
          style={{ background: "var(--color-saffron)", color: "var(--color-accent-foreground)" }}
        >
          {translateIn(currentLocale, "langChoice.suggested")}
        </span>
      )}
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: "var(--color-saffron)", color: "var(--color-accent-foreground)" }}
      >
        <Check size={16} strokeWidth={3} />
      </span>
    </button>
  );
}
