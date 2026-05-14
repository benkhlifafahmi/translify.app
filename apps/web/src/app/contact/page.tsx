import type { Metadata } from "next";
import ContactClient from "./contact-client";

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
      availableLanguage: ["English", "French", "Spanish", "German", "Chinese", "Arabic", "Japanese", "Indonesian", "Malay"],
    }],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />
      <ContactClient />
    </>
  );
}
