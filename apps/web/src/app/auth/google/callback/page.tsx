"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lumi } from "@/components/lumi/lumi";
import { TranslifyIcon } from "@/components/translify-mark";
import { loginWithGoogleCallback } from "@/lib/auth";
import { ApiError } from "@/lib/api";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";
const CALLBACK_URL = `${SITE}/auth/google/callback`;

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errMsg, setErrMsg] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const code  = params.get("code");
    const state = params.get("state");
    const error = params.get("error");

    if (error || !code || !state) {
      setErrMsg(
        error === "access_denied"
          ? "You cancelled the Google sign-in."
          : "Google login failed. Please try again.",
      );
      setStatus("error");
      return;
    }

    loginWithGoogleCallback(code, state, CALLBACK_URL)
      .then(() => router.replace("/library?welcome=1"))
      .catch((e) => {
        setErrMsg(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
        setStatus("error");
      });
  }, [params, router]);

  return (
    <>
      {status === "loading" ? (
        <div className="flex flex-col items-center gap-4">
          <Lumi state="thinking" size={96} animate />
          <p
            className="font-[family-name:var(--font-display)] text-[1rem] font-medium"
            style={{ color: "var(--color-ink-soft)" }}
          >
            Signing you in with Google…
          </p>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full"
                style={{
                  background: "var(--color-saffron)",
                  animation: `dot-bounce 0.9s ease-in-out ${i * 0.22}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div
          className="mx-4 max-w-sm rounded-3xl border-2 p-8 text-center"
          style={{
            borderColor: "var(--color-border)",
            background: "white",
            boxShadow: "0 6px 0 rgba(74,60,30,0.10)",
          }}
        >
          <Lumi state="sad" size={80} animate />
          <h2
            className="mt-4 font-[family-name:var(--font-display)] text-[1.3rem] font-semibold"
            style={{ color: "var(--color-ink)" }}
          >
            Oops, something went wrong
          </h2>
          <p className="mt-2 text-[0.9rem]" style={{ color: "var(--color-ink-soft)" }}>
            {errMsg}
          </p>
          <button
            type="button"
            onClick={() => router.push("/join")}
            className="mt-6 h-11 w-full rounded-2xl font-[family-name:var(--font-display)] text-[0.95rem] font-bold text-white"
            style={{
              background: "linear-gradient(to bottom,#EDB86A,#D09040)",
              boxShadow: "0 5px 0 rgba(152,96,24,0.45)",
            }}
          >
            Try again →
          </button>
        </div>
      )}
      <style>{`@keyframes dot-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-8px)}}`}</style>
    </>
  );
}

export default function GoogleCallbackPage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6"
      style={{
        background: "var(--color-paper)",
        backgroundImage:
          "radial-gradient(circle, rgba(74,60,30,0.07) 1.5px, transparent 1.5px)",
        backgroundSize: "26px 26px",
      }}
    >
      <div className="flex items-center gap-2.5" style={{ color: "var(--color-ink)" }}>
        <TranslifyIcon size={28} />
        <span className="font-[family-name:var(--font-display)] text-[1.05rem] font-semibold tracking-tight">
          Translify
        </span>
      </div>

      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-4">
            <Lumi state="thinking" size={96} animate />
            <p
              className="font-[family-name:var(--font-display)] text-[1rem] font-medium"
              style={{ color: "var(--color-ink-soft)" }}
            >
              Signing you in with Google…
            </p>
          </div>
        }
      >
        <CallbackInner />
      </Suspense>
    </div>
  );
}
