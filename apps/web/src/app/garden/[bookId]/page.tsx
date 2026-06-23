"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { TranslifyMark } from "@/components/translify-mark";
import { Button } from "@/components/ui/button";
import { GardenPlate } from "@/components/garden/garden-plate";
import { VitalityPanel } from "@/components/garden/vitality-panel";
import { WeeklyTendingCard } from "@/components/garden/weekly-tending-card";
import { GrowthJournal } from "@/components/garden/growth-journal";
import { SpeciesPicker } from "@/components/garden/species-picker";
import { FarmerDesigner } from "@/components/garden/farmer-designer";
import { OtherGardens } from "@/components/garden/other-gardens";
import { getToken } from "@/lib/api";
import { logout, me, type User } from "@/lib/auth";
import {
  daysSince,
  getGarden,
  listGardens,
  type Garden,
  type GardenSummary,
} from "@/lib/garden";
import { useI18n } from "@/lib/i18n";

export default function GardenDetailPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = use(params);
  const router = useRouter();
  const { t, locale } = useI18n();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !getToken()) router.replace("/login");
  }, [mounted, router]);

  const enabled = mounted && !!getToken();

  const { data: user } = useQuery<User>({ queryKey: ["me"], queryFn: me, enabled });
  const { data: garden, isLoading: gardenLoading } = useQuery<Garden>({
    queryKey: ["garden", bookId],
    queryFn: () => getGarden(bookId),
    enabled,
  });
  const { data: gardens } = useQuery<GardenSummary[]>({
    queryKey: ["gardens"],
    queryFn: listGardens,
    enabled,
  });

  if (!mounted || gardenLoading || !garden) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-[color:var(--color-ink-soft)]">{t("garden.specimen.loading")}</p>
      </main>
    );
  }

  const startedAt = new Date(garden.startedAt).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <main className="relative min-h-screen pb-24">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-24 h-96 w-96 rounded-full bg-[color:var(--color-sage)]/12 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-40 h-[24rem] w-[24rem] rounded-full bg-[color:var(--color-saffron)]/10 blur-3xl"
      />

      {/* NAV */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between border-b border-[color:var(--color-border)] px-6 py-5 lg:px-10">
        <TranslifyMark href="/library" size={36} wordmarkClassName="text-xl" />

        <nav className="hidden gap-7 text-[12px] uppercase tracking-[0.18em] text-[color:var(--color-ink-soft)] md:flex">
          <Link href="/library" className="transition-colors hover:text-[color:var(--color-ink)]">{t("library.title")}</Link>
          <Link href="/garden" className="relative text-[color:var(--color-ink)]">
            {t("bookCard.garden")}
            <span aria-hidden className="absolute -bottom-1.5 left-0 right-0 h-[2px] bg-[color:var(--color-coral)]" />
          </Link>
          <Link href="/account" className="transition-colors hover:text-[color:var(--color-ink)]">{t("garden.account")}</Link>
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-[color:var(--color-ink-soft)] sm:inline">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={async () => { await logout(); router.replace("/login"); }}>
            {t("garden.logOut")}
          </Button>
        </div>
      </header>

      {/* META */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 lg:px-10">
        <div className="mt-9 flex justify-between font-[family-name:var(--font-display)] text-[13px] uppercase tracking-[0.08em] italic text-[color:var(--color-muted-foreground)]">
          <span>
            {t("gpage.plate", { n: garden.bookId.slice(-2) })}
            <Dot />
            {t("gpage.volume")}
            <Dot />
            {t("gpage.cultivatedSince", { date: startedAt })}
            <Dot />
            {t("gpage.day", { n: daysSince(garden.startedAt) })}
          </span>
          <span className="hidden sm:inline">
            {t("gpage.climate")}
            <Dot />
            {t("gpage.reader", { name: garden.farmer.name })}
          </span>
        </div>

        {/* HEADLINE */}
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(48px,7.4vw,104px)] font-light leading-[0.94] tracking-[-0.025em]">
          <span className="italic text-[color:var(--color-coral)] tracking-tight">{t("gpage.gardenOf")}</span>{" "}
          <span className="block font-medium italic">{garden.bookTitle}</span>
        </h1>

        <p className="mt-3 max-w-[580px] font-[family-name:var(--font-display)] text-[18px] italic text-[color:var(--color-ink-soft)]">
          <span className="float-left mr-2.5 pt-1.5 font-[family-name:var(--font-display)] text-[68px] not-italic font-medium leading-[0.85] text-[color:var(--color-sage-deep)]">
            {t("gpage.dropcap")}
          </span>
          {t("gpage.intro")}
        </p>

        {/* ornament */}
        <div className="mt-10 mb-7 flex items-center gap-3.5 text-[color:var(--color-muted-foreground)]">
          <hr className="flex-1 border-[color:var(--color-border)]" />
          <svg width="24" height="14" viewBox="0 0 24 14" aria-hidden>
            <path d="M0 7 Q 6 0, 12 7 T 24 7" stroke="currentColor" strokeWidth="1" fill="none" />
            <circle cx="12" cy="7" r="1.4" fill="currentColor" />
          </svg>
          <hr className="flex-1 border-[color:var(--color-border)]" />
        </div>

        {/* STAGE: plate + panel */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <GardenPlate garden={garden} />
          <aside className="flex flex-col gap-6">
            <VitalityPanel garden={garden} />
            <WeeklyTendingCard garden={garden} />
          </aside>
        </div>

        {/* JOURNAL + SIDECAR */}
        <section className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
          <GrowthJournal entries={garden.journal} />

          <aside className="rounded-sm border border-[color:var(--color-border)] bg-[linear-gradient(180deg,#FFFCF3_0%,var(--color-paper-2)_100%)] p-6">
            <SpeciesPicker selected={garden.species} />
            <div className="mt-5">
              <FarmerDesigner initial={garden.farmer} />
            </div>
          </aside>
        </section>

        {/* OTHER GARDENS */}
        {gardens && gardens.length > 1 && (
          <OtherGardens gardens={gardens.filter((g) => g.bookId !== garden.bookId)} />
        )}

        {/* COLOPHON */}
        <footer className="mt-20 flex items-baseline justify-between border-t border-[color:var(--color-border)] pt-6 font-[family-name:var(--font-display)] text-[13px] italic text-[color:var(--color-muted-foreground)]">
          <div className="max-w-[480px]">
            <small className="text-[11px] not-italic uppercase tracking-[0.2em]">{t("gpage.colophon")}</small>
            <br />
            {t("gpage.colophonText")}
          </div>
          <div className="text-right">
            <small className="text-[11px] not-italic uppercase tracking-[0.2em]">Translify Almanac</small>
            <br />
            <em>{t("gpage.almanacRef", { p: garden.bookId.slice(-2), year: new Date().getFullYear() })}</em>
          </div>
        </footer>
      </section>
    </main>
  );
}

function Dot() {
  return (
    <span
      aria-hidden
      className="mx-2 inline-block h-1 w-1 rounded-full bg-current align-middle"
    />
  );
}
