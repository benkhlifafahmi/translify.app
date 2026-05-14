"use client";

import Link from "next/link";
import type { QuotaError, UpgradeKind } from "@/lib/quota";
import { upgradeUrl } from "@/lib/quota";
import { useI18n } from "@/lib/i18n";

interface Props {
  error: QuotaError;
  kind: UpgradeKind;
  /** Optional inline tone: "card" (default, padded) or "compact" (in-flow strip). */
  tone?: "card" | "compact";
}

const HEADLINE_KEY: Record<UpgradeKind, string> = {
  pages: "upgrade.pages",
  quizzes: "upgrade.quizzes",
  chat: "upgrade.chat",
  translate: "upgrade.translate",
  no_plan: "upgrade.noPlan",
};

export function UpgradeNudge({ error, kind, tone = "card" }: Props) {
  const { t } = useI18n();
  const headline =
    error.error === "no_active_plan"
      ? t(HEADLINE_KEY.no_plan)
      : t(HEADLINE_KEY[kind] ?? HEADLINE_KEY.no_plan);

  const subline =
    error.error === "quota_exceeded" && error.limit !== undefined
      ? t("upgrade.usage", {
          used: error.used ?? "—",
          limit: error.limit,
          plan: error.plan ?? "—",
        })
      : error.message;

  if (tone === "compact") {
    return (
      <div className="flex items-center gap-3 rounded-xl border-[1.5px] border-[color:var(--color-saffron-deep)]/40 bg-[color:var(--color-saffron)]/12 px-3 py-2 text-xs text-[color:var(--color-saffron-deep)]">
        <span aria-hidden>✦</span>
        <span className="flex-1">{headline}.</span>
        <Link
          href={upgradeUrl(kind)}
          className="shrink-0 rounded-full bg-[color:var(--color-ink)] px-3 py-1 text-[0.7rem] font-bold text-[color:var(--color-paper)] transition-transform hover:-translate-y-[1px]"
        >
          {t("upgrade.upgrade")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-[1.5px] border-[color:var(--color-saffron-deep)]/40 bg-gradient-to-br from-[#FFFCF3] to-[#F8E9C5] px-5 py-5 text-center shadow-[var(--shadow-paper)]">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[color:var(--color-saffron)]/25 text-2xl text-[color:var(--color-saffron-deep)]">
        ✦
      </span>
      <div>
        <p className="font-[family-name:var(--font-display)] text-base font-semibold leading-tight tracking-tight text-[color:var(--color-ink)]">
          {headline}.
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--color-ink-soft)]">
          {subline}
        </p>
      </div>
      <Link
        href={upgradeUrl(kind)}
        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-[color:var(--color-ink)] px-5 text-sm font-semibold text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4)] transition-transform hover:-translate-y-[1px]"
      >
        {t("upgrade.seePlans")}
      </Link>
    </div>
  );
}
