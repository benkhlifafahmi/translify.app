// Drop in at: apps/web/src/app/alternative/[slug]/page.tsx
//
// Comparison pages are the highest-converting SEO surface on the internet:
// people who Google "{competitor} alternative" already have intent and budget.
// You just need to be the page that ranks.
//
// Word-count target: 1,800–2,500 words. Anything under 1,200 reads as thin.
// Must-include sections (rank-required, in this order):
//   1. Plain-English summary ("Translify is the closest [Competitor]
//      alternative for X") — 40-60 words for featured-snippet eligibility
//   2. Feature comparison table — 8-15 rows, honest, includes wins and losses
//   3. Pricing comparison — side-by-side
//   4. When to choose [Competitor] / When to choose Translify — both sides
//   5. Migration guide — "How to switch from [Competitor]"
//   6. FAQ — 6-10 questions with FAQ schema
// Every section above is required for ranking.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";

interface FeatureRow {
  name: string;
  translify: string | boolean;
  competitor: string | boolean;
  notes?: string;
}

interface PricingTier {
  name: string;
  price: string;
  features: string[];
}

interface CompetitorData {
  name: string;
  url: string;
  /** Short, plain-English summary of who the competitor is. */
  summary: string;
  /** 40-60 word featured-snippet-eligible answer block. */
  snippetAnswer: string;
  features: FeatureRow[];
  competitorPricing: PricingTier[];
  translifyPricing: PricingTier[];
  /** Why someone would honestly still pick the competitor. */
  whyCompetitor: string[];
  /** Why someone would switch to Translify. */
  whyTranslify: string[];
  /** Migration steps. */
  migration: string[];
  faqs: { q: string; a: string }[];
}

