"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { AuthShell } from "@/components/auth-shell";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, password, displayName || undefined);
      router.push("/library");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Hello, reader"
      title="Make your shelf."
      subtitle="A cosy, private space for the books you read, the questions you have, and the things you learn."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="displayName">What should we call you?</Label>
          <Input
            id="displayName"
            placeholder="Optional"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
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
          <Label htmlFor="password">Password</Label>
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

        {error && (
          <div className="rounded-xl border border-[color:var(--color-destructive)]/30 bg-[color:var(--color-destructive)]/8 px-4 py-3 text-sm text-[color:var(--color-destructive)]">
            {error}
          </div>
        )}

        <Button type="submit" variant="accent" size="lg" disabled={submitting}>
          {submitting ? "Setting up your shelf…" : "Make my shelf"}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-[color:var(--color-ink-soft)]">
        Already have a shelf?{" "}
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
