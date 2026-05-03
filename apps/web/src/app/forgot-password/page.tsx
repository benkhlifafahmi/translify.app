"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { requestPasswordReset } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      // Even on failure we show "sent" — anti-enumeration. But surface real
      // network errors so the user knows the request didn't go through.
      if (err instanceof ApiError && err.status >= 500) {
        setError("Something went wrong on our end. Try again in a moment.");
      } else {
        setSent(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <AuthShell
        eyebrow={t("auth.forgot.eyebrow")}
        title={t("auth.forgot.sent.title")}
        subtitle={t("auth.forgot.sent.body")}
      >
        <PostmarkIllustration email={email} />

        <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-full border-[1.5px] border-[color:var(--color-ink)] bg-[color:var(--color-paper)] px-6 font-semibold text-[color:var(--color-ink)] transition-transform hover:-translate-y-[1px]"
          >
            {t("auth.forgot.back")}
          </Link>
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setEmail("");
            }}
            className="text-sm font-semibold text-[color:var(--color-ink-soft)] underline decoration-[color:var(--color-saffron)] decoration-2 underline-offset-4 hover:text-[color:var(--color-ink)]"
          >
            Try a different email
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow={t("auth.forgot.eyebrow")}
      title={t("auth.forgot.title")}
      subtitle={t("auth.forgot.subtitle")}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{t("auth.forgot.email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-xl border border-[color:var(--color-destructive)]/30 bg-[color:var(--color-destructive)]/8 px-4 py-3 text-sm text-[color:var(--color-destructive)]">
            {error}
          </div>
        )}

        <Button type="submit" variant="accent" size="lg" disabled={submitting}>
          {submitting ? t("auth.forgot.submitting") : t("auth.forgot.submit")}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-[color:var(--color-ink-soft)]">
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-semibold text-[color:var(--color-ink)] underline decoration-[color:var(--color-saffron)] decoration-2 underline-offset-4 hover:decoration-[color:var(--color-saffron-deep)]"
        >
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}

/** Small illustration: an envelope with a saffron wax seal — confirms the
 *  email was sent without using a stock graphic. Pure CSS / inline SVG. */
function PostmarkIllustration({ email }: { email: string }) {
  return (
    <div className="relative flex flex-col items-center gap-5 rounded-[1.4rem] border border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-paper-2)]/40 px-6 py-8">
      <div aria-hidden className="pointer-events-none absolute -right-3 -top-3 -rotate-[10deg]">
        <span className="grid h-14 w-14 place-items-center rounded-full border-[3px] border-[color:var(--color-saffron-deep)] bg-[color:var(--color-saffron)]/20 font-[family-name:var(--font-display)] text-[0.55rem] font-bold uppercase tracking-[0.18em] text-[color:var(--color-saffron-deep)] shadow-[inset_0_0_0_3px_rgba(255,255,255,0.5)]">
          ✦ Posted
        </span>
      </div>

      {/* Envelope */}
      <svg viewBox="0 0 200 130" className="h-32 w-48" aria-hidden>
        <defs>
          <linearGradient id="env-paper" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFCF3" />
            <stop offset="100%" stopColor="#F5E9CD" />
          </linearGradient>
        </defs>
        <rect x="6" y="20" width="188" height="100" rx="8" fill="url(#env-paper)" stroke="#D4C29C" strokeWidth="1.5" />
        <path d="M 8 22 L 100 78 L 192 22" stroke="#D4C29C" strokeWidth="1.5" fill="none" />
        <path d="M 8 118 L 78 70" stroke="#E5D8BC" strokeWidth="1" fill="none" />
        <path d="M 192 118 L 122 70" stroke="#E5D8BC" strokeWidth="1" fill="none" />
        {/* wax seal */}
        <circle cx="100" cy="70" r="14" fill="#C8893E" stroke="#A06D2C" strokeWidth="1" />
        <text
          x="100"
          y="74"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="14"
          fontStyle="italic"
          fill="#FAF6EE"
          fontWeight="600"
        >
          T
        </text>
        {/* postmark */}
        <g transform="translate(150 32) rotate(-8)" opacity="0.5">
          <circle cx="0" cy="0" r="14" fill="none" stroke="#5F8763" strokeWidth="1.2" />
          <text x="0" y="-2" textAnchor="middle" fontFamily="Georgia" fontSize="5.5" fill="#5F8763" letterSpacing="0.5">TRANSLIFY</text>
          <text x="0" y="6" textAnchor="middle" fontFamily="Georgia" fontSize="4.5" fill="#5F8763" letterSpacing="1">✦ ✦ ✦</text>
        </g>
      </svg>

      <div className="text-center">
        <p className="font-[family-name:var(--font-display)] text-[1.05rem] italic text-[color:var(--color-ink)]">
          To: <span className="font-semibold not-italic">{email}</span>
        </p>
        <p className="mt-1 text-[0.78rem] uppercase tracking-[0.18em] text-[color:var(--color-ink-soft)]">
          Expires in 1 hour
        </p>
      </div>
    </div>
  );
}
