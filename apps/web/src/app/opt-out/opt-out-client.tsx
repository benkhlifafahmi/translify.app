"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TranslifyIcon } from "@/components/translify-mark";

/* ─── Data manifest ─────────────────────────────────────── */

const ERASURES = [
  { icon: "📚", label: "All uploaded books & documents" },
  { icon: "✏️", label: "Translations, annotations & highlights" },
  { icon: "📖", label: "Reading progress & bookmarks" },
  { icon: "💬", label: "AI conversation history" },
  { icon: "🎯", label: "Quiz results & learning data" },
  { icon: "👤", label: "Account profile & subscription record" },
];

const REASONS = [
  "I no longer use Translify",
  "I'm switching to another service",
  "Privacy or data concerns",
  "I didn't find it useful enough",
  "Technical issues",
  "I prefer not to say",
];

/* ─── Shell ─────────────────────────────────────────────── */

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      {/* Subtle coral-tinted grain layer */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(at 15% 10%, rgba(226,120,108,0.10) 0, transparent 50%), " +
            "radial-gradient(at 85% 85%, rgba(107,91,149,0.07) 0, transparent 45%)",
        }}
      />

      {/* Nav bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <Link
          href="/"
          className="flex items-center gap-2 font-[family-name:var(--font-display)] text-[1.05rem] font-semibold tracking-tight text-[color:var(--color-ink)] opacity-80 transition-opacity hover:opacity-100"
          aria-label="Back to Translify home"
        >
          <TranslifyIcon size={28} />
          Translify
        </Link>
        <Link
          href="/"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-paper-2)] px-4 text-[0.8rem] font-semibold text-[color:var(--color-ink-soft)] shadow-[var(--shadow-paper)] transition-all hover:-translate-y-[1px] hover:shadow-[var(--shadow-paper-lg)]"
        >
          ← Back
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-2xl px-5 pb-24 pt-6 sm:px-8">
        {children}
      </main>
    </div>
  );
}

/* ─── Prefill bridge (needs Suspense) ───────────────────── */

function OptOutForm() {
  const params = useSearchParams();
  const prefill = params.get("email") ?? "";
  return <FormBody prefillEmail={prefill} />;
}

/* ─── Main export ────────────────────────────────────────── */

export function OptOutClient() {
  return (
    <PageShell>
      <Suspense fallback={<FormBody prefillEmail="" />}>
        <OptOutForm />
      </Suspense>
    </PageShell>
  );
}

/* ─── Form body ─────────────────────────────────────────── */

function FormBody({ prefillEmail }: { prefillEmail: string }) {
  const [email, setEmail] = useState(prefillEmail);
  const [reason, setReason] = useState("");
  const [ack, setAck] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!prefillEmail) emailRef.current?.focus();
  }, [prefillEmail]);

  const valid = /\S+@\S+\.\S+/.test(email) && ack;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;

    const sub = encodeURIComponent("Account Deletion Request — Translify");
    const body = encodeURIComponent(
      `Please delete my Translify account and all associated data.\n\nEmail: ${email}\nReason: ${reason || "Not specified"}\n\nI acknowledge that this is permanent and irreversible.`
    );
    window.open(`mailto:hello@translify.app?subject=${sub}&body=${body}`, "_self");

    setAnimateOut(true);
    setTimeout(() => setSubmitted(true), 250);
  }

  if (submitted) return <SuccessState email={email} />;

  return (
    <div
      className="transition-all duration-200"
      style={{ opacity: animateOut ? 0 : 1, transform: animateOut ? "translateY(-8px)" : "none" }}
    >
      {/* ── Eyebrow + Title ── */}
      <div className="mb-8 animate-float-in">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-coral-deep)]/30 bg-[color:var(--color-coral)]/10 px-3.5 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-coral-deep)]" />
          <span className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[color:var(--color-coral-deep)]">
            Data & Privacy
          </span>
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.2rem,5vw,3rem)] font-semibold leading-[1.05] tracking-tight text-[color:var(--color-ink)]">
          Delete your data
        </h1>
        <p className="mt-3 max-w-lg text-[0.97rem] leading-relaxed text-[color:var(--color-ink-soft)]">
          Submit a deletion request and we&apos;ll permanently erase your account within{" "}
          <strong className="text-[color:var(--color-ink)]">30 days</strong>, as required by
          applicable privacy laws (GDPR, CCPA).
        </p>
      </div>

      {/* ── What gets erased ── */}
      <div className="card-paper-lifted mb-6 animate-float-in overflow-hidden p-6 [animation-delay:80ms]">
        <p className="mb-4 text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[color:var(--color-coral-deep)]">
          Everything that will be erased
        </p>
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {ERASURES.map(({ icon, label }) => (
            <li key={label} className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-coral)]/12 text-sm">
                {icon}
              </span>
              <span className="text-[0.88rem] leading-tight text-[color:var(--color-ink-soft)]">
                {label}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-5 rounded-xl border border-[color:var(--color-coral-deep)]/25 bg-[color:var(--color-coral)]/8 px-4 py-3 text-[0.82rem] leading-relaxed text-[color:var(--color-coral-deep)]">
          <strong>Subscriptions are not automatically cancelled.</strong> If you have an active
          plan, cancel it via{" "}
          <Link href="/account" className="underline underline-offset-2">
            Account → Subscription
          </Link>{" "}
          before requesting deletion to avoid future charges.
        </p>
      </div>

      {/* ── Form ── */}
      <form
        onSubmit={handleSubmit}
        className="card-paper-lifted animate-float-in space-y-5 p-6 [animation-delay:160ms] sm:p-8"
      >
        <div className="border-b border-dashed border-[color:var(--color-border)] pb-5">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[color:var(--color-saffron-deep)]">
            Your request
          </p>
          <p className="mt-1 text-[0.88rem] text-[color:var(--color-ink-soft)]">
            We&apos;ll send a confirmation to the address below once deletion is complete.
          </p>
        </div>

        {/* Email */}
        <label className="flex flex-col gap-1.5">
          <span className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[color:var(--color-ink-soft)]">
            Account email
          </span>
          <input
            ref={emailRef}
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="paper-input"
          />
        </label>

        {/* Reason */}
        <label className="flex flex-col gap-1.5">
          <span className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[color:var(--color-ink-soft)]">
            Reason{" "}
            <span className="font-normal normal-case tracking-normal opacity-60">(optional)</span>
          </span>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="paper-input cursor-pointer appearance-none"
            style={{ backgroundImage: "none" }}
          >
            <option value="">Select a reason…</option>
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        {/* Acknowledgement */}
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-paper-2)] p-4 transition-colors has-[:checked]:border-[color:var(--color-coral-deep)]/40 has-[:checked]:bg-[color:var(--color-coral)]/8">
          <input
            type="checkbox"
            checked={ack}
            onChange={(e) => setAck(e.target.checked)}
            className="ring-focus mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--color-coral-deep)]"
          />
          <span className="text-[0.88rem] leading-snug text-[color:var(--color-ink-soft)]">
            I understand that deleting my account is{" "}
            <strong className="text-[color:var(--color-ink)]">permanent and irreversible</strong>.
            All data will be erased and cannot be recovered.
          </span>
        </label>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[color:var(--color-border)] bg-transparent px-6 text-[0.88rem] font-semibold text-[color:var(--color-ink-soft)] transition-all hover:bg-[color:var(--color-paper-2)]"
          >
            Never mind
          </Link>
          <button
            type="submit"
            disabled={!valid}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[color:var(--color-coral-deep)] px-7 text-[0.9rem] font-semibold text-white shadow-[0_3px_0_rgba(140,40,30,0.35)] transition-all hover:-translate-y-[1px] hover:shadow-[0_4px_0_rgba(140,40,30,0.3)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:shadow-[0_3px_0_rgba(140,40,30,0.35)]"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
              <path
                d="M5.5 1H9.5M2 3.5H13M11.5 3.5L11 10.5C10.9 11.3 10.2 12 9.4 12H5.6C4.8 12 4.1 11.3 4 10.5L3.5 3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Submit deletion request
          </button>
        </div>
      </form>

      {/* Footer links */}
      <p className="mt-8 text-center text-[0.8rem] text-[color:var(--color-ink-soft)] [animation-delay:240ms] animate-float-in">
        Questions?{" "}
        <a href="mailto:hello@translify.app" className="underline underline-offset-2 hover:text-[color:var(--color-ink)]">
          hello@translify.app
        </a>
        {" · "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-[color:var(--color-ink)]">
          Privacy policy
        </Link>
      </p>
    </div>
  );
}

