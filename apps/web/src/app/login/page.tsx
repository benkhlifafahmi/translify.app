"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, getGoogleAuthUrl } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { AuthShell } from "@/components/auth-shell";
import { useI18n } from "@/lib/i18n";


export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/library");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const [googleLoading, setGoogleLoading] = useState(false);

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
      subtitle={t("auth.login.subtitle")}
    >
      {/* Google button */}
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
        {googleLoading ? "Redirecting…" : "Continue with Google"}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
        <span className="text-[0.72rem] font-semibold text-[color:var(--color-ink-soft)]">or</span>
        <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{t("auth.login.email")}</Label>
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
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="password">{t("auth.login.password")}</Label>
            <Link
              href="/forgot-password"
              className="text-[0.78rem] font-semibold text-[color:var(--color-ink-soft)] underline decoration-[color:var(--color-saffron)] decoration-2 underline-offset-4 hover:text-[color:var(--color-ink)]"
            >
              Forgot it?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-xl border border-[color:var(--color-destructive)]/30 bg-[color:var(--color-destructive)]/8 px-4 py-3 text-sm text-[color:var(--color-destructive)]">
            {error}
          </div>
        )}

        <Button type="submit" variant="accent" size="lg" disabled={submitting}>
          {submitting ? t("auth.login.submitting") : t("auth.login.submit")}
        </Button>
      </form>

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
