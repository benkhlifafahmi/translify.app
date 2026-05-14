"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getSubscription, type Subscription } from "@/lib/billing";
import { getToken } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

/**
 * Loud, persistent trial nudge for Free users.
 *
 * Shown on every authenticated page. Renders nothing for paid users (Reader,
 * Scholar, Family) and for users who haven't loaded a subscription yet.
 */
export function TrialBanner() {
  const { t } = useI18n();
  const enabled = typeof window !== "undefined" && !!getToken();

  const { data: sub } = useQuery<Subscription>({
    queryKey: ["subscription"],
    queryFn: getSubscription,
    enabled,
    staleTime: 60_000,
  });

  if (!sub || sub.plan !== "free") return null;

  const used = sub.usage.pages_uploaded;
  const limit = sub.quota.pages_per_month;
  const exhausted = used >= limit;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`relative overflow-hidden border-b text-sm ${
        exhausted
          ? "border-[color:var(--color-coral-deep)]/40 bg-gradient-to-r from-[color:var(--color-coral)]/15 via-[color:var(--color-coral)]/22 to-[color:var(--color-coral)]/15 text-[color:var(--color-coral-deep)]"
          : "border-[color:var(--color-saffron-deep)]/35 bg-gradient-to-r from-[color:var(--color-saffron)]/15 via-[color:var(--color-saffron)]/25 to-[color:var(--color-saffron)]/15 text-[color:var(--color-saffron-deep)]"
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 py-2.5 lg:px-10">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/60 text-base font-bold">
          {exhausted ? "!" : "✦"}
        </span>
        <p className="flex-1 leading-snug">
          {exhausted ? (
            <>
              <strong className="font-semibold">{t("trial.exhaustedBold")}</strong>{" "}
              {t("trial.exhaustedRest", { used, limit })}
            </>
          ) : (
            <>
              <strong className="font-semibold">{t("trial.activeBold")}</strong> ·{" "}
              <span className="tabular-nums">
                {used} / {limit}
              </span>{" "}
              {t("trial.activeRest")}
            </>
          )}
        </p>
        <Link
          href="/account?upgrade=trial"
          className={`shrink-0 rounded-full px-4 py-1.5 text-[0.78rem] font-bold tracking-wide transition-transform hover:-translate-y-[1px] ${
            exhausted
              ? "bg-[color:var(--color-coral-deep)] text-white shadow-[0_2px_0_rgba(140,40,30,0.4)]"
              : "bg-[color:var(--color-ink)] text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4)]"
          }`}
        >
          {exhausted ? t("trial.pickPlan") : t("trial.upgrade")}
        </Link>
      </div>
    </div>
  );
}
