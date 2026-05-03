"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { ApiError } from "@/lib/api";
import { requestVerificationResend, verifyEmail } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

type Phase = "checking" | "done" | "failed" | "missing";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}

function VerifyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useI18n();
  const token = params.get("token");

  const [phase, setPhase] = useState<Phase>(token ? "checking" : "missing");
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        await verifyEmail(token);
        if (!cancelled) setPhase("done");
      } catch (err) {
        // 400/401 = bad/expired token; everything else also lands here.
        if (!cancelled) {
          setPhase("failed");
          // swallow err, surface friendly copy
          void err;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Auto-redirect a few seconds after success.
  useEffect(() => {
    if (phase !== "done") return;
    const id = setTimeout(() => router.push("/library"), 3500);
    return () => clearTimeout(id);
  }, [phase, router]);

  const onResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendStatus("sending");
    try {
      await requestVerificationResend(resendEmail);
    } catch {
      // anti-enumeration — show "sent" regardless
    }
    setResendStatus("sent");
  };

  if (phase === "checking") {
    return (
      <AuthShell
        eyebrow={t("auth.verify.eyebrow")}
        title={t("auth.verify.title.checking")}
        subtitle={t("auth.verify.body.checking")}
      >
        <SealAnimation tone="working" />
      </AuthShell>
    );
  }

  if (phase === "done") {
    return (
      <AuthShell
        eyebrow={t("auth.verify.eyebrow")}
        title={t("auth.verify.title.done")}
        subtitle={t("auth.verify.body.done")}
      >
        <SealAnimation tone="done" />
        <Link
          href="/library"
          className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[color:var(--color-ink)] px-7 font-semibold text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4),0_10px_22px_-8px_rgba(20,16,8,0.4)] transition-transform hover:-translate-y-[1px]"
        >
          {t("auth.verify.cta.library")}
        </Link>
        <p className="mt-3 text-center text-[0.78rem] text-[color:var(--color-ink-soft)]">
          You'll be redirected automatically in a moment.
        </p>
      </AuthShell>
    );
  }

  // failed | missing
  return (
    <AuthShell
      eyebrow={t("auth.verify.eyebrow")}
      title={t("auth.verify.title.failed")}
      subtitle={t("auth.verify.body.failed")}
    >
      <SealAnimation tone="failed" />

      {resendStatus === "sent" ? (
        <div className="rounded-2xl border border-[color:var(--color-sage-deep)]/40 bg-[color:var(--color-sage)]/12 px-4 py-3 text-sm text-[color:var(--color-sage-deep)]">
          ✓ A fresh verification email is on its way (if that address is on file).
        </div>
      ) : (
        <form onSubmit={onResend} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[color:var(--color-ink-soft)]">
              Email
            </span>
            <input
              type="email"
              required
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder="you@example.com"
              className="paper-input"
            />
          </label>
          <button
            type="submit"
            disabled={resendStatus === "sending"}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[color:var(--color-ink)] px-6 font-semibold text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4)] transition-transform hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {resendStatus === "sending" ? "Posting…" : t("auth.verify.cta.resend")}
          </button>
        </form>
      )}

      <p className="mt-7 text-center text-sm text-[color:var(--color-ink-soft)]">
        <Link
          href="/login"
          className="font-semibold text-[color:var(--color-ink)] underline decoration-[color:var(--color-saffron)] decoration-2 underline-offset-4"
        >
          Back to login
        </Link>
      </p>
    </AuthShell>
  );
}

/** A wax-seal SVG with three states. The animation choreography is what
 *  gives the page presence — a single, well-orchestrated moment. */
function SealAnimation({ tone }: { tone: "working" | "done" | "failed" }) {
  const palette = {
    working: { stroke: "#C8893E", fill: "#E0A458", glyph: "T" },
    done: { stroke: "#5F8763", fill: "#7BA17C", glyph: "✓" },
    failed: { stroke: "#C5594D", fill: "#E2786C", glyph: "!" },
  }[tone];

  return (
    <div className="my-4 flex justify-center">
      <div className="relative h-32 w-32">
        {/* Wax drip backdrop */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-full opacity-40 blur-2xl"
          style={{ background: palette.fill }}
        />

        {/* The seal itself */}
        <svg viewBox="0 0 120 120" className="relative h-full w-full">
          <defs>
            <radialGradient id={`seal-${tone}`} cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
              <stop offset="55%" stopColor={palette.fill} stopOpacity="1" />
              <stop offset="100%" stopColor={palette.stroke} stopOpacity="1" />
            </radialGradient>
          </defs>

          {/* Decorative ring */}
          <circle
            cx="60"
            cy="60"
            r="48"
            fill="none"
            stroke={palette.stroke}
            strokeWidth="1.5"
            strokeDasharray="3 5"
            opacity="0.5"
            style={{
              transformOrigin: "60px 60px",
              animation: tone === "working" ? "seal-spin 8s linear infinite" : undefined,
            }}
          />

          {/* Seal body */}
          <circle
            cx="60"
            cy="60"
            r="38"
            fill={`url(#seal-${tone})`}
            stroke={palette.stroke}
            strokeWidth="2.5"
            style={{
              transformOrigin: "60px 60px",
              animation:
                tone === "done"
                  ? "seal-stamp 0.6s cubic-bezier(0.34,1.56,0.64,1) both"
                  : tone === "failed"
                    ? "seal-shake 0.5s ease-in-out both"
                    : "seal-pulse 1.6s ease-in-out infinite",
            }}
          />

          {/* Inner ring */}
          <circle
            cx="60"
            cy="60"
            r="32"
            fill="none"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1"
          />

          {/* Glyph */}
          <text
            x="60"
            y={tone === "working" ? "70" : "72"}
            textAnchor="middle"
            fontFamily="Georgia, serif"
            fontSize={tone === "working" ? "28" : "32"}
            fontStyle={tone === "working" ? "italic" : "normal"}
            fontWeight="600"
            fill="#FAF6EE"
            style={{
              filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.2))",
            }}
          >
            {palette.glyph}
          </text>

          {/* Decorative stars (only on done) */}
          {tone === "done" &&
            [
              [-30, -28],
              [40, -20],
              [-32, 30],
              [38, 32],
            ].map(([dx, dy], i) => (
              <text
                key={i}
                x={60 + dx}
                y={60 + dy}
                textAnchor="middle"
                fontFamily="Georgia"
                fontSize="14"
                fill={palette.stroke}
                style={{
                  animation: `seal-spark 0.6s ease-out both ${0.3 + i * 0.08}s`,
                  opacity: 0,
                }}
              >
                ✦
              </text>
            ))}
        </svg>
      </div>

      <style jsx>{`
        @keyframes seal-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes seal-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes seal-stamp {
          0% { transform: scale(1.8) rotate(-12deg); opacity: 0; }
          55% { transform: scale(0.92) rotate(-4deg); opacity: 1; }
          100% { transform: scale(1) rotate(-6deg); opacity: 1; }
        }
        @keyframes seal-shake {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-6deg); }
          40% { transform: rotate(5deg); }
          60% { transform: rotate(-4deg); }
          80% { transform: rotate(3deg); }
        }
        @keyframes seal-spark {
          0% { opacity: 0; transform: scale(0); }
          60% { opacity: 1; transform: scale(1.3); }
          100% { opacity: 0.7; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