const ALTERNATIVES: Record<string, CompetitorData> = {
  "readlang": {
    name: "Readlang",
    url: "https://readlang.com/",
    summary:
      "Readlang is a web-based reader that lets you click words for translations while reading articles, EPUBs, or Kindle books. It saves your lookups as flashcards for spaced repetition. It costs $5/month and is built for language learners.",
    snippetAnswer:
      "Translify is the closest Readlang alternative for readers who want to chat with the whole book, get AI explanations of highlighted passages, and quiz themselves on what they read — not just look up words. Translify keeps the original layout, supports PDFs and EPUBs up to 200 MB, and works across 14 target languages.",
    features: [
      { name: "Word lookup while reading", translify: true, competitor: true },
      { name: "EPUB support", translify: true, competitor: true },
      { name: "PDF support", translify: true, competitor: "Limited" },
      { name: "Original layout preserved", translify: true, competitor: false, notes: "Readlang reflows text" },
      { name: "Chat with the whole book (RAG)", translify: true, competitor: false },
      { name: "AI-explained highlights in your language", translify: true, competitor: "Word-level only" },
      { name: "AI-generated quizzes from your reading", translify: true, competitor: false },
      { name: "Flashcards + spaced repetition", translify: "Coming Q3", competitor: true },
      { name: "Kindle library import", translify: false, competitor: true },
      { name: "Right-to-left scripts (Arabic)", translify: true, competitor: "Partial" },
      { name: "CJK scripts (Japanese, Chinese, Korean)", translify: true, competitor: true },
      { name: "Side-by-side bilingual mode", translify: true, competitor: false },
      { name: "Export translated PDF", translify: true, competitor: false },
      { name: "Money-back guarantee", translify: "30 days", competitor: "None" },
    ],
    competitorPricing: [
      { name: "Free", price: "$0", features: ["Limited word translations", "5 EPUBs"] },
      { name: "Premium", price: "$5/mo", features: ["Unlimited translations", "Unlimited flashcards", "Context-aware AI"] },
    ],
    translifyPricing: [
      { name: "Free", price: "€0", features: ["80 pages/month", "2 languages", "Translation only"] },
      { name: "Reader", price: "€7.99/mo", features: ["600 pages/month (~3 books)", "Chat with book", "Quiz mode"] },
      { name: "Scholar", price: "€14.99/mo", features: ["Unlimited pages", "AI-explained highlights", "Priority support"] },
      { name: "Family", price: "€22/mo", features: ["Unlimited pages", "Up to 5 readers", "Kid-safe mode"] },
    ],
    whyCompetitor: [
      "You're a casual language learner who wants to read web articles or Kindle books, not study PDFs in depth.",
      "Spaced-repetition flashcards are your primary learning mechanism.",
      "You want the cheapest possible option ($5/mo) and don't need AI chat or quizzes.",
      "You read primarily in your browser, not from uploaded files.",
    ],
    whyTranslify: [
      "You read serious foreign-language material — university texts, business non-fiction, technical papers — and need to understand it, not just decode words.",
      "Layout matters: tables, figures, footnotes, equations. Readlang reflows; Translify preserves.",
      "You want to chat with the whole book — ask 'what's the author's argument about X' and get a cited answer from across the text.",
      "You want AI to explain a passage in your language, not just translate words.",
      "Self-tests via quizzes are part of how you study.",
    ],
    migration: [
      "Export your Readlang word library (Settings → Export → CSV).",
      "Sign up for Translify with a 14-day trial — no card required.",
      "Upload your EPUB or PDF — Translify keeps the original layout intact.",
      "Optional: import your Readlang word list as starter notes (we'll add a one-click import — until then, paste the CSV into your first highlight collection).",
      "Pick your target language and Translify rebuilds the book — usually within 5–10 minutes for a typical novel.",
    ],
    faqs: [
      {
        q: "Is Translify a Readlang alternative?",
        a: "Yes, but with a different focus. Readlang is built for casual language learners reading articles and Kindle books at word level. Translify is built for serious readers who upload full PDFs or EPUBs, want the layout preserved, and want to chat with the whole book — not just look up vocabulary.",
      },
      {
        q: "Does Translify support flashcards like Readlang?",
        a: "Flashcards are on the roadmap (Q3 2026). For now, Translify's quiz mode generates multiple-choice questions from the chapters you've actually read, with citations to the exact passage — a different study mechanism aimed at comprehension over vocabulary.",
      },
      {
        q: "Can I import my Kindle library into Translify like I can in Readlang?",
        a: "Not directly. You can upload any EPUB file (including DRM-free Kindle exports) up to 200 MB. We don't currently sync with your Amazon Kindle account.",
      },
      {
        q: "How does Translify pricing compare to Readlang's $5/month?",
        a: "Translify's Reader plan is €7.99/month — more than Readlang's Premium. The trade-off: Translify includes whole-book AI chat, AI-explained highlights, quiz generation, and full layout preservation. If you only need word-level translation, Readlang is cheaper. If you need a study companion, Translify is purpose-built for it.",
      },
      {
        q: "Which is better for university students?",
        a: "Translify, for most cases. University reading involves dense PDFs (papers, textbooks) where layout matters and where 'what does this argument actually mean' questions are more useful than 'what does this word mean' lookups.",
      },
      {
        q: "Can I try Translify before paying?",
        a: "Yes — every plan starts with a 14-day trial, no card required. Every paid plan also includes a 30-day money-back guarantee, no questions asked.",
      },
    ],
  },
  "immersive-translate": {
    name: "Immersive Translate",
    url: "https://immersivetranslate.com/",
    summary:
      "Immersive Translate is a browser extension and mobile app that translates websites, PDFs, EPUBs, video subtitles, and meeting captions bilingually. It supports 20+ translation engines and has 10M+ users. It costs $9.99/month.",
    snippetAnswer:
      "Translify is the closest Immersive Translate alternative for readers who want to deeply study one book at a time — chat with it, highlight passages for AI explanations, and quiz themselves — rather than translating across many surfaces (web, video, meetings). Immersive Translate is a Swiss Army knife; Translify is a study companion.",
    features: [
      { name: "Whole-book PDF/EPUB translation", translify: true, competitor: true },
      { name: "Original layout preserved", translify: true, competitor: true },
      { name: "Website translation", translify: false, competitor: true },
      { name: "Video subtitle translation", translify: false, competitor: true },
      { name: "Meeting translation (Zoom, Meet, Teams)", translify: false, competitor: true },
      { name: "Image OCR translation", translify: false, competitor: true },
      { name: "Chat with the whole book (RAG)", translify: true, competitor: false },
      { name: "AI-explained highlights", translify: true, competitor: false },
      { name: "Quizzes generated from your reading", translify: true, competitor: false },
      { name: "Notes attached to highlights", translify: true, competitor: false },
      { name: "Side-by-side bilingual reading", translify: true, competitor: true },
      { name: "Browser extension", translify: false, competitor: true },
      { name: "Money-back guarantee", translify: "30 days", competitor: "None" },
    ],
    competitorPricing: [
      { name: "Free", price: "$0", features: ["Limited bilingual website translations"] },
      { name: "Pro", price: "$9.99/mo or $70/yr", features: ["Unlimited translation", "PDF/EPUB bilingual", "Video subs", "20+ engines"] },
    ],
    translifyPricing: [
      { name: "Free", price: "€0", features: ["80 pages/month", "2 languages", "Translation only"] },
      { name: "Reader", price: "€7.99/mo", features: ["600 pages/month (~3 books)", "Chat with book", "Quiz mode"] },
      { name: "Scholar", price: "€14.99/mo", features: ["Unlimited pages", "AI-explained highlights", "Priority support"] },
      { name: "Family", price: "€22/mo", features: ["Unlimited pages", "Up to 5 readers", "Kid-safe mode"] },
    ],
    whyCompetitor: [
      "You translate across many surfaces — websites, videos, meetings, images — and want one tool that does all of them.",
      "You read many books shallowly and don't need to chat with each one in depth.",
      "You want a browser extension that lives in your everyday workflow.",
      "Your primary translation need is web content, not books.",
    ],
    whyTranslify: [
      "Your primary need is books — you read them slowly, deeply, and want to understand them.",
      "You want to chat with the entire book and get cited answers, not just bilingual word display.",
      "You want AI to explain dense passages in your language.",
      "You want generated quizzes from chapters you've read.",
      "You take notes while reading and want them attached to highlights.",
    ],
    migration: [
      "Keep using Immersive Translate for websites and videos if you still want to.",
      "Sign up for Translify with the 14-day trial.",
      "Upload your first PDF or EPUB — same import as Immersive Translate.",
      "Notice the difference: chat panel, highlight-to-ask, and the quiz tab.",
      "If after 30 days Translify isn't earning its place alongside Immersive, request a refund — no questions.",
    ],
    faqs: [
      {
        q: "Is Translify an Immersive Translate alternative?",
        a: "For book reading specifically, yes. Immersive Translate is broader (web, video, meetings); Translify is deeper for one use case — reading a book and actually understanding it.",
      },
      {
        q: "Should I replace Immersive Translate with Translify?",
        a: "Not necessarily. Many readers use both: Immersive Translate for websites and videos, Translify for the books they want to study. Different tools, overlapping but distinct value.",
      },
      {
        q: "Does Translify offer a browser extension like Immersive Translate?",
        a: "No, not currently. Translify is a web app — you upload books to it rather than translating in-place across the web.",
      },
      {
        q: "Which is cheaper?",
        a: "Immersive Translate at $9.99/mo is slightly more than Translify's Reader plan at €7.99/mo. If you only need bilingual book reading, Immersive Translate is a fine choice. Translify adds the chat, highlight, and quiz layers.",
      },
      {
        q: "Can I use both?",
        a: "Yes. Many users do — Immersive for browsing, Translify for sustained reading. They don't conflict.",
      },
      {
        q: "How does AI chat with the whole book actually work in Translify?",
        a: "Translify embeds every chunk of your book into a vector database, so when you ask a question, it retrieves the most relevant passages and answers using Claude with citations. Immersive Translate doesn't do this — it's a translation overlay, not a comprehension tool.",
      },
    ],
  },
  "kindle-translate": {
    name: "Amazon Kindle Translate",
    url: "https://www.amazon.com/kindle",
    summary:
      "Amazon Kindle Translate launched in November 2025, bringing AI-powered book translation directly into the Kindle reading experience. It currently supports English ↔ Spanish and German → English. It's bundled with Kindle subscriptions.",
    snippetAnswer:
      "Translify is the closest Kindle Translate alternative for readers who want broader language coverage (8 languages, 56 pairs), full PDF support, AI chat with the book, and AI-explained highlights — without being locked into the Amazon ecosystem. Kindle Translate is bundled; Translify is portable.",
    features: [
      { name: "AI-translated book reading", translify: true, competitor: true },
      { name: "Languages supported", translify: "8 (56 pairs)", competitor: "3 pairs (EN↔ES, DE→EN)" },
      { name: "Upload your own PDF/EPUB", translify: true, competitor: false, notes: "Kindle Translate only works on Kindle Store titles" },
      { name: "Original layout preserved", translify: true, competitor: "Reflows for Kindle" },
      { name: "Chat with the whole book", translify: true, competitor: false },
      { name: "AI-explained highlights", translify: true, competitor: false },
      { name: "Quizzes from your reading", translify: true, competitor: false },
      { name: "Works outside Amazon ecosystem", translify: true, competitor: false },
      { name: "Export translated book", translify: true, competitor: false },
      { name: "Money-back guarantee", translify: "30 days", competitor: "Kindle return policy" },
    ],
    competitorPricing: [
      { name: "Bundled with Kindle", price: "Free with eligible titles", features: ["Limited to EN↔ES and DE→EN", "Kindle Store titles only"] },
    ],
    translifyPricing: [
      { name: "Free", price: "€0", features: ["80 pages/month", "2 languages", "Translation only"] },
      { name: "Reader", price: "€7.99/mo", features: ["600 pages/month (~3 books)", "8 languages, 56 pairs", "Chat with book"] },
      { name: "Scholar", price: "€14.99/mo", features: ["Unlimited pages", "AI-explained highlights", "Priority support"] },
      { name: "Family", price: "€22/mo", features: ["Unlimited pages", "Up to 5 readers", "Kid-safe mode"] },
    ],
    whyCompetitor: [
      "You only read Kindle Store titles in English↔Spanish or German→English.",
      "You're heavily invested in the Amazon ecosystem (Kindle device, Audible, Prime).",
      "You don't need PDF support.",
      "You don't need chat, highlights, or quizzes.",
    ],
    whyTranslify: [
      "You read books outside the Kindle Store — academic PDFs, EPUBs from Project Gutenberg, papers, manga, books bought elsewhere.",
      "You need more than 3 language pairs — Translify supports 56 across 8 languages.",
      "You want to actively study a book, not just passively read it: chat, highlight-to-ask, quizzes.",
      "You don't want to be locked into Amazon's ecosystem.",
    ],
    migration: [
      "Continue using Kindle for Kindle Store titles in EN↔ES or DE→EN — Translify isn't trying to replace that workflow.",
      "For everything else (PDFs, EPUBs, other language pairs), use Translify.",
      "Sign up with the 14-day trial.",
      "Upload your first non-Kindle book.",
    ],
    faqs: [
      {
        q: "Is Translify an Amazon Kindle Translate alternative?",
        a: "Yes, for any reading outside the Kindle Store or beyond Kindle Translate's three supported language pairs (EN↔ES, DE→EN). Translify works with any PDF or EPUB, in 56 language pairs across 8 languages.",
      },
      {
        q: "Can I use Translify on my Kindle?",
        a: "Not on the Kindle device itself, but Translify works in any browser on any device — including the Kindle's experimental browser, though we recommend a phone or tablet for a better reading experience.",
      },
      {
        q: "Will Amazon's Kindle Translate eventually replace tools like Translify?",
        a: "Unlikely for the next 2-3 years. Kindle Translate is restricted to Kindle Store catalog and a narrow set of language pairs. Independent reading tools that work with any file in any language pair will remain necessary for serious readers, researchers, and language learners.",
      },
      {
        q: "Does Translify translate as well as Kindle Translate?",
        a: "Translify uses Claude (Anthropic) and DeepL — both top-tier engines for European languages, often rated higher than Amazon's translation quality for nuance and long-context coherence.",
      },
      {
        q: "What's the price difference?",
        a: "Kindle Translate is bundled (effectively free) on eligible Kindle Store titles. Translify starts free (no card), with paid plans from €7.99/month. The trade-off is breadth: Translify works with any book, any source, in any of 56 language pairs.",
      },
    ],
  },
  "deepl": {
    name: "DeepL",
    url: "https://www.deepl.com/",
    summary:
      "DeepL is the gold standard for translation quality in European languages, especially for technical and nuanced text. Its Document Translator preserves formatting for PDFs and Word docs. DeepL Pro starts at $8.74/month.",
    snippetAnswer:
      "Translify is the closest DeepL alternative for whole-book reading because DeepL gives you the translated file and that's it — Translify gives you a complete reading experience with chat, highlights, AI explanations, and quizzes on top of comparable-quality translation. Many Translify users use DeepL as the underlying translation engine.",
    features: [
      { name: "Translation quality (European langs)", translify: "Excellent (uses DeepL)", competitor: "Excellent" },
      { name: "Whole-book PDF translation", translify: true, competitor: true },
      { name: "EPUB translation", translify: true, competitor: false },
      { name: "Layout preservation", translify: true, competitor: true },
      { name: "Chat with the translated book", translify: true, competitor: false },
      { name: "AI-explained highlights", translify: true, competitor: false },
      { name: "Quizzes from your reading", translify: true, competitor: false },
      { name: "Notes + highlights system", translify: true, competitor: false },
      { name: "Browser/desktop translation tool", translify: false, competitor: true },
      { name: "API access for developers", translify: false, competitor: true },
    ],
    competitorPricing: [
      { name: "Free", price: "$0", features: ["1,500 chars/month", "3 document translations/month"] },
      { name: "Starter", price: "$8.74/mo", features: ["Unlimited translation", "5 docs/month"] },
      { name: "Advanced", price: "$28.74/mo", features: ["20 docs/month", "Glossaries"] },
    ],
    translifyPricing: [
      { name: "Free", price: "€0", features: ["80 pages/month", "2 languages", "Translation only"] },
      { name: "Reader", price: "€7.99/mo", features: ["600 pages/month (~3 books)", "Chat with book", "Quiz mode"] },
      { name: "Scholar", price: "€14.99/mo", features: ["Unlimited pages", "AI-explained highlights", "Priority support"] },
      { name: "Family", price: "€22/mo", features: ["Unlimited pages", "Up to 5 readers", "Kid-safe mode"] },
    ],
    whyCompetitor: [
      "You need raw translation quality and that's it — you'll do your own reading and study elsewhere.",
      "You need an API to integrate translation into your own product.",
      "You translate occasional documents, not whole books for sustained reading.",
      "You're already a heavy DeepL user with a Pro subscription and want to keep one tool.",
    ],
    whyTranslify: [
      "You want the same translation quality as DeepL but inside a reading experience — chat, highlights, notes, quizzes.",
      "You read books, not snippets — and you want a tool that knows the whole book is the context.",
      "You want to study what you read, not just translate it.",
      "You don't want to download a translated PDF and then figure out how to study it separately.",
    ],
    migration: [
      "Keep DeepL Pro if you need it for raw document translation or API access.",
      "Sign up for Translify alongside — they don't conflict.",
      "Translify can use DeepL as the translation engine for many language pairs, so you're not changing translation provider, you're adding a reading layer.",
    ],
    faqs: [
      {
        q: "Is Translify built on DeepL?",
        a: "For many European-language pairs, yes — Translify uses DeepL as one of its translation engines (alongside Anthropic Claude). You get DeepL-quality translation inside a full reading + study experience.",
      },
      {
        q: "Why not just use DeepL directly?",
        a: "DeepL gives you a translated file. Translify gives you a translated file plus chat with the book, AI-explained highlights, AI-generated quizzes, and a notes system. If translation is all you need, DeepL is enough. If you want to study the book, Translify is the wrapper.",
      },
      {
        q: "Which has better translation quality for German/French/Spanish books?",
        a: "Equivalent — Translify uses DeepL under the hood for European pairs. The difference is everything around the translation.",
      },
      {
        q: "Can I export a Translify-translated book as a PDF, like DeepL?",
        a: "Yes. Translify exports the translated book as PDF including any notes and highlights you've added.",
      },
      {
        q: "Do you support DeepL's lesser-known language pairs?",
        a: "Translify supports 8 languages (56 pairs) at launch. DeepL supports 30+ languages. If you need a less-common pair like Slovak or Estonian, DeepL is your option today.",
      },
    ],
  },
};

