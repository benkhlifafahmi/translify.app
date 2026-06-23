"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lumi } from "@/components/lumi/lumi";
import { useI18n } from "@/lib/i18n";

interface Props {
  open: boolean;
  /** Which page the reader hit, for the headline copy. */
  page?: number;
  /** Page the cap kicks in at (1-indexed). Used in the body copy. */
  cap?: number;
  /** Optional book title to make the message specific. */
  bookTitle?: string;
  /** Fires when the user dismisses (back-to-shelf or X). */
  onClose: () => void;
}

/** Modal shown when a Free reader crosses the seed-book page cap.
 *
 *  We send them to /account, where the existing Stripe Checkout flow starts
 *  a 14-day Reader trial (no card upfront). The modal can be dismissed —
 *  but the reader is stuck at the cap until they upgrade.
 */
export function PaywallModal({ open, page, cap = 10, bookTitle, onClose }: Props) {
  const router = useRouter();
  const { t } = useI18n();

  // Lock body scroll while the modal is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const startTrial = () => {
    router.push("/account?upgrade=seed-paywall");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("paywall.aria")}
      className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6"
      style={{ background: "rgba(20,16,8,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl"
        style={{
          background: "white",
          border: "2px solid var(--color-border-strong)",
          boxShadow: "0 24px 60px -20px rgba(20,16,8,0.45), 0 8px 0 rgba(74,60,30,0.10)",
          animation: "paywall-rise 0.32s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Top accent bar */}
        <div
          className="h-1.5"
          style={{ background: "linear-gradient(90deg,#EDB86A,#D09040)" }}
        />

        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.close")}
          className="absolute end-3 top-3 grid h-9 w-9 place-items-center rounded-full transition-all active:scale-90"
          style={{
            background: "white",
            border: "1.5px solid var(--color-border)",
            color: "var(--color-ink)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="px-7 pb-7 pt-9">
          <div className="flex justify-center">
            <Lumi state="reading" size={92} animate />
          </div>

          <p
            className="mt-5 text-center text-[0.72rem] font-bold uppercase tracking-[0.22em]"
            style={{ color: "var(--color-saffron-deep)" }}
          >
            {t("paywall.eyebrow")}
          </p>
          <h2
            className="mt-1.5 text-balance text-center font-[family-name:var(--font-display)] font-semibold leading-[1.1] tracking-tight"
            style={{ fontSize: "clamp(1.5rem,5.2vw,1.85rem)", color: "var(--color-ink)" }}
          >
            {t("paywall.title", { cap })}
          </h2>
          <p
            className="mx-auto mt-3 max-w-[30ch] text-balance text-center text-[0.94rem] leading-relaxed"
            style={{ color: "var(--color-ink-soft)" }}
          >
            {bookTitle
              ? (() => {
                  const [before, after] = t("paywall.bodyTitled", { title: "@@T@@" }).split("@@T@@");
                  return (
                    <>
                      {before}
                      <em style={{ color: "var(--color-ink)" }}>{bookTitle}</em>
                      {after}
                    </>
                  );
                })()
              : t("paywall.body")}
          </p>

          {/* Trial benefits — short and benefit-led */}
          <ul className="mt-5 flex flex-col gap-2 rounded-2xl border-2 p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-paper)" }}>
            {[
              t("paywall.benefit1"),
              t("paywall.benefit2"),
              t("paywall.benefit3"),
              t("paywall.benefit4"),
            ].map((b, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[0.88rem]" style={{ color: "var(--color-ink)" }}>
                <span
                  className="mt-[3px] grid h-4 w-4 shrink-0 place-items-center rounded-full text-white"
                  style={{ background: "var(--color-sage-deep)" }}
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                {b}
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={startTrial}
            className="mt-5 h-14 w-full rounded-2xl font-[family-name:var(--font-display)] text-[1.05rem] font-bold text-white transition-[transform,box-shadow] duration-75 active:translate-y-1"
            style={{
              background: "linear-gradient(to bottom,#EDB86A,#D09040)",
              boxShadow: "0 6px 0 rgba(152,96,24,0.50)",
            }}
          >
            {t("paywall.cta")}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="mt-3 h-11 w-full rounded-2xl text-[0.88rem] font-semibold transition-colors"
            style={{ color: "var(--color-ink-soft)" }}
          >
            {t("paywall.later")}
          </button>

          {typeof page === "number" && (
            <p className="mt-3 text-center text-[0.72rem]" style={{ color: "var(--color-ink-soft)" }}>
              {t("paywall.pageNote", { page })}
            </p>
          )}
        </div>

        <style>{`@keyframes paywall-rise{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
      </div>
    </div>
  );
}
