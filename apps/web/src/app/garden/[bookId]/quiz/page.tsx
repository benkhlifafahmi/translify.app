"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { TranslifyMark } from "@/components/translify-mark";
import { WeeklyTendingFlow } from "@/components/garden/weekly-tending-flow";
import { getToken } from "@/lib/api";
import { getGarden, type Garden } from "@/lib/garden";
import { useI18n } from "@/lib/i18n";

export default function TendingPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = use(params);
  const router = useRouter();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !getToken()) router.replace("/login");
  }, [mounted, router]);

  const enabled = mounted && !!getToken();

  const { data: garden, isLoading } = useQuery<Garden>({
    queryKey: ["garden", bookId],
    queryFn: () => getGarden(bookId),
    enabled,
  });

  if (!mounted || isLoading || !garden) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-[color:var(--color-ink-soft)]">{t("gpage.preparing")}</p>
      </main>
    );
  }

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

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between border-b border-[color:var(--color-border)] px-6 py-5 lg:px-10">
        <TranslifyMark href="/library" size={36} wordmarkClassName="text-xl" />
        <div className="flex items-center gap-3 font-[family-name:var(--font-display)] text-[12px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
          <Link href={`/garden/${bookId}`} className="transition-colors hover:text-[color:var(--color-ink)]">
            {t("gpage.back", { title: truncate(garden.bookTitle, 36) })}
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-12 lg:px-10 lg:pt-16">
        <WeeklyTendingFlow garden={garden} />
      </section>
    </main>
  );
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "…";
}
