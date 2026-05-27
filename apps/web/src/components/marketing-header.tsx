"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { TranslifyMark } from "@/components/translify-mark";
import { useI18n } from "@/lib/i18n";

/**
 * One header for every visitor-facing marketing surface.
 *
 * Menu anchors are absolute (`/#how` etc.) so they navigate back to home
 * before scrolling, which lets the same nav drop into /pricing, /manifesto,
 * /start, /languages, /contact, /blog without dead links.
 *
 * Pass `compact` for pages that need a tighter chrome (auth-adjacent
 * landings, in-app marketing). The home page uses the default.
 */
export function MarketingHeader({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  return (
    <nav
      className={`relative z-20 flex items-center justify-between gap-2 px-5 sm:px-8 lg:px-14 ${
        compact ? "py-3 sm:py-4" : "py-4 sm:py-6"
      }`}
    >
      <Link href="/" aria-label="Translify" className="flex items-center">
        <TranslifyMark size={36} wordmarkClassName="hidden text-2xl sm:inline" />
      </Link>

      {!compact && (
        <div className="hidden items-center gap-7 text-sm font-medium text-[color:var(--color-ink-soft)] md:flex">
          <Link href="/#how" className="transition-colors duration-150 hover:text-[color:var(--color-ink)]">{t("nav.how")}</Link>
          <Link href="/#features" className="transition-colors duration-150 hover:text-[color:var(--color-ink)]">{t("nav.features")}</Link>
          <Link href="/pricing" className="transition-colors duration-150 hover:text-[color:var(--color-ink)]">{t("nav.pricing")}</Link>
          <Link href="/#faq" className="transition-colors duration-150 hover:text-[color:var(--color-ink)]">{t("nav.faq")}</Link>
        </div>
      )}

      <div className="flex shrink-0 items-center gap-1 text-sm sm:gap-2">
        <LanguageSwitcher />
        <Link
          href="/login"
          className="hidden rounded-full px-3 py-2 font-medium text-[color:var(--color-ink-soft)] transition-colors duration-150 hover:text-[color:var(--color-ink)] sm:inline-block sm:px-4"
        >
          {t("nav.login")}
        </Link>
        <Link
          href="/join"
          className="rounded-full bg-[color:var(--color-ink)] px-3.5 py-2 text-[0.85rem] font-semibold text-[color:var(--color-primary-foreground)] shadow-[0_2px_0_rgba(20,16,8,0.4),0_8px_18px_-8px_rgba(20,16,8,0.5)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-[1px] active:scale-[0.97] active:translate-y-0 sm:px-5 sm:text-sm"
        >
          {t("nav.cta")}
        </Link>
      </div>
    </nav>
  );
}
