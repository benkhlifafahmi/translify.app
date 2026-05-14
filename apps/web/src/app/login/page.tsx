"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getGoogleAuthUrl, login, requestMagicLink } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { AuthShell } from "@/components/auth-shell";
import { useI18n } from "@/lib/i18n";

/**
 * Magic-link-first sign-in.
 *
 * Defaults to "send me a sign-in link" because /join-created accounts have
 * an unguessable random password the user has never seen — passwords are
 * an opt-in second method (set via /forgot-password). Users who *do* have
 * a password can expand "Sign in with password" and use the classic form.
 */
export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkErr, setLinkErr] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwErr, setPwErr] = useState<string | null>(null);

  const [googleLoading, setGoogleLoading] = useState(false);

  const onSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!ok) { setLinkErr(t("login.errLink")); return; }
    setLinkErr(null); setLinkBusy(true);
    try {
      await requestMagicLink(email);
      setLinkSent(true);
    } catch {
      // The endpoint always returns 202 to prevent enumeration — surface a
      // generic "sent" state regardless.
      setLinkSent(true);
    } finally { setLinkBusy(false); }
  };

  const onSignInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setPwErr(t("login.errBoth")); return; }
    setPwErr(null); setPwBusy(true);
    try {
      await login(email, password);
      router.push("/library");
    } catch (err) {
      setPwErr(
        err instanceof ApiError
          ? t("login.errMismatch")
          : t("login.errFallback"),
      );
    } finally { setPwBusy(false); }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const url = await getGoogleAuthUrl("https://translify.app/auth/google/callback");
      window.location.href = url;
    } catch {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow={t("auth.login.eyebrow")}
      title={t("auth.login.title")}
      subtitle={t("login.subtitle")}
    >
      {/* Google */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border-2 text-[0.95rem] font-semibold transition-all hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50"
        style={{ borderColor: "var(--color-border-strong)", background: "white", color: "var(--color-ink)", boxShadow: "0 2px 0 rgba(74,60,30,0.08)" }}
      >
        {googleLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.25-.164-1.84H9v3.48h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.706 17.64 9.2z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
          </svg>
        )}
        {googleLoading ? t("login.googleRedirecting") : t("login.google")}
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
        <span className="text-[0.72rem] font-semibold text-[color:var(--color-ink-soft)]">{t("login.or")}</span>
        <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
      </div>

      {/* Magic-link form */}
      {!linkSent ? (
        <form onSubmit={onSendLink} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{t("auth.login.email")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t("login.emailPlaceholder")}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {linkErr && (
            <div className="rounded-xl border border-[color:var(--color-destructive)]/30 bg-[color:var(--color-destructive)]/8 px-4 py-3 text-sm text-[color:var(--color-destructive)]">
              {linkErr}
            </div>
          )}

          <Button type="submit" variant="accent" size="lg" disabled={linkBusy}>
            {linkBusy ? t("login.sending") : t("login.sendLink")}
          </Button>
        </form>
      ) : (
        <div
          className="flex flex-col items-center gap-2 rounded-2xl border-2 px-5 py-6 text-center"
          style={{ borderColor: "var(--color-sage-deep)", background: "rgba(123,161,124,0.07)" }}
        >
          <span className="grid h-10 w-10 place-items-center rounded-full text-white" style={{ background: "var(--color-sage-deep)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <p className="font-[family-name:var(--font-display)] text-[1.05rem] font-semibold" style={{ color: "var(--color-ink)" }}>
            {t("login.checkInbox")}
          </p>
          <p className="max-w-[28ch] text-[0.88rem]" style={{ color: "var(--color-ink-soft)" }}>
            {t("login.sentTo.pre")}
            <span className="font-semibold" style={{ color: "var(--color-ink)" }}>{email}</span>
            {t("login.sentTo.post")}
          </p>
          <button
            type="button"
            onClick={() => { setLinkSent(false); }}
            className="mt-1 text-[0.82rem] font-semibold underline underline-offset-4"
            style={{ color: "var(--color-ink-soft)" }}
          >
            {t("login.differentEmail")}
          </button>
        </div>
      )}

      {/* Password fallback — collapsed by default. */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
        <button
          type="button"
          onClick={() => setShowPassword((s) => !s)}
          className="text-[0.78rem] font-semibold text-[color:var(--color-ink-soft)] underline decoration-[color:var(--color-saffron)] decoration-2 underline-offset-4 hover:text-[color:var(--color-ink)]"
        >
          {showPassword ? t("login.hidePassword") : t("login.usePassword")}
        </button>
        <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
      </div>

      {showPassword && (
        <form onSubmit={onSignInWithPassword} className="flex flex-col gap-4 animate-float-in">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="pw-password">{t("auth.login.password")}</Label>
              <Link
                href="/forgot-password"
                className="text-[0.78rem] font-semibold text-[color:var(--color-ink-soft)] underline decoration-[color:var(--color-saffron)] decoration-2 underline-offset-4 hover:text-[color:var(--color-ink)]"
              >
                {t("login.forgotIt")}
              </Link>
            </div>
            <Input
              id="pw-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-[0.74rem]" style={{ color: "var(--color-ink-soft)" }}>
              {t("login.noPassword")}{" "}
              <Link
                href="/forgot-password"
                className="font-semibold underline underline-offset-4"
                style={{ color: "var(--color-ink-soft)" }}
              >
                {t("login.setHere")}
              </Link>
              .
            </p>
          </div>

          {pwErr && (
            <div className="rounded-xl border border-[color:var(--color-destructive)]/30 bg-[color:var(--color-destructive)]/8 px-4 py-3 text-sm text-[color:var(--color-destructive)]">
              {pwErr}
            </div>
          )}

          <Button type="submit" variant="accent" size="lg" disabled={pwBusy}>
            {pwBusy ? t("auth.login.submitting") : t("auth.login.submit")}
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-[color:var(--color-ink-soft)]">
        {t("auth.login.new")}{" "}
        <Link
          href="/join"
          className="font-semibold text-[color:var(--color-ink)] underline decoration-[color:var(--color-saffron)] decoration-2 underline-offset-4 hover:decoration-[color:var(--color-saffron-deep)]"
        >
          {t("auth.login.makeAccount")}
        </Link>
      </p>
    </AuthShell>
  );
}
