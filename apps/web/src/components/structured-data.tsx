// Replaces: apps/web/src/components/structured-data.tsx
//
// Three critical fixes vs current implementation:
//
// 1. PRICING: schema now matches the actual landing-page prices (€11/€19/€27),
//    not the legacy €7/€15/€23 numbers — which was a structured-data
//    inconsistency Google would flag.
//
// 2. AGGREGATE RATING: removed entirely. The "4.7 / 1240 ratings" block was
//    not backed by a verifiable third-party review platform. Fake or
//    unverifiable AggregateRating is the #1 reason Google manually demotes
//    rich results. Add it back once you have real review-site presence
//    (Trustpilot, G2, Capterra, App Store) and cite the source.
//
// 3. POSITIONING: description fields rewritten to lead with comprehension /
//    study (the new positioning), not translation (the saturated commodity).

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
    "Translify is an AI reading companion for foreign-language books. Upload any PDF or EPUB, get it translated with the layout preserved, then chat with the book, highlight passages for AI explanations, and quiz yourself to remember what you read.",
  foundingDate: "2026",
  knowsLanguage: ["en", "fr", "es", "de", "ja", "ar", "id", "ms"],
};

const SOFTWARE_APP = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Translify",
  applicationCategory: "EducationalApplication",
  applicationSubCategory: "Reading & Translation",
  operatingSystem: "Web, iOS, Android",
  description:
    "Read any book in any language. Upload a PDF or EPUB, translate it with the original layout preserved, chat with the whole book to get cited answers, highlight passages for AI explanations, and quiz yourself.",
  url: SITE,
  inLanguage: ["en", "fr", "es", "de", "ja", "ar", "id", "ms"],
  // Prices match the actual pricing component on the homepage.
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: "EUR",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "0",
        priceCurrency: "EUR",
        unitCode: "MON",
        referenceQuantity: { "@type": "QuantitativeValue", value: "80", unitText: "pages per month" },
      },
    },
    {
      "@type": "Offer",
      name: "Reader",
      price: "7.99",
      priceCurrency: "EUR",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "7.99",
        priceCurrency: "EUR",
        unitCode: "MON",
        referenceQuantity: { "@type": "QuantitativeValue", value: "600", unitText: "pages per month" },
      },
    },
    {
      "@type": "Offer",
      name: "Scholar",
      price: "14.99",
      priceCurrency: "EUR",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "14.99",
        priceCurrency: "EUR",
        unitCode: "MON",
      },
    },
    {
      "@type": "Offer",
      name: "Family",
      price: "22",
      priceCurrency: "EUR",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "22",
        priceCurrency: "EUR",
        unitCode: "MON",
      },
    },
  ],
  featureList: [
    "Translate PDF and EPUB books into 14 languages with the original layout preserved",
    "Chat with the whole book using RAG — every answer cites the exact page",
    "Highlight any passage and ask AI to explain it in your language",
    "AI-generated quizzes from chapters you have actually read",
    "Notes attached to highlights, searchable across your library",
    "Side-by-side bilingual reading mode",
    "Right-to-left and CJK script rendering",
  ],
  // Re-introduce aggregateRating only when you have a verifiable source.
  // See: https://developers.google.com/search/docs/appearance/structured-data/review-snippet#what-not-to-do
};

const WEBSITE = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Translify",
  url: SITE,
  inLanguage: ["en", "fr", "es", "de", "ja", "ar", "id", "ms"],
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE}/library?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const FAQ_PAGE = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Translify?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Translify is an AI reading companion for foreign-language books. You upload a PDF or EPUB, Translify rebuilds it in your language with the original layout intact, then lets you chat with the whole book, highlight passages for AI explanations, and quiz yourself on what you read.",
      },
    },
    {
      "@type": "Question",
      name: "How is Translify different from Google Translate or DeepL?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Google Translate and DeepL translate text and return a file. Translify gives you a complete reading experience around the translation: chat with the whole book, AI-explained highlights, quiz mode, and side-by-side bilingual reading. It is a study tool, not a translation utility.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a free trial?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — every paid plan starts with a 14-day free trial, no credit card required. Translify also offers a 30-day money-back guarantee on every paid plan, with no questions asked.",
      },
    },
    {
      "@type": "Question",
      name: "Which file types and languages does Translify support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "PDF and EPUB up to 200 MB per book. Translify supports 14 target languages: English, French, Spanish, German, Italian, Portuguese, Dutch, Arabic, Chinese, Japanese, Korean, Russian, Hindi, and Turkish — with correct rendering for right-to-left scripts and CJK characters.",
      },
    },
    {
      "@type": "Question",
      name: "Does the translation keep the book's layout?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Translify rebuilds every page with the same structure: paragraphs in the same place, images where they were, tables intact, headings preserved. A side-by-side mode lets you switch back to the source at any time.",
      },
    },
    {
      "@type": "Question",
      name: "How accurate are Translify's chat answers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Every chat answer links back to the exact passage in the source — page number plus a highlighted excerpt. If a faithful citation cannot be found in the book, Translify says so rather than guessing. The underlying model is Anthropic's Claude.",
      },
    },
    {
      "@type": "Question",
      name: "Can I cancel any time?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — one click in account settings. You keep access through the period you have already paid for, and Translify never auto-charges the day after cancellation.",
      },
    },
    {
      "@type": "Question",
      name: "Does Translify train AI models on my uploaded books?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Uploaded books are private to your account, encrypted at rest, and never used to train any AI model. You can delete a book and all its derivatives at any time from your library.",
      },
    },
  ],
};

const BREADCRUMB = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE },
    { "@type": "ListItem", position: 2, name: "Pricing", item: `${SITE}/#pricing` },
    { "@type": "ListItem", position: 3, name: "Get started", item: `${SITE}/onboarding` },
  ],
};

// HowTo schema for the "Three steps" section on the homepage — directly
// targets featured snippets for "how to translate a book with AI" queries.
const HOW_TO = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to read any book in your language with Translify",
  description:
    "Three steps to upload a foreign-language PDF or EPUB, translate it with the original layout, and start chatting with the text.",
  totalTime: "PT10M",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Upload your book",
      text: "Drop a PDF or EPUB up to 200 MB. Translify supports textbooks, novels, research papers, manga, and children's books.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Pick a target language",
      text: "Choose from 14 languages. Translify rebuilds every page in your target language while preserving the original layout, including right-to-left and CJK scripts.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Read, chat, highlight, quiz",
      text: "Open the translated book, ask questions in your language with cited answers, highlight any passage for an AI explanation, and quiz yourself on what you read.",
    },
  ],
};

export function StructuredData() {
  const blocks = [ORGANIZATION, WEBSITE, SOFTWARE_APP, FAQ_PAGE, HOW_TO, BREADCRUMB];
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