/* ─── Success state ─────────────────────────────────────── */

function SuccessState({ email }: { email: string }) {
  return (
    <div className="animate-pop-in py-8">
      {/* Icon */}
      <div className="mb-8 flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[color:var(--color-sage-deep)]/30 bg-[color:var(--color-sage)]/15 shadow-[var(--shadow-paper-lg)]">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 13l4 4L19 7"
              stroke="var(--color-sage-deep)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <div className="mb-10 text-center">
        <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[color:var(--color-sage-deep)]">
          Request submitted
        </p>
        <h2 className="font-[family-name:var(--font-display)] text-[2.2rem] font-semibold tracking-tight">
          We&apos;ve received your request
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-[0.95rem] leading-relaxed text-[color:var(--color-ink-soft)]">
          Your account and all associated data will be permanently deleted within{" "}
          <strong className="text-[color:var(--color-ink)]">30 days</strong>.
          {email && (
            <>
              {" "}We&apos;ll send a confirmation to{" "}
              <strong className="text-[color:var(--color-ink)]">{email}</strong>.
            </>
          )}
        </p>
      </div>

      <div className="card-paper-lifted mx-auto max-w-md space-y-3 p-6 text-[0.88rem] leading-relaxed text-[color:var(--color-ink-soft)]">
        <p className="font-semibold text-[color:var(--color-ink)]">What happens next</p>
        <ol className="space-y-2">
          {[
            "Our team reviews your request within 2 business days.",
            "If you have an active subscription, cancel it via the Stripe portal to avoid future charges.",
            "All your data is permanently erased within 30 days.",
            "You'll receive an email confirmation once deletion is complete.",
          ].map((s, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-paper-3)] text-[0.7rem] font-bold text-[color:var(--color-ink-soft)]">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          href="/"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[color:var(--color-ink)] px-7 text-[0.9rem] font-semibold text-[color:var(--color-paper)] shadow-[var(--shadow-paper-lg)] transition-all hover:-translate-y-[1px]"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
