"use client";

import { LegalShell, H2 } from "@/components/legal-shell";
import { useI18n } from "@/lib/i18n";

export default function TermsClient({ lastUpdated }: { lastUpdated: string }) {
  const { t } = useI18n();
  return (
    <LegalShell
      title={t("terms.title")}
      subtitle={t("terms.subtitle")}
      lastUpdated={lastUpdated}
    >
      <p>{t("terms.intro")}</p>

      <H2>{t("terms.h1")}</H2>
      <p>{t("terms.p1")}</p>

      <H2>{t("terms.h2")}</H2>
      <p>{t("terms.p2")}</p>
      <ul className="list-disc space-y-1 pl-6">
        <li>{t("terms.l2a")}</li>
        <li>{t("terms.l2b")}</li>
        <li>{t("terms.l2c")}</li>
        <li>{t("terms.l2d")}</li>
      </ul>

      <H2>{t("terms.h3")}</H2>
      <p>{t("terms.p3")}</p>
      <ul className="list-disc space-y-1 pl-6">
        <li>{t("terms.l3a")}</li>
        <li>{t("terms.l3b")}</li>
        <li>{t("terms.l3c")}</li>
        <li>{t("terms.l3d")}</li>
        <li>{t("terms.l3e")}</li>
        <li>{t("terms.l3f")}</li>
      </ul>
      <p>{t("terms.p3post")}</p>

      <H2>{t("terms.h4")}</H2>
      <p>{t("terms.p4a")}</p>
      <p>{t("terms.p4b")}</p>

      <H2>{t("terms.h5")}</H2>
      <p>{t("terms.p5a")}</p>
      <p>
        {t("terms.p5b.pre")}
        <a href="/pricing" className="underline decoration-[color:var(--color-saffron)]/40">{t("terms.p5b.link")}</a>
        {t("terms.p5b.post")}
      </p>

      <H2>{t("terms.h6")}</H2>
      <p>{t("terms.p6")}</p>

      <H2>{t("terms.h7")}</H2>
      <p>{t("terms.p7")}</p>

      <H2>{t("terms.h8")}</H2>
      <p>{t("terms.p8")}</p>

      <H2>{t("terms.h9")}</H2>
      <p>{t("terms.p9")}</p>

      <H2>{t("terms.h10")}</H2>
      <p>{t("terms.p10")}</p>

      <H2>{t("terms.h11")}</H2>
      <p>{t("terms.p11")}</p>

      <H2>{t("terms.h12")}</H2>
      <p>{t("terms.p12")}</p>

      <H2>{t("terms.h13")}</H2>
      <p>{t("terms.p13")}</p>
    </LegalShell>
  );
}
