"use client";

import { LegalShell, H2 } from "@/components/legal-shell";
import { useI18n } from "@/lib/i18n";

export default function RefundClient({ lastUpdated }: { lastUpdated: string }) {
  const { t } = useI18n();
  return (
    <LegalShell
      title={t("refund.title")}
      subtitle={t("refund.subtitle")}
      lastUpdated={lastUpdated}
    >
      <p>
        {t("refund.intro1.pre")}
        <strong>{t("refund.intro1.bold")}</strong>
        {t("refund.intro1.post")}
      </p>

      <H2>{t("refund.h1")}</H2>
      <p>{t("refund.p1a")}</p>
      <p>{t("refund.p1b")}</p>

      <H2>{t("refund.h2")}</H2>
      <p>{t("refund.p2")}</p>

      <ul className="list-disc space-y-2 pl-6">
        <li>
          <strong>{t("refund.li2a.bold")}</strong>
          {t("refund.li2a.body")}
        </li>
        <li>
          <strong>
            {t("refund.li2b.bold")}
            <a href="mailto:hello@translify.app?subject=Refund%20request" className="font-semibold underline decoration-[color:var(--color-saffron)]/40">
              hello@translify.app
            </a>
          </strong>
          {t("refund.li2b.body")}
        </li>
      </ul>

      <p>{t("refund.p2b")}</p>

      <H2>{t("refund.h3")}</H2>
      <p>
        {t("refund.p3a.pre")}
        <strong>{t("refund.p3a.bold")}</strong>
        {t("refund.p3a.post")}
      </p>
      <p>{t("refund.p3b")}</p>

      <H2>{t("refund.h4")}</H2>
      <p>{t("refund.p4")}</p>

      <H2>{t("refund.h5")}</H2>
      <p>{t("refund.p5")}</p>

      <H2>{t("refund.h6")}</H2>
      <p>{t("refund.p6a")}</p>

      <ul className="list-disc space-y-1 pl-6">
        <li><strong>{t("refund.li6a.bold")}</strong>{t("refund.li6a.body")}</li>
        <li><strong>{t("refund.li6b.bold")}</strong>{t("refund.li6b.body")}</li>
      </ul>

      <p>{t("refund.p6b")}</p>

      <H2>{t("refund.h7")}</H2>
      <p>{t("refund.p7")}</p>

      <H2>{t("refund.h8")}</H2>
      <p>
        {t("refund.p8.pre")}
        <a href="mailto:hello@translify.app" className="font-semibold underline decoration-[color:var(--color-saffron)]/40">
          hello@translify.app
        </a>
        .
      </p>
    </LegalShell>
  );
}
