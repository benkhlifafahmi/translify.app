"use client";

import { useI18n } from "@/lib/i18n";

export function FAQ() {
  const { t, faq } = useI18n();

  return (
    <section id="faq" className="relative z-10 mx-auto max-w-4xl px-8 pb-24 pt-12 lg:px-14">
      <div className="text-center">
        <span className="badge-pill bg-[color:var(--color-sage)]/15 text-[color:var(--color-sage-deep)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-sage)]" />
          {t("faq.badge")}
        </span>
        <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2rem,4vw,3rem)] font-semibold leading-tight tracking-tight">
          {t("faq.title")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[1rem] leading-relaxed text-[color:var(--color-ink-soft)]">
          {t("faq.note")}
        </p>
      </div>

      <div className="mt-10 space-y-3">
        {faq.map((item, i) => (
          <details
            key={i}
            className="group card-paper open:shadow-[var(--shadow-paper-lg)] transition-shadow"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5">
              <span className="flex items-start gap-3">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[color:var(--color-paper-3)] font-[family-name:var(--font-display)] text-xs font-semibold text-[color:var(--color-ink-soft)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-[family-name:var(--font-display)] text-[1.1rem] font-semibold leading-snug text-[color:var(--color-ink)]">
                  {item.q}
                </span>
              </span>
              <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)] text-[color:var(--color-ink-soft)] transition-transform group-open:rotate-45">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
            </summary>
            <div className="px-5 pb-5 ps-[3.75rem] text-[0.95rem] leading-relaxed text-[color:var(--color-ink-soft)]">
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
