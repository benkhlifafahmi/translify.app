import type { Metadata } from "next";
import { LegalShell, H2 } from "@/components/legal-shell";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";
const UPDATED = "2026-05-12";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Translify uses minimal cookies and storage — only what's needed to keep you logged in and to run the service. No advertising trackers, no behavioral targeting.",
  alternates: { canonical: "/cookies" },
  openGraph: {
    title: "Cookie Policy — Translify",
    description: "Minimal cookies. No advertising trackers. Here's the full list.",
    url: `${SITE}/cookies`,
  },
};

export default function CookiesPage() {
  return (
    <LegalShell
      title="Cookie Policy"
      subtitle="What we store in your browser, why, and how long it stays there."
      lastUpdated={UPDATED}
    >
      <p>
        Translify uses minimal browser storage — only what's needed to keep
        you logged in and to remember a few preferences. We do not use
        advertising cookies, behavioral trackers, or third-party marketing
        pixels. This page lists every type of storage we use.
      </p>

      <H2>1. Strictly necessary storage</H2>

      <p>These are required for Translify to work and cannot be disabled.</p>

      <table className="!my-4 w-full border-collapse text-sm">
        <thead className="bg-[color:var(--color-paper-2)]/60">
          <tr>
            <th className="border border-[color:var(--color-border)] px-3 py-2 text-left">Name</th>
            <th className="border border-[color:var(--color-border)] px-3 py-2 text-left">Type</th>
            <th className="border border-[color:var(--color-border)] px-3 py-2 text-left">Purpose</th>
            <th className="border border-[color:var(--color-border)] px-3 py-2 text-left">Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-[color:var(--color-border)] px-3 py-2"><code>translify_jwt</code></td>
            <td className="border border-[color:var(--color-border)] px-3 py-2">LocalStorage</td>
            <td className="border border-[color:var(--color-border)] px-3 py-2">Keeps you logged in across sessions.</td>
            <td className="border border-[color:var(--color-border)] px-3 py-2">Until logout or 30 days</td>
          </tr>
          <tr className="bg-[color:var(--color-paper-2)]/30">
            <td className="border border-[color:var(--color-border)] px-3 py-2"><code>translify_lang</code></td>
            <td className="border border-[color:var(--color-border)] px-3 py-2">LocalStorage</td>
            <td className="border border-[color:var(--color-border)] px-3 py-2">Remembers your interface language.</td>
            <td className="border border-[color:var(--color-border)] px-3 py-2">Until cleared</td>
          </tr>
        </tbody>
      </table>

      <H2>2. Third-party cookies (only when used)</H2>

      <table className="!my-4 w-full border-collapse text-sm">
        <thead className="bg-[color:var(--color-paper-2)]/60">
          <tr>
            <th className="border border-[color:var(--color-border)] px-3 py-2 text-left">Provider</th>
            <th className="border border-[color:var(--color-border)] px-3 py-2 text-left">Used for</th>
            <th className="border border-[color:var(--color-border)] px-3 py-2 text-left">Note</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-[color:var(--color-border)] px-3 py-2">Stripe</td>
            <td className="border border-[color:var(--color-border)] px-3 py-2">Payment processing and fraud prevention on checkout pages.</td>
            <td className="border border-[color:var(--color-border)] px-3 py-2">Only loaded on the billing flow. See <a href="https://stripe.com/cookies-policy/legal" rel="noopener" target="_blank" className="underline">Stripe's cookie policy</a>.</td>
          </tr>
          <tr className="bg-[color:var(--color-paper-2)]/30">
            <td className="border border-[color:var(--color-border)] px-3 py-2">Plausible Analytics</td>
            <td className="border border-[color:var(--color-border)] px-3 py-2">Aggregate page-view counts and traffic sources.</td>
            <td className="border border-[color:var(--color-border)] px-3 py-2">Cookieless. No personal data, no fingerprinting. <a href="https://plausible.io/data-policy" rel="noopener" target="_blank" className="underline">Data policy</a>.</td>
          </tr>
          <tr>
            <td className="border border-[color:var(--color-border)] px-3 py-2">PostHog</td>
            <td className="border border-[color:var(--color-border)] px-3 py-2">Product analytics: funnel analysis, session recordings, and feature flags to improve the onboarding experience.</td>
            <td className="border border-[color:var(--color-border)] px-3 py-2">Uses localStorage/cookie (<code>ph_*</code>). EU endpoint (<code>eu.i.posthog.com</code>). GDPR-compliant. No data sold to third parties. <a href="https://posthog.com/privacy" rel="noopener" target="_blank" className="underline">Privacy policy</a>.</td>
          </tr>
        </tbody>
      </table>

      <H2>3. What we don't use</H2>

      <p>To be explicit, Translify does not use any of these:</p>

      <ul className="list-disc space-y-1 pl-6">
        <li>Google Analytics, Mixpanel, Amplitude, Heap, or other third-party behavioral advertising platforms. We use PostHog for internal product analytics only — see section 2 above.</li>
        <li>Facebook Pixel, TikTok Pixel, LinkedIn Insight Tag, or other ad-network trackers.</li>
        <li>Re-marketing or conversion-tracking cookies for any advertising network.</li>
        <li>Third-party fonts that track requests (we use Google Fonts via Next.js's self-hosted pipeline, which does not load from Google's servers at runtime).</li>
        <li>Third-party heatmap or session-replay tools (Hotjar, FullStory, LogRocket, Microsoft Clarity). Session recordings are handled by PostHog under our own account.</li>
      </ul>

      <H2>4. Managing storage</H2>

      <p>
        You can clear Translify's storage at any time from your browser's
        settings (Site data → translify.app → Clear). This will log you out
        and reset your language preference. Doing so will not delete any of
        your data from our servers — see the{" "}
        <a href="/privacy" className="underline decoration-[color:var(--color-saffron)]/40">Privacy Policy</a> for that.
      </p>

      <H2>5. Changes</H2>

      <p>
        If we add new tracking mechanisms, we'll update this page and the
        &ldquo;Last updated&rdquo; date. We will not add behavioral
        advertising trackers; that's a commitment.
      </p>

      <H2>6. Contact</H2>

      <p>
        Questions —{" "}
        <a href="mailto:hello@translify.app" className="font-semibold underline decoration-[color:var(--color-saffron)]/40">hello@translify.app</a>.
      </p>
    </LegalShell>
  );
}
