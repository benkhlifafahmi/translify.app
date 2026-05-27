"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { TranslifyMark } from "@/components/translify-mark";
import { useI18n } from "@/lib/i18n";

function Logo() {
  return (
    <TranslifyMark
      size={36}
      wordmarkClassName="hidden text-2xl sm:inline"
    />
  );
}

export function SiteNavClient() {
  const { t } = useI18n();
  return (
    <nav className="relative z-20 flex items-center justify-between gap-2 px-5 py-4 sm:px-8 sm:py-6 lg:px-14">
      <Logo />
      <div className="hidden items-center gap-7 text-sm font-medium text-[color:var(--color-ink-soft)] md:flex">
        <a href="#how" className="transition-colors hover:text-[color:var(--color-ink)]">{t("nav.how")}</a>
        <a href="#features" className="transition-colors hover:text-[color:var(--color-ink)]">{t("nav.features")}</a>
        <a href="#pricing" className="transition-colors hover:text-[color:var(--color-ink)]">{t("nav.pricing")}</a>
        <a href="#faq" className="transition-colors hover:text-[color:var(--color-ink)]">{t("nav.faq")}</a>
      </div>
      <div className="flex shrink-0 items-center gap-1 text-sm sm:gap-2">
        <LanguageSwitcher />
        <Link
          href="/login"
          className="hidden rounded-full px-3 py-2 font-medium text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)] sm:inline-block sm:px-4"
        >
          {t("nav.login")}
        </Link>
        <Link
          href="/join"
          className="rounded-full bg-[color:var(--color-ink)] px-3.5 py-2 text-[0.85rem] font-semibold text-[color:var(--color-primary-foreground)] shadow-[0_2px_0_rgba(20,16,8,0.4),0_8px_18px_-8px_rgba(20,16,8,0.5)] transition-transform hover:-translate-y-[1px] sm:px-5 sm:text-sm"
        >
          {t("nav.cta")}
        </Link>
      </div>
    </nav>
  );
}
