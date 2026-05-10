import type { Metadata } from "next";
import { LegalShell, H2, H3 } from "@/components/legal-shell";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";
const UPDATED = "2026-05-11";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Translify collects, uses, and protects your data. What we do with the books you upload, who we share data with, and the rights you have over your information.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy — Translify",
    description: "How we collect, use, and protect your data.",
    url: `${SITE}/privacy`,
  },
};

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      subtitle="What we collect, how we use it, and the rights you have over your data."
      lastUpdated={UPDATED}
    >
      <p>
        Privacy policies tend to be the part of a service where companies
        say one thing and do another. We've tried to write ours so the
        things we promise here are actually the things we do, and so a
        normal person can read it without a law degree. If we ever break
        one of these commitments, please write to us — we'd rather hear
        about it from you than from a regulator.
      </p>

      <p>
        If you only read one paragraph, make it this one:{" "}
        <strong>the books you upload are encrypted at rest, never used
        to train any AI model, and permanently deletable at any time.</strong>{" "}
        The rest of this page is the longer version.
      </p>

      <H2>1. What we collect</H2>

      <p>We collect three categories of data:</p>

      <H3>1a. Account information</H3>
      <ul className="list-disc space-y-1 pl-6">
        <li>Email address and password (the password is stored hashed; we cannot read it).</li>
        <li>Optional: display name, preferred language.</li>
        <li>Email verification status and password-reset tokens.</li>
        <li>Account creation date and last login date.</li>
      </ul>

      <H3>1b. Books and reading data</H3>
      <ul className="list-disc space-y-1 pl-6">
        <li>The PDF and EPUB files you upload.</li>
        <li>Derived content: translated text, vector embeddings used for chat, generated quizzes, your highlights and notes.</li>
        <li>Reading state (current page, progress, last-opened time).</li>
      </ul>

      <H3>1c. Usage and billing data</H3>
      <ul className="list-disc space-y-1 pl-6">
        <li>Pages uploaded per month (for quota enforcement).</li>
        <li>API requests, errors, and rough timings (for service reliability).</li>
        <li>Billing details handled by Stripe — we never see your full card number; we only receive the last four digits and a token.</li>
      </ul>

      <H2>2. How we use it</H2>

      <ul className="list-disc space-y-1 pl-6">
        <li><strong>To run the service.</strong> Process your books, generate translations, power chat and quizzes, deliver the reading experience.</li>
        <li><strong>To bill you.</strong> Charge subscription fees, calculate usage, prevent abuse.</li>
        <li><strong>To support you.</strong> Respond to email when you write in.</li>
        <li><strong>To improve the service.</strong> Aggregate, anonymized usage data tells us which features matter and which are broken.</li>
      </ul>

      <p>
        <strong>We do not use your uploaded books to train AI models.</strong> We
        do not sell your data. We do not run ad-tech tracking. We do not share
        your reading history with third parties beyond what's needed to run the
        service.
      </p>

      <H2>3. Who we share data with</H2>

      <p>To run Translify, we send specific data to specific service providers. Each one is bound by their own privacy and security commitments.</p>

      <ul className="list-disc space-y-2 pl-6">
        <li><strong>Anthropic</strong> (Claude API) — when you chat with a book or ask AI to explain a passage, we send the relevant book chunks plus your question. Anthropic processes the request and does not use it to train their models when called via their API. See <a href="https://anthropic.com/legal/privacy" className="underline" rel="noopener" target="_blank">Anthropic's privacy policy</a>.</li>
        <li><strong>DeepL</strong> — for European-language translation, we send the book text to DeepL. DeepL Pro (the tier we use) does not store or use customer data to train their models. See <a href="https://deepl.com/privacy" className="underline" rel="noopener" target="_blank">DeepL's privacy policy</a>.</li>
        <li><strong>Stripe</strong> — payment processing. Stripe receives your card details directly (we never see them) and your billing email. See <a href="https://stripe.com/privacy" className="underline" rel="noopener" target="_blank">Stripe's privacy policy</a>.</li>
        <li><strong>Resend</strong> — transactional email (verification, password reset, billing receipts). Resend receives your email address and the email content. See <a href="https://resend.com/legal/privacy-policy" className="underline" rel="noopener" target="_blank">Resend's privacy policy</a>.</li>
        <li><strong>Hosting</strong> — our infrastructure (compute, database, file storage) is operated by reputable cloud providers in the EU. Data is encrypted in transit and at rest.</li>
      </ul>

      <p>
        We do not share data with anyone else. We do not sell data to data
        brokers or advertisers. We do not run third-party advertising or
        marketing trackers on our website or in our app.
      </p>

      <H2>4. How long we keep your data</H2>

      <ul className="list-disc space-y-1 pl-6">
        <li><strong>Uploaded books and derivatives</strong> — until you delete them, or 90 days after you close your account.</li>
        <li><strong>Account data</strong> — until you close your account, or 30 days after you request deletion.</li>
        <li><strong>Billing records</strong> — retained for 7 years to comply with tax law, in anonymized form where possible.</li>
        <li><strong>Server logs</strong> — automatically deleted after 30 days unless tied to an open support case.</li>
      </ul>

      <H2>5. Your rights</H2>

      <p>You have, at any time, the right to:</p>

      <ul className="list-disc space-y-1 pl-6">
        <li><strong>Access</strong> your data — see what we have about you.</li>
        <li><strong>Export</strong> your data — get a copy in a portable format.</li>
        <li><strong>Correct</strong> inaccurate data — update your account information yourself, or write to us.</li>
        <li><strong>Delete</strong> your account and all associated data.</li>
        <li><strong>Object</strong> to any processing you believe is unjustified.</li>
        <li><strong>Lodge a complaint</strong> with your local data-protection authority.</li>
      </ul>

      <p>
        To exercise any of these rights, email{" "}
        <a href="mailto:hello@translify.app" className="font-semibold underline decoration-[color:var(--color-saffron)]/40">hello@translify.app</a>.
        We aim to respond within 5 working days; the legal maximum under
        GDPR is 30 days.
      </p>

      <H2>6. Cookies and tracking</H2>

      <p>
        We use minimal cookies — see our{" "}
        <a href="/cookies" className="underline decoration-[color:var(--color-saffron)]/40">Cookie Policy</a> for the full list. We do not use behavioral advertising trackers. We use a privacy-friendly, cookieless analytics tool (Plausible) when enabled, which gives us aggregate visitor counts without identifying individuals.
      </p>

      <H2>7. Children</H2>

      <p>
        Translify is not designed for children under 13. The Family plan
        includes a kid-safe mode, but accounts are always created and
        controlled by a parent or guardian. We do not knowingly collect data
        from children under 13. If you believe we have, email us and we'll
        delete it.
      </p>

      <H2>8. International users</H2>

      <p>
        Translify processes data on infrastructure located in the European
        Union. If you access Translify from outside the EU, you are
        consenting to the transfer of your data to the EU for processing,
        which is governed by GDPR — among the world's stricter data
        protection regimes.
      </p>

      <H2>9. Changes to this policy</H2>

      <p>
        We may update this policy. When we make material changes we email
        active users at least 14 days before the change takes effect. The
        "Last updated" date at the top of this page always reflects the
        current version.
      </p>

      <H2>10. Contact</H2>

      <p>
        Privacy questions, data-access requests, complaints — email{" "}
        <a href="mailto:hello@translify.app" className="font-semibold underline decoration-[color:var(--color-saffron)]/40">hello@translify.app</a>.
      </p>
    </LegalShell>
  );
}
