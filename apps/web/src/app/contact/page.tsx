import type { Metadata } from "next";
import Link from "next/link";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Translify — email hello@translify.app for support, billing questions, refund requests, or anything else. We answer fast.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Translify",
    description: "Email hello@translify.app. We answer fast.",
    url: `${SITE}/contact`,
  },
};

export default function ContactPage() {
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Translify",
    url: SITE,
    contactPoint: [{
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "hello@translify.app",
      availableLanguage: ["English", "French", "Spanish", "German", "Arabic", "Japanese", "Indonesian", "Malay"],
    }],
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 lg:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />

      <nav className="mb-10 text-sm text-[color:var(--color-ink-soft)]">
        <Link href="/" className="hover:text-[color:var(--color-ink)]">
          ← Back home
        </Link>
      </nav>

      <header className="mb-12">
        <span className="badge-pill bg-[color:var(--color-paper-3)] text-[color:var(--color-ink-soft)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-sage)]" />
          Contact
        </span>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.4rem,5vw,3.4rem)] font-semibold leading-tight tracking-tight">
          Write to us. We answer{" "}
          <em className="text-[color:var(--color-saffron-deep)]">fast</em>.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-[color:var(--color-ink-soft)]">
          Translify is a small team. Every email reaches a human, usually
          within a few hours, never longer than one business day.
        </p>
      </header>

      <section className="space-y-6">
        <ContactCard
          tone="sage"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-10 5L2 7" />
            </svg>
          }
          title="General questions, support, feedback"
          body="The catch-all inbox. Most things land here."
          actionLabel="hello@translify.app"
          actionHref="mailto:hello@translify.app"
        />

        <ContactCard
          tone="saffron"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          title="Billing, refunds, plan changes"
          body="30-day money-back guarantee, no questions asked. Reply to your welcome email or write directly."
          actionLabel="hello@translify.app"
          actionHref="mailto:hello@translify.app?subject=Billing"
        />

        <ContactCard
          tone="coral"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z" />
              <path d="M14 2v6h6" />
              <path d="M10 12h4M10 16h4" />
            </svg>
          }
          title="Privacy, data requests, GDPR"
          body="Access, export, deletion — write in and we'll handle it within 5 working days."
          actionLabel="hello@translify.app"
          actionHref="mailto:hello@translify.app?subject=Privacy%20request"
        />

        <ContactCard
          tone="plum"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 9V5a3 3 0 0 0-6 0v4" />
              <rect x="2" y="9" width="20" height="13" rx="2" />
            </svg>
          }
          title="Press, partnerships, business"
          body="If you're writing about Translify or proposing a partnership, mention it in the subject and we'll route appropriately."
          actionLabel="hello@translify.app"
          actionHref="mailto:hello@translify.app?subject=Press"
        />
      </section>

      <section className="mt-14 rounded-2xl border-[1.5px] border-[color:var(--color-border)] bg-[color:var(--color-paper-2)]/40 p-6 text-sm leading-relaxed text-[color:var(--color-ink-soft)]">
        <p>
          Looking for something else first? You might find your answer on the{" "}
          <Link href="/#faq" className="font-semibold underline decoration-[color:var(--color-saffron)]/40">
            FAQ
          </Link>
          , the{" "}
          <Link href="/refund-policy" className="font-semibold underline decoration-[color:var(--color-saffron)]/40">
            refund policy
          </Link>
          , or the{" "}
          <Link href="/manifesto" className="font-semibold underline decoration-[color:var(--color-saffron)]/40">
            manifesto
          </Link>
          .
        </p>
      </section>
    </main>
  );
}

function ContactCard({
  tone, icon, title, body, actionLabel, actionHref,
}: {
  tone: "sage" | "saffron" | "coral" | "plum";
  icon: React.ReactNode;
  title: string;
  body: string;
  actionLabel: string;
  actionHref: string;
}) {
  const toneClasses = {
    sage:    { bg: "bg-[color:var(--color-sage)]/12",    text: "text-[color:var(--color-sage-deep)]" },
    saffron: { bg: "bg-[color:var(--color-saffron)]/12", text: "text-[color:var(--color-saffron-deep)]" },
    coral:   { bg: "bg-[color:var(--color-coral)]/12",   text: "text-[color:var(--color-coral-deep)]" },
    plum:    { bg: "bg-[color:var(--color-plum)]/12",    text: "text-[color:var(--color-plum)]" },
  }[tone];

  return (
    <article className="flex gap-4 rounded-2xl border-[1.5px] border-[color:var(--color-border)] bg-white/60 p-5 transition-colors hover:border-[color:var(--color-border-strong)]">
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${toneClasses.bg} ${toneClasses.text}`}>
        {icon}
      </span>
      <div className="flex-1">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">{body}</p>
        <a
          href={actionHref}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--color-ink)] underline decoration-[color:var(--color-saffron)]/50 underline-offset-2 hover:decoration-[color:var(--color-saffron)]"
        >
          {actionLabel}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </a>
      </div>
    </article>
  );
}
