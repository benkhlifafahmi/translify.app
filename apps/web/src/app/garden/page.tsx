"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { TranslifyMark } from "@/components/translify-mark";
import { Button } from "@/components/ui/button";
import { OtherGardens } from "@/components/garden/other-gardens";
import { getToken } from "@/lib/api";
import { me, logout, type User } from "@/lib/auth";
import { listGardens, type GardenSummary } from "@/lib/garden";
import { useI18n } from "@/lib/i18n";

export default function GardenIndexPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !getToken()) router.replace("/login");
  }, [mounted, router]);

  const enabled = mounted && !!getToken();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["me"],
    queryFn: me,
    enabled,
  });

  const { data: gardens } = useQuery<GardenSummary[]>({
    queryKey: ["gardens"],
    queryFn: listGardens,
    enabled,
  });

  if (!mounted || userLoading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-[color:var(--color-ink-soft)]">{t("garden.loading")}</p>
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

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-10">
        <TranslifyMark href="/library" size={36} wordmarkClassName="text-xl" />
        <div className="flex items-center gap-2">
          <Link
            href="/library"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-paper)] px-3.5 text-xs font-semibold text-[color:var(--color-ink)] transition-all hover:-translate-y-[1px] hover:border-[color:var(--color-border-strong)]"
          >
            {t("garden.shelf")}
          </Link>
          <Link
            href="/account"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-paper)] px-3.5 text-xs font-semibold text-[color:var(--color-ink)] transition-all hover:-translate-y-[1px] hover:border-[color:var(--color-border-strong)]"
          >
            <span aria-hidden>✦</span> {t("garden.account")}
          </Link>
          <Button variant="ghost" size="sm" onClick={async () => { await logout(); router.replace("/login"); }}>
            {t("garden.logOut")}
          </Button>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-6 lg:px-10">
        <p className="mb-1 inline-flex items-center gap-2 rounded-full bg-[color:var(--color-paper-3)] px-3 py-1 text-xs font-semibold text-[color:var(--color-ink-soft)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-sage)]" />
          {t("garden.eyebrow", {
            month: new Date().toLocaleString(locale, { month: "long" }),
            year: new Date().getFullYear(),
          })}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-[3rem]">
          {t("garden.title.pre")}{" "}
          <em className="text-[color:var(--color-sage-deep)]">
            {user?.display_name || (user?.email ? user.email.split("@")[0] : t("garden.title.you"))}
          </em>.
        </h1>
        <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-[color:var(--color-ink-soft)]">
          {t("garden.body")}
        </p>

        {gardens && gardens.length > 0 ? (
          <OtherGardens gardens={gardens} />
        ) : (
          <div className="card-paper-lifted relative mx-auto mt-12 max-w-2xl overflow-hidden p-10 text-center sm:p-14">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-12 -top-12 h-44 w-44 rounded-full bg-[color:var(--color-sage)]/15 blur-2xl"
            />
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
              {t("garden.empty.title")}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[color:var(--color-ink-soft)]">
              {t("garden.empty.body")}
            </p>
            <Link
              href="/library"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[color:var(--color-ink)] px-5 py-2.5 text-sm font-semibold text-[color:var(--color-paper)] transition-transform hover:translate-x-1"
            >
              {t("garden.empty.cta")}
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
