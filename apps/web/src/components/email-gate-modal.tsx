"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { claimSession } from "@/lib/auth";
import { Lumi } from "@/components/lumi/lumi";
import { useI18n } from "@/lib/i18n";

/**
 * Modal asked of an anonymous reader the first time they try a feature that
 * costs us money — chat, quiz, upload, translation. The frontend opens this
 * by catching the structured `email_required` 402 from the backend.
 *
 * On success the visitor's anonymous account is *claimed* in-place: same
 * user_id, same books, same reading position — they just have a real email
 * now. The closing `onClaimed` callback gives the parent a chance to retry
 * the action that triggered the modal.
 */
type GateAction = "chat" | "quiz" | "translate" | "upload" | "save" | string;

interface Props {
  open: boolean;
  /** What the visitor was trying to do — drives the headline copy. */
  action: GateAction;
  onClose: () => void;
  /** Fires after a successful claim. Use it to invalidate caches + retry. */
  onClaimed?: () => void;
}

const ACTION_KEYS: Record<string, string> = {
  chat: "gate.chat",
  quiz: "gate.quiz",
  translate: "gate.translate",
  upload: "gate.upload",
  save: "gate.save",
};

export function EmailGateModal({ open, action, onClose, onClaimed }: Props) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [linkSentTo, setLinkSentTo] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setEmail("");
    setErr(null);
    setLinkSentTo(null);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const keyBase = ACTION_KEYS[action] ?? "gate.save";
  const copy = {
    eyebrow: t(`${keyBase}.eyebrow`),
    headline: t(`${keyBase}.headline`),
    sub: t(`${keyBase}.sub`),
    cta: t(`${keyBase}.cta`),
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!valid) { setErr(t("gate.error.email")); return; }
    setErr(null); setBusy(true);
    try {
      const preferred = typeof document !== "undefined"
        ? (document.documentElement.lang || undefined)
        : undefined;
      const res = await claimSession({ email, preferred_language: preferred });
      if (res.claimed) {
        // The anon account is now a real one — same id, fresh JWT. Drop
        // the cached `me` so it re-renders without is_anonymous=true.
        qc.invalidateQueries({ queryKey: ["me"] });
        qc.invalidateQueries({ queryKey: ["subscription"] });
        onClaimed?.();
        onClose();
      } else {
        // Email belonged to a different account — magic link was sent.
        // Keep the visitor on their anon session here so they can keep
        // reading, but tell them about the inbox link.
        setLinkSentTo(email);
      }
    } catch (e) {
      setErr(
        e instanceof ApiError
          ? e.message
          : t("gate.error.fallback"),
      );
    } finally { setBusy(false); }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={copy.headline}
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6"
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
        <div
          className="h-1.5"
          style={{ background: "linear-gradient(90deg,#EDB86A,#D09040)" }}
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute end-3 top-3 grid h-9 w-9 place-items-center rounded-full transition-all active:scale-90"
          style={{ background: "white", border: "1.5px solid var(--color-border)", color: "var(--color-ink)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="px-7 pb-7 pt-9">
          <div className="flex justify-center">
            <Lumi state={linkSentTo ? "happy" : "waving"} size={84} animate />
          </div>

          <p
            className="mt-4 text-center text-[0.72rem] font-bold uppercase tracking-[0.22em]"
            style={{ color: "var(--color-saffron-deep)" }}
          >
            {linkSentTo ? t("gate.welcome") : copy.eyebrow}
          </p>
          <h2
            className="mt-1.5 text-balance text-center font-[family-name:var(--font-display)] font-semibold leading-[1.1] tracking-tight"
            style={{ fontSize: "clamp(1.45rem,5vw,1.8rem)", color: "var(--color-ink)" }}
          >
            {linkSentTo ? t("gate.linkSent.title") : copy.headline}
          </h2>
          <p
            className="mx-auto mt-3 max-w-[32ch] text-balance text-center text-[0.92rem] leading-relaxed"
            style={{ color: "var(--color-ink-soft)" }}
          >
            {linkSentTo
              ? (() => {
                  const tpl = t("gate.linkSent.body", { email: "@@EMAIL@@" });
                  const [before, after] = tpl.split("@@EMAIL@@");
                  return (
                    <>
                      {before}
                      <span className="font-semibold" style={{ color: "var(--color-ink)" }}>{linkSentTo}</span>
                      {after}
                    </>
                  );
                })()
              : copy.sub}
          </p>

          {!linkSentTo ? (
            <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3">
              <div
                className="flex items-center gap-3 rounded-2xl border-2 px-4"
                style={{ borderColor: "var(--color-border-strong)", background: "white" }}
              >
                <span className="text-[1.2rem] leading-none">📧</span>
                <input
                  type="email"
                  placeholder={t("gate.placeholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                  className="flex-1 bg-transparent py-3.5 text-[0.96rem] outline-none"
                  style={{ color: "var(--color-ink)", caretColor: "var(--color-saffron-deep)" }}
                />
              </div>

              {err && (
                <div className="rounded-xl px-3 py-2 text-[0.84rem] font-medium" style={{ background: "rgba(220,38,38,0.07)", color: "#B91C1C", border: "1.5px solid rgba(220,38,38,0.22)" }}>
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={!email || busy}
                className="h-13 mt-1 h-12 rounded-2xl font-[family-name:var(--font-display)] text-[1rem] font-bold text-white transition-all active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: "linear-gradient(to bottom,#EDB86A,#D09040)",
                  boxShadow: "0 5px 0 rgba(152,96,24,0.50)",
                }}
              >
                {busy ? t("gate.busy") : copy.cta}
              </button>

              {/* Same three-pill trust strip the /join page uses — answers
                  the exact three objections that kill conversion: password,
                  spam, money. */}
              <div className="mt-1 grid grid-cols-3 gap-2 text-center">
                {[
                  { icon: "🔓", label: t("gate.trust.password") },
                  { icon: "📭", label: t("gate.trust.marketing") },
                  { icon: "💳", label: t("gate.trust.card") },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col items-center gap-0.5 rounded-xl border px-2 py-2"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-paper)", color: "var(--color-ink-soft)" }}
                  >
                    <span className="text-[1rem] leading-none">{item.icon}</span>
                    <span className="text-[0.68rem] font-semibold">{item.label}</span>
                  </div>
                ))}
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="mt-5 h-12 w-full rounded-2xl text-[0.95rem] font-semibold transition-all active:translate-y-1"
              style={{
                background: "white",
                border: "1.5px solid var(--color-border-strong)",
                color: "var(--color-ink)",
                boxShadow: "0 3px 0 rgba(74,60,30,0.10)",
              }}
            >
              {t("gate.keepReading")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
