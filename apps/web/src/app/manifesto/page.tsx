import type { Metadata } from "next";
import ManifestoClient from "./manifesto-client";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";

export const metadata: Metadata = {
  title: "Why we built Translify",
  description:
    "Translify exists because reading should not stop at language. Our manifesto: what we believe about reading, why machine translation alone isn't enough, and how AI changes what's possible for serious readers.",
  alternates: { canonical: "/manifesto" },
  openGraph: {
    type: "article",
    title: "Why we built Translify",
    description:
      "Reading should not stop at language. Here is what we believe about reading, translation, and AI.",
    url: `${SITE}/manifesto`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Why we built Translify",
    description: "Reading should not stop at language. Here is what we believe.",
  },
};

export default function ManifestoPage() {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Why we built Translify",
    description:
      "Translify's founding manifesto — why reading should not stop at language, and how AI changes what is possible for serious readers.",
    author: {
      "@type": "Organization",
      name: "Translify",
      url: SITE,
    },
    publisher: {
      "@type": "Organization",
      name: "Translify",
      logo: { "@type": "ImageObject", url: `${SITE}/icon.svg` },
    },
    datePublished: "2026-05-10",
    dateModified: "2026-05-10",
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}/manifesto` },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <ManifestoClient />
    </>
  );
}
