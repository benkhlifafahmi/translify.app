import type { Metadata } from "next";
import PricingClient from "./pricing-client";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";

export const metadata: Metadata = {
  title: "Pricing — Free tier + plans from €7.99/mo",
  description:
    "Translify pricing — Free, Reader, Scholar, and Family plans. Start free (no card), upgrade from €7.99/month. 30-day money-back guarantee on every paid plan.",
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
      lowPrice: "0",
      highPrice: "22",
      offerCount: "4",
      offers: [
        { "@type": "Offer", name: "Free", price: "0", priceCurrency: "EUR", url: `${SITE}/pricing#free` },
        { "@type": "Offer", name: "Reader", price: "7.99", priceCurrency: "EUR", url: `${SITE}/pricing#reader` },
        { "@type": "Offer", name: "Scholar", price: "14.99", priceCurrency: "EUR", url: `${SITE}/pricing#scholar` },
        { "@type": "Offer", name: "Family", price: "22", priceCurrency: "EUR", url: `${SITE}/pricing#family` },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <PricingClient />
    </>
  );
}