// ───────────────────────── STATIC PARAMS ─────────────────────────

export function generateStaticParams() {
  return Object.keys(ALTERNATIVES).map((slug) => ({ slug }));
}

// ───────────────────────── METADATA ─────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = ALTERNATIVES[slug];
  if (!data) return {};

  const title = `${data.name} Alternative for Book Reading — Translify`;
  const description = `Looking for a ${data.name} alternative? Translify lets you upload any PDF or EPUB, translate it across 8 languages, chat with the whole book, highlight passages for AI explanations, and quiz yourself. 30-day money-back.`;
  const path = `/alternative/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: `${SITE}${path}`,
      type: "article",
      images: [{ url: `/og/alternative-${slug}.png`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/og/alternative-${slug}.png`],
    },
    keywords: [
      `${data.name} alternative`,
      `${data.name} vs Translify`,
      `${data.name} competitor`,
      `best ${data.name} alternative`,
      `cheaper than ${data.name}`,
    ],
  };
}

// ───────────────────────── PAGE ─────────────────────────

export default async function AlternativePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = ALTERNATIVES[slug];
  if (!data) notFound();

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
        Translify vs {data.name}
      </h1>
      <p className="mt-3 text-[color:var(--color-ink-soft)]">
        An honest comparison for serious readers.
      </p>

      {/* Featured-snippet-ready answer block */}
      <section className="mt-8 rounded-2xl bg-[color:var(--color-paper-3)]/60 p-6">
        <h2 className="text-lg font-semibold">Is Translify a {data.name} alternative?</h2>
        <p className="mt-3 leading-relaxed">{data.snippetAnswer}</p>
      </section>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
          About {data.name}
        </h2>
        <p className="mt-3 leading-relaxed text-[color:var(--color-ink-soft)]">
          {data.summary}
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
          Feature-by-feature comparison
        </h2>
        <div className="mt-5 overflow-x-auto rounded-xl border-[1.5px] border-[color:var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--color-paper-2)]/60">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Feature</th>
                <th className="px-4 py-3 text-left font-semibold">Translify</th>
                <th className="px-4 py-3 text-left font-semibold">{data.name}</th>
              </tr>
            </thead>
            <tbody>
              {data.features.map((f, i) => (
                <tr key={f.name} className={i % 2 === 0 ? "bg-white/40" : ""}>
                  <td className="px-4 py-3">{f.name}</td>
                  <td className="px-4 py-3"><Cell value={f.translify} /></td>
                  <td className="px-4 py-3"><Cell value={f.competitor} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border-[1.5px] border-[color:var(--color-border)] p-6">
          <h3 className="font-semibold">Choose {data.name} if…</h3>
          <ul className="mt-3 space-y-2 text-sm text-[color:var(--color-ink-soft)]">
            {data.whyCompetitor.map((r) => <li key={r}>• {r}</li>)}
          </ul>
        </div>
        <div className="rounded-xl border-[1.5px] border-[color:var(--color-saffron)] bg-[color:var(--color-saffron)]/5 p-6">
          <h3 className="font-semibold">Choose Translify if…</h3>
          <ul className="mt-3 space-y-2 text-sm text-[color:var(--color-ink-soft)]">
            {data.whyTranslify.map((r) => <li key={r}>• {r}</li>)}
          </ul>
        </div>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <PricingBox title={`${data.name} pricing`} tiers={data.competitorPricing} />
        <PricingBox title="Translify pricing" tiers={data.translifyPricing} highlight />
      </section>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
          How to switch from {data.name} to Translify
        </h2>
        <ol className="mt-5 space-y-3 text-[color:var(--color-ink)]">
          {data.migration.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="font-semibold text-[color:var(--color-saffron-deep)]">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">FAQ</h2>
        <dl className="mt-5 space-y-5">
          {data.faqs.map((f) => (
            <div key={f.q}>
              <dt className="font-semibold">{f.q}</dt>
              <dd className="mt-1 text-[color:var(--color-ink-soft)]">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-14 rounded-3xl bg-[color:var(--color-ink)] p-10 text-center text-[color:var(--color-paper)]">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
          See for yourself
        </h2>
        <p className="mt-3 opacity-80">14-day trial. 30-day money-back. No card required.</p>
        <Link
          href="/join"
          className="mt-6 inline-flex h-12 items-center rounded-full bg-[color:var(--color-saffron)] px-6 font-semibold text-[color:var(--color-ink)]"
        >
          Start your trial →
        </Link>
      </section>
    </main>
  );
}

function Cell({ value }: { value: string | boolean }) {
  if (value === true) return <span className="text-[color:var(--color-sage-deep)]">✓ Yes</span>;
  if (value === false) return <span className="text-[color:var(--color-ink-soft)]">— No</span>;
  return <span>{value}</span>;
}

function PricingBox({
  title,
  tiers,
  highlight = false,
}: {
  title: string;
  tiers: PricingTier[];
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-6 ${
        highlight
          ? "border-[1.5px] border-[color:var(--color-saffron)] bg-[color:var(--color-saffron)]/5"
          : "border-[1.5px] border-[color:var(--color-border)]"
      }`}
    >
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-4 space-y-4">
        {tiers.map((t) => (
          <li key={t.name}>
            <div className="flex items-baseline justify-between">
              <span className="font-semibold">{t.name}</span>
              <span className="font-mono text-sm">{t.price}</span>
            </div>
            <ul className="mt-1 text-xs text-[color:var(--color-ink-soft)]">
              {t.features.map((f) => <li key={f}>• {f}</li>)}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
