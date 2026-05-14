"use client";

import { LegalShell, H2 } from "@/components/legal-shell";
import { useI18n } from "@/lib/i18n";

export default function CookiesClient({ lastUpdated }: { lastUpdated: string }) {
  const { t } = useI18n();
  return (
    <LegalShell
      title={t("cookies.title")}
      subtitle={t("cookies.subtitle")}
      lastUpdated={lastUpdated}
    >
      <p>{t("cookies.intro")}</p>

      <H2>{t("cookies.h1")}</H2>
      <p>{t("cookies.p1")}</p>

      <table className="!my-4 w-full border-collapse text-sm">
        <thead className="bg-[color:var(--color-paper-2)]/60">
          <tr>
            <th className="border border-[color:var(--color-border)] px-3 py-2 text-left">{t("cookies.col.name")}</th>
            <th className="border border-[color:var(--color-border)] px-3 py-2 text-left">{t("cookies.col.type")}</th>
            <th className="border border-[color:var(--color-border)] px-3 py-2 text-left">{t("cookies.col.purpose")}</th>
            <th className="border border-[color:var(--color-border)] px-3 py-2 text-left">{t("cookies.col.duration")}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-[color:var(--color-border)] px-3 py-2"><code>translify_jwt</code></td>
            <td className="border border-[color:var(--color-border)] px-3 py-2">LocalStorage</td>
            <td className="border border-[color:var(--color-border)] px-3 py-2">{t("cookies.t1.purpose")}</td>
            <td className="border border-[color:var(--color-border)] px-3 py-2">{t("cookies.t1.duration")}</td>
          </tr>
          <tr className="bg-[color:var(--color-paper-2)]/30">
            <td className="border border-[color:var(--color-border)] px-3 py-2"><code>translify_lang</code></td>
            <td className="border border-[color:var(--color-border)] px-3 py-2">LocalStorage</td>
            <td className="border border-[color:var(--color-border)] px-3 py-2">{t("cookies.t2.purpose")}</td>
            <td className="border border-[color:var(--color-border)] px-3 py-2">{t("cookies.t2.duration")}</td>
          </tr>
        </tbody>
      </table>

      <H2>{t("cookies.h2")}</H2>

      <table className="!my-4 w-full border-collapse text-sm">
        <thead className="bg-[color:var(--color-paper-2)]/60">
          <tr>
            <th className="border border-[color:var(--color-border)] px-3 py-2 text-left">{t("cookies.col.provider")}</th>
            <th className="border border-[color:var(--color-border)] px-3 py-2 text-left">{t("cookies.col.usedFor")}</th>
            <th className="border border-[color:var(--color-border)] px-3 py-2 text-left">{t("cookies.col.note")}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-[color:var(--color-border)] px-3 py-2">Stripe</td>
            <td className="border border-[color:var(--color-border)] px-3 py-2">{t("cookies.t3.usedFor")}</td>
            <td className="border border-[color:var(--color-border)] px-3 py-2">
              {t("cookies.t3.note.pre")}
              <a href="https://stripe.com/cookies-policy/legal" rel="noopener" target="_blank" className="underline">{t("cookies.t3.note.link")}</a>
              {t("cookies.t3.note.post")}
            </td>
          </tr>
          <tr className="bg-[color:var(--color-paper-2)]/30">
            <td className="border border-[color:var(--color-border)] px-3 py-2">Plausible Analytics</td>
            <td className="border border-[color:var(--color-border)] px-3 py-2">{t("cookies.t4.usedFor")}</td>
            <td className="border border-[color:var(--color-border)] px-3 py-2">
              {t("cookies.t4.note.pre")}
              <a href="https://plausible.io/data-policy" rel="noopener" target="_blank" className="underline">{t("cookies.t4.note.link")}</a>
              {t("cookies.t4.note.post")}
            </td>
          </tr>
          <tr>
            <td className="border border-[color:var(--color-border)] px-3 py-2">PostHog</td>
            <td className="border border-[color:var(--color-border)] px-3 py-2">{t("cookies.t5.usedFor")}</td>
            <td className="border border-[color:var(--color-border)] px-3 py-2">
              {t("cookies.t5.note.pre")}
              <code>ph_*</code>
              {t("cookies.t5.note.mid")}
              <code>eu.i.posthog.com</code>
              {t("cookies.t5.note.mid2")}
              <a href="https://posthog.com/privacy" rel="noopener" target="_blank" className="underline">{t("cookies.t5.note.link")}</a>
              {t("cookies.t5.note.post")}
            </td>
          </tr>
        </tbody>
      </table>

      <H2>{t("cookies.h3")}</H2>
      <p>{t("cookies.p3")}</p>
      <ul className="list-disc space-y-1 pl-6">
        <li>{t("cookies.l3a")}</li>
        <li>{t("cookies.l3b")}</li>
        <li>{t("cookies.l3c")}</li>
        <li>{t("cookies.l3d")}</li>
        <li>{t("cookies.l3e")}</li>
      </ul>

      <H2>{t("cookies.h4")}</H2>
      <p>
        {t("cookies.p4.pre")}
        <a href="/privacy" className="underline decoration-[color:var(--color-saffron)]/40">{t("cookies.p4.link")}</a>
        {t("cookies.p4.post")}
      </p>

      <H2>{t("cookies.h5")}</H2>
      <p>{t("cookies.p5")}</p>

      <H2>{t("cookies.h6")}</H2>
      <p>{t("cookies.p6")}</p>
    </LegalShell>
  );
}
