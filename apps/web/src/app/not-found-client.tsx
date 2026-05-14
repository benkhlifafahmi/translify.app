"use client";

import Link from "next/link";
import { Lumi } from "@/components/lumi/lumi";
import { useI18n } from "@/lib/i18n";

export default function NotFoundClient() {
  const { t } = useI18n();
  return (
    <main className="relative grid min-h-screen place-items-center px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[color:var(--color-saffron)]/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[color:var(--color-sage)]/12 blur-3xl"
      />

      <div className="relative text-center">
        <div className="mx-auto mb-2 inline-block">
          <Lumi state="confused" size={180} animate />
        </div>

        <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-[color:var(--color-saffron-deep)]">
          {t("notFound.eyebrow")}
        </p>

        <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,3.4rem)] font-semibold leading-[1.05] tracking-tight">
          {t("notFound.title.pre")}{" "}
          <em className="italic text-[color:var(--color-saffron-deep)]">
            {t("notFound.title.em")}
          </em>
        </h1>

        <p className="mx-auto mt-4 max-w-md text-[0.95rem] leading-relaxed text-[color:var(--color-ink-soft)]">
          {t("notFound.body")}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-[color:var(--color-saffron)] px-5 font-semibold text-[color:var(--color-accent-foreground)] shadow-[0_2px_0_rgba(140,90,30,0.5),0_10px_22px_-8px_rgba(200,137,62,0.6)] transition-transform hover:-translate-y-[2px]"
          >
            {t("notFound.cta.library")}
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-11 items-center rounded-full border-[1.5px] border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)]/60 px-5 font-semibold text-[color:var(--color-ink)] hover:bg-[color:var(--color-paper-2)]"
          >
            {t("notFound.cta.contact")}
          </Link>
        </div>
      </div>
    </main>
  );
}
