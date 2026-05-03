const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";

const ORGANIZATION = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Translify",
  url: SITE,
  logo: `${SITE}/icon.svg`,
  email: "hello@translify.app",
  sameAs: [
    "https://twitter.com/translifyapp",
    "https://www.linkedin.com/company/translify",
  ],
  description:
    "Translify translates whole books while preserving the original layout, lets readers chat with the text, and quizzes them so the content sticks.",
};

const SOFTWARE_APP = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Translify",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web, iOS, Android",
  description:
    "Upload a PDF or EPUB, read it in any of 14 languages with the original layout preserved, chat with citations, and quiz yourself.",
  url: SITE,
  offers: [
    {
      "@type": "Offer",
      name: "Reader",
      price: "7",
      priceCurrency: "EUR",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "7",
        priceCurrency: "EUR",
        unitCode: "MON",
      },
    },
    {
      "@type": "Offer",
      name: "Scholar",
      price: "15",
      priceCurrency: "EUR",
    },
    {
      "@type": "Offer",
      name: "Family",
      price: "23",
      priceCurrency: "EUR",
    },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.7",
    ratingCount: "1240",
    bestRating: "5",
    worstRating: "1",
  },
};

const WEBSITE = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Translify",
  url: SITE,
  inLanguage: ["en", "fr", "es", "de", "ja", "ar"],
};

const FAQ_PAGE = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is there a free plan?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Translify offers a 30-day money-back guarantee on every paid plan instead — try every feature, and if you're not reading better in a month, we refund you in full.",
      },
    },
    {
      "@type": "Question",
      name: "How does the 30-day refund actually work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Reply to your welcome email any time in your first 30 days. We don't ask why and don't make you fill in a form — refunds usually clear within a day.",
      },
    },
    {
      "@type": "Question",
      name: "Which file types and languages does Translify support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "PDF and EPUB up to 200 MB per book. Translify supports 14 target languages: English, French, Spanish, German, Italian, Portuguese, Dutch, Arabic, Chinese, Japanese, Korean, Russian, Hindi, and Turkish — with proper script rendering for right-to-left and CJK.",
      },
    },
    {
      "@type": "Question",
      name: "Does the translation keep the book's layout?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Translify rebuilds each page with the same shape: paragraphs in the same place, images where they were, headings in the same hierarchy. A side-by-side mode lets you switch back to the source any time.",
      },
    },
    {
      "@type": "Question",
      name: "How accurate are the citations in chat?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Every chat answer links back to the exact passage in the source PDF — page number plus a highlighted excerpt. If a faithful citation can't be found, Translify says so instead of guessing.",
      },
    },
    {
      "@type": "Question",
      name: "Is Translify safe for kids?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Family plan includes a kid-safe mode with reading-age controls, a dialled-down chat tone, and a parent dashboard. Children's profiles can't see books they aren't assigned.",
      },
    },
    {
      "@type": "Question",
      name: "Can I cancel any time?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — one click in account settings. You keep access through the period you've already paid for, and Translify never auto-charges the day after cancellation.",
      },
    },
    {
      "@type": "Question",
      name: "Do you train AI on my books?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Uploads are private to your account, encrypted at rest, and never used to train models. You can delete a book and all its derivatives at any time.",
      },
    },
  ],
};

const BREADCRUMB = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: SITE,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Pricing",
      item: `${SITE}/#pricing`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Get started",
      item: `${SITE}/onboarding`,
    },
  ],
};

export function StructuredData() {
  const blocks = [ORGANIZATION, WEBSITE, SOFTWARE_APP, FAQ_PAGE, BREADCRUMB];
  return (
    <>
      {blocks.map((b, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(b) }}
        />
      ))}
    </>
  );
}
