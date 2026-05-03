"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { resetPassword } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useI18n();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <AuthShell
        eyebrow={t("auth.reset.eyebrow")}
        title="A missing key."
        subtitle={t("auth.reset.invalid")}
      >
        <Link
          href="/forgot-password"
          className="inline-flex h-12 items-center rounded-full bg-[color:var(--color-ink)] px-6 font-semibold text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4)] transition-transform hover:-translate-y-[1px]"
        >
          {t("auth.verify.cta.resend")}
        </Link>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell
        eyebrow={t("auth.reset.eyebrow")}
        title={t("auth.reset.done.title")}
        subtitle={t("auth.reset.done.body")}
      >
        <Link
          href="/login"
          className="inline-flex h-12 items-center rounded-full bg-[color:var(--color-ink)] px-7 font-semibold text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4),0_10px_22px_-8px_rgba(20,16,8,0.4)] transition-transform hover:-translate-y-[1px]"
        >
          {t("auth.reset.done.cta")} →
        </Link>
      </AuthShell>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError(t("auth.reset.mismatch"));
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push("/login"), 4000);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 400 || err.status === 401)) {
        setError(t("auth.reset.invalid"));
      } else {
        setError(err instanceof ApiError ? err.message : "Couldn't set new password.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow={t("auth.reset.eyebrow")}
      title={t("auth.reset.title")}
      subtitle={t("auth.reset.subtitle")}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t("auth.reset.password")}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm">{t("auth.reset.confirm")}</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            placeholder="Type it once more"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-xl border border-[color:var(--color-destructive)]/30 bg-[color:var(--color-destructive)]/8 px-4 py-3 text-sm text-[color:var(--color-destructive)]">
            {error}
          </div>
        )}

        <Button type="submit" variant="accent" size="lg" disabled={submitting}>
          {submitting ? t("auth.reset.submitting") : t("auth.reset.submit")}
        </Button>
      </form>
    </AuthShell>
  );
}
