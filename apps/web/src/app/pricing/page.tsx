import type { Metadata } from "next";
import Link from "next/link";
import { Pricing } from "@/components/landing/pricing";
import { FAQ } from "@/components/landing/faq";
import { TranslifyIcon } from "@/components/translify-mark";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";

export const metadata: Metadata = {
  title: "Pricing — from €7.99/mo with a 14-day trial",
  description:
    "Translify pricing — Reader, Scholar, and Family plans starting at €7.99/month. 14-day free trial on every plan, 30-day money-back guarantee, no card required to start.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Translify Pricing",
    description:
      "Three plans, 14-day trial, 30-day money-back. From €7.99/month.",
    url: `${SITE}/pricing`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Translify Pricing",
    description: "From €7.99/month. 14-day trial. 30-day money-back.",
  },
};

export default function PricingPage() {
  // Product schema for the pricing page — gives Google rich-result eligibility.
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Translify",
    description:
      "AI reading companion for foreign-language books. Translate, chat with, highlight, and quiz on any PDF or EPUB.",
    brand: { "@type": "Brand", name: "Translify" },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: "7.99",
      highPrice: "20",
      offerCount: "3",
      offers: [
        { "@type": "Offer", name: "Reader", price: "7.99", priceCurrency: "EUR", url: `${SITE}/pricing#reader` },
        { "@type": "Offer", name: "Scholar", price: "14.99", priceCurrency: "EUR", url: `${SITE}/pricing#scholar` },
        { "@type": "Offer", name: "Family", price: "20", priceCurrency: "EUR", url: `${SITE}/pricing#family` },
      ],
    },
  };

  return (
    <main className="relative min-h-screen overflow-hidden pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      {/* Soft brand backdrop, matching the homepage */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-24 h-96 w-96 rounded-full bg-[color:var(--color-saffron)]/12 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-40 h-[24rem] w-[24rem] rounded-full bg-[color:var(--color-sage)]/10 blur-3xl"
      />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-10">
        <Link
          href="/"
          aria-label="Translify"
          className="flex items-center gap-2.5 font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight"
        >
          <TranslifyIcon size={36} />
          Translify
        </Link>
        <Link
          href="/onboarding"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[color:var(--color-ink)] px-4 text-xs font-semibold text-[color:var(--color-paper)]"
        >
          Start trial →
        </Link>
      </header>

      <section className="relative z-10 mx-auto max-w-5xl px-6 pt-8 text-center lg:px-10">
        <span className="badge-pill bg-[color:var(--color-saffron)]/15 text-[color:var(--color-saffron-deep)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-saffron)]" />
          Honest pricing
        </span>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.4rem,5vw,3.6rem)] font-semibold leading-tight tracking-tight">
          Three plans.{" "}
          <em className="text-[color:var(--color-saffron-deep)]">No surprises.</em>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-[color:var(--color-ink-soft)]">
          14-day free trial on every plan. 30-day money-back guarantee on
          every paid plan. Cancel any time in one click — no retention loop,
          no &ldquo;wait, can we keep you?&rdquo; — just the cancel button.
        </p>
      </section>

      <Pricing />

      {/* Extra context that doesn't fit on the homepage */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 py-12 lg:px-10">
        <h2 className="text-center font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
          What's in every plan
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Feature title="Whole-book translation">
            Upload any PDF or EPUB up to 200 MB. Translify rebuilds every page
            in your target language, layout intact.
          </Feature>
          <Feature title="Chat with the book">
            RAG-powered conversation grounded in the actual text. Every answer
            cites the exact page.
          </Feature>
          <Feature title="AI-explained highlights">
            Select any passage. Get an explanation in your language. Save
            notes attached to highlights.
          </Feature>
          <Feature title="Generated quizzes">
            5–12 multiple-choice questions per chapter you've read, with
            citations back to the source.
          </Feature>
          <Feature title="14 target languages">
            English, French, Spanish, German, Italian, Portuguese, Dutch,
            Arabic, Chinese, Japanese, Korean, Russian, Hindi, Turkish — with
            correct script rendering for RTL and CJK.
          </Feature>
          <Feature title="Your data stays yours">
            Books are encrypted at rest, never used to train AI models,
            permanently deletable any time.
          </Feature>
        </div>
      </section>

      <FAQ />

      <section className="relative z-10 mx-auto mt-8 max-w-2xl px-6 text-center lg:px-10">
        <div className="rounded-3xl border-[1.5px] border-[color:var(--color-saffron)] bg-[color:var(--color-saffron)]/5 p-10">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
            Still deciding?
          </h2>
          <p className="mt-3 text-[color:var(--color-ink-soft)]">
            Start the 14-day trial — no card needed. If Translify doesn't earn
            its place in your reading life, the cancel button is one click and
            we never charge you.
          </p>
          <Link
            href="/onboarding"
            className="mt-6 inline-flex h-12 items-center rounded-full bg-[color:var(--color-saffron)] px-6 font-semibold"
          >
            Start your trial →
          </Link>
        </div>
      </section>
    </main>
  );
}

function Feature({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-[1.5px] border-[color:var(--color-border)] bg-white/60 p-5">
      <h3 className="font-semibold text-[color:var(--color-ink)]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-ink-soft)]">{children}</p>
    </div>
  );
}
