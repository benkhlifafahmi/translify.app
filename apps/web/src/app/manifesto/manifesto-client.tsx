"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function ManifestoClient() {
  const { t } = useI18n();
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 lg:py-24">
      <nav className="mb-10 text-sm text-[color:var(--color-ink-soft)]">
        <Link href="/" className="hover:text-[color:var(--color-ink)]">
          {t("manifesto.back")}
        </Link>
      </nav>

      <header>
        <span className="badge-pill bg-[color:var(--color-paper-3)] text-[color:var(--color-ink-soft)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-saffron)]" />
          {t("manifesto.badge")}
        </span>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-[clamp(2.4rem,5vw,3.6rem)] font-semibold leading-[1.05] tracking-tight">
          {t("manifesto.title.pre")}{" "}
          <em className="text-[color:var(--color-saffron-deep)]">{t("manifesto.title.em")}</em>.
        </h1>
        <p className="mt-4 text-sm text-[color:var(--color-ink-soft)]">
          {t("manifesto.byline")}
        </p>
      </header>

      <article className="prose-manifesto mt-12 space-y-6 text-[1.05rem] leading-relaxed text-[color:var(--color-ink)]">
        <p>{t("manifesto.intro1")}</p>
        <p>{t("manifesto.intro2")}</p>

        <h2 className="!mt-12 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
          {t("manifesto.believe")}
        </h2>

        <p>
          <strong>{t("manifesto.believe1.bold")}</strong>
          {t("manifesto.believe1.body")}
        </p>
        <p>
          <strong>{t("manifesto.believe2.bold")}</strong>
          {t("manifesto.believe2.body")}
        </p>
        <p>
          <strong>{t("manifesto.believe3.bold")}</strong>
          {t("manifesto.believe3.body")}
        </p>

        <h2 className="!mt-12 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
          {t("manifesto.now")}
        </h2>

        <p>{t("manifesto.now1")}</p>
        <p>{t("manifesto.now2")}</p>

        <h2 className="!mt-12 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
          {t("manifesto.who")}
        </h2>

        <p>{t("manifesto.who1")}</p>
        <p>{t("manifesto.who2")}</p>
        <p>{t("manifesto.who3")}</p>

        <h2 className="!mt-12 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
          {t("manifesto.promise")}
        </h2>

        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>{t("manifesto.promise1.bold")}</strong>
            {t("manifesto.promise1.body")}
          </li>
          <li>
            <strong>{t("manifesto.promise2.bold")}</strong>
            {t("manifesto.promise2.body")}
          </li>
          <li>
            <strong>{t("manifesto.promise3.bold")}</strong>
            {t("manifesto.promise3.body")}
          </li>
          <li>
            <strong>{t("manifesto.promise4.bold")}</strong>
            {t("manifesto.promise4.body")}
          </li>
        </ul>

        <hr className="!my-12 border-[color:var(--color-border)]" />

        <p className="text-[color:var(--color-ink-soft)]">
          {t("manifesto.signoff.pre")}
          <Link
            href="/join"
            className="font-semibold text-[color:var(--color-saffron-deep)] underline decoration-[color:var(--color-saffron)]/40 hover:decoration-[color:var(--color-saffron)]"
          >
            {t("manifesto.signoff.cta")}
          </Link>
        </p>
      </article>
    </main>
  );
}
