"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { redeemMagicLink } from "@/lib/auth";
import { Lumi } from "@/components/lumi/lumi";
import { TranslifyIcon } from "@/components/translify-mark";

export function MagicLoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setErr("This link is missing its token — request a new one from the sign-in page.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await redeemMagicLink(token);
        if (!cancelled) router.replace("/library?welcome=1");
      } catch (e) {
        if (cancelled) return;
        setErr(
          e instanceof ApiError
            ? e.message
            : "Couldn't sign you in. The link may have expired — request a new one.",
        );
      }
    })();
    return () => { cancelled = true; };
  }, [token, router]);

  return (
    <div
      className="grid min-h-[100dvh] place-items-center px-6 py-12"
      style={{
        background: "var(--color-paper)",
        backgroundImage: "radial-gradient(circle, rgba(74,60,30,0.06) 1.4px, transparent 1.4px)",
        backgroundSize: "26px 26px",
      }}
    >
      <div className="flex max-w-md flex-col items-center text-center">
        <Link
          href="/"
          className="mb-6 flex items-center gap-2"
          style={{ color: "var(--color-ink)" }}
        >
          <TranslifyIcon size={28} />
          <span className="font-[family-name:var(--font-display)] text-[1rem] font-semibold tracking-tight">
            Translify
          </span>
        </Link>

        {!err ? (
          <>
            <Lumi state="thinking" size={108} animate />
            <h1
              className="mt-6 font-[family-name:var(--font-display)] text-[1.6rem] font-semibold leading-tight"
              style={{ color: "var(--color-ink)" }}
            >
              Opening your shelf…
            </h1>
            <p className="mt-2 text-[0.95rem]" style={{ color: "var(--color-ink-soft)" }}>
              One moment while we sign you in.
            </p>
            <div className="mt-6 flex gap-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-2 w-2 rounded-full"
                  style={{
                    background: "var(--color-saffron-deep)",
                    animation: `dot-bounce 0.9s ease-in-out ${i * 0.22}s infinite`,
                  }}
                />
              ))}
            </div>
            <style>{`@keyframes dot-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-8px)}}`}</style>
          </>
        ) : (
          <>
            <Lumi state="sad" size={108} animate />
            <h1
              className="mt-6 font-[family-name:var(--font-display)] text-[1.5rem] font-semibold leading-tight"
              style={{ color: "var(--color-ink)" }}
            >
              We couldn&apos;t open this link.
            </h1>
            <p className="mt-2 text-[0.92rem]" style={{ color: "var(--color-ink-soft)" }}>
              {err}
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl px-6 font-[family-name:var(--font-display)] text-[0.95rem] font-bold text-white transition-all active:translate-y-1"
              style={{
                background: "linear-gradient(to bottom,#EDB86A,#D09040)",
                boxShadow: "0 4px 0 rgba(152,96,24,0.55)",
              }}
            >
              Sign in →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
