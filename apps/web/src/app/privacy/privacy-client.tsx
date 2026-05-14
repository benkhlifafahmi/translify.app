"use client";

import { LegalShell, H2, H3 } from "@/components/legal-shell";
import { useI18n } from "@/lib/i18n";

export default function PrivacyClient({ lastUpdated }: { lastUpdated: string }) {
  const { t } = useI18n();
  return (
    <LegalShell
      title={t("privacy.title")}
      subtitle={t("privacy.subtitle")}
      lastUpdated={lastUpdated}
    >
      <p>{t("privacy.p1")}</p>
      <p>
        {t("privacy.p2.pre")}
        <strong>{t("privacy.p2.bold")}</strong>
        {t("privacy.p2.post")}
      </p>

      <H2>{t("privacy.h1")}</H2>
      <p>{t("privacy.p1cats")}</p>

      <H3>{t("privacy.h1a")}</H3>
      <ul className="list-disc space-y-1 pl-6">
        <li>{t("privacy.l1a1")}</li>
        <li>{t("privacy.l1a2")}</li>
        <li>{t("privacy.l1a3")}</li>
        <li>{t("privacy.l1a4")}</li>
      </ul>

      <H3>{t("privacy.h1b")}</H3>
      <ul className="list-disc space-y-1 pl-6">
        <li>{t("privacy.l1b1")}</li>
        <li>{t("privacy.l1b2")}</li>
        <li>{t("privacy.l1b3")}</li>
      </ul>

      <H3>{t("privacy.h1c")}</H3>
      <ul className="list-disc space-y-1 pl-6">
        <li>{t("privacy.l1c1")}</li>
        <li>{t("privacy.l1c2")}</li>
        <li>{t("privacy.l1c3")}</li>
      </ul>

      <H2>{t("privacy.h2")}</H2>
      <ul className="list-disc space-y-1 pl-6">
        <li><strong>{t("privacy.l2a.bold")}</strong>{t("privacy.l2a.body")}</li>
        <li><strong>{t("privacy.l2b.bold")}</strong>{t("privacy.l2b.body")}</li>
        <li><strong>{t("privacy.l2c.bold")}</strong>{t("privacy.l2c.body")}</li>
        <li><strong>{t("privacy.l2d.bold")}</strong>{t("privacy.l2d.body")}</li>
      </ul>
      <p>{t("privacy.p2")}</p>

      <H2>{t("privacy.h3")}</H2>
      <p>{t("privacy.p3pre")}</p>
      <ul className="list-disc space-y-2 pl-6">
        <li>{t("privacy.l3a")}</li>
        <li>{t("privacy.l3b")}</li>
        <li>{t("privacy.l3c")}</li>
        <li>{t("privacy.l3d")}</li>
        <li>{t("privacy.l3e")}</li>
      </ul>
      <p>{t("privacy.p3post")}</p>

      <H2>{t("privacy.h4")}</H2>
      <ul className="list-disc space-y-1 pl-6">
        <li><strong>{t("privacy.l4a.bold")}</strong>{t("privacy.l4a.body")}</li>
        <li><strong>{t("privacy.l4b.bold")}</strong>{t("privacy.l4b.body")}</li>
        <li><strong>{t("privacy.l4c.bold")}</strong>{t("privacy.l4c.body")}</li>
        <li><strong>{t("privacy.l4d.bold")}</strong>{t("privacy.l4d.body")}</li>
      </ul>

      <H2>{t("privacy.h5")}</H2>
      <p>{t("privacy.p5pre")}</p>
      <ul className="list-disc space-y-1 pl-6">
        <li><strong>{t("privacy.l5a.bold")}</strong>{t("privacy.l5a.body")}</li>
        <li><strong>{t("privacy.l5b.bold")}</strong>{t("privacy.l5b.body")}</li>
        <li><strong>{t("privacy.l5c.bold")}</strong>{t("privacy.l5c.body")}</li>
        <li><strong>{t("privacy.l5d.bold")}</strong>{t("privacy.l5d.body")}</li>
        <li><strong>{t("privacy.l5e.bold")}</strong>{t("privacy.l5e.body")}</li>
        <li><strong>{t("privacy.l5f.bold")}</strong>{t("privacy.l5f.body")}</li>
      </ul>
      <p>{t("privacy.p5post")}</p>

      <H2>{t("privacy.h6")}</H2>
      <p>
        {t("privacy.p6.pre")}
        <a href="/cookies" className="underline decoration-[color:var(--color-saffron)]/40">{t("privacy.p6.link")}</a>
        {t("privacy.p6.post")}
      </p>

      <H2>{t("privacy.h7")}</H2>
      <p>{t("privacy.p7")}</p>

      <H2>{t("privacy.h8")}</H2>
      <p>{t("privacy.p8")}</p>

      <H2>{t("privacy.h9")}</H2>
      <p>{t("privacy.p9")}</p>

      <H2>{t("privacy.h10")}</H2>
      <p>{t("privacy.p10")}</p>
    </LegalShell>
  );
}
