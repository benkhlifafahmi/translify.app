// Drop in at: apps/web/src/app/read-[source]-books-in-[target]/page.tsx
//
// This is the 56-page programmatic SEO surface. Each (source, target) pair
// gets its own static page with unique content, hreflang, schema, and a
// canonical URL. All pages are statically generated at build time.
//
// Why this slug shape? Google rewards descriptive, intent-bearing URLs
// over generic /lang/X/Y patterns. "/read-spanish-books-in-english" is a
// keyword in itself.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";

// Eight supported UI languages → 8 × 7 = 56 pairs (excluding source==target).
const LANGS = {
  english:    { code: "en", label: "English",    nativeLabel: "English",    sample: "García Márquez, Camus, Sartre — in English" },
  spanish:    { code: "es", label: "Spanish",    nativeLabel: "Español",    sample: "Cervantes, Borges, Allende — in Spanish" },
  french:     { code: "fr", label: "French",     nativeLabel: "Français",   sample: "Camus, Proust, Beauvoir — in French" },
  german:     { code: "de", label: "German",     nativeLabel: "Deutsch",    sample: "Goethe, Kafka, Mann — in German" },
  japanese:   { code: "ja", label: "Japanese",   nativeLabel: "日本語",      sample: "Murakami, Mishima, Sōseki — in Japanese" },
  arabic:     { code: "ar", label: "Arabic",     nativeLabel: "العربية",    sample: "Mahfouz, Darwish, Khoury — in Arabic" },
  indonesian: { code: "id", label: "Indonesian", nativeLabel: "Indonesia",  sample: "Toer, Ananta, Ajidarma — in Indonesian" },
  malay:      { code: "ms", label: "Malay",      nativeLabel: "Melayu",     sample: "Usman Awang, Shahnon Ahmad — in Malay" },
} as const;

type LangSlug = keyof typeof LANGS;

// ───────────────────────── STATIC PARAMS ─────────────────────────

interface Params {
  source: LangSlug;
  target: LangSlug;
}

export function generateStaticParams(): Params[] {
  const slugs = Object.keys(LANGS) as LangSlug[];
  const pairs: Params[] = [];
  for (const source of slugs) {
    for (const target of slugs) {
      if (source !== target) pairs.push({ source, target });
    }
  }
  return pairs;
}

// ───────────────────────── METADATA ─────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ source: string; target: string }>;
}): Promise<Metadata> {
  const { source, target } = await params;
  if (!(source in LANGS) || !(target in LANGS)) return {};
  const src = LANGS[source as LangSlug];
  const tgt = LANGS[target as LangSlug];

  const title = `Read ${src.label} Books in ${tgt.label} with AI — Translify`;
  const description = `Upload any ${src.label} PDF or EPUB. Translify rebuilds the book in ${tgt.label} with the original layout intact — then lets you chat with the text, highlight passages for AI explanations, and quiz yourself. 30-day money-back guarantee.`;

  const path = `/read-${source}-books-in-${target}`;
  const canonical = `${SITE}${path}`;

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      siteName: "Translify",
      images: [
        {
          url: `/og/read-${source}-in-${target}.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/og/read-${source}-in-${target}.png`],
    },
    keywords: [
      `read ${src.label} books in ${tgt.label}`,
      `${src.label} to ${tgt.label} book translation`,
      `translate ${src.label} PDF to ${tgt.label}`,
      `translate ${src.label} EPUB to ${tgt.label}`,
      `${src.label} ${tgt.label} AI book reader`,
      `understand ${src.label} books with AI`,
    ],
  };
}

// ───────────────────────── PAGE ─────────────────────────

export default async function ReadSourceInTargetPage({
  params,
}: {
  params: Promise<{ source: string; target: string }>;
}) {
  const { source, target } = await params;
  if (!(source in LANGS) || !(target in LANGS) || source === target) {
    notFound();
  }
  const src = LANGS[source as LangSlug];
  const tgt = LANGS[target as LangSlug];

  const faqs = buildFaqs(src, tgt);

  // Per-page JSON-LD blocks: WebPage + BreadcrumbList + FAQPage.
  // These signal to Google that this is an intentful, unique landing page.
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Languages", item: `${SITE}/languages` },
      { "@type": "ListItem", position: 3, name: `${src.label} → ${tgt.label}`, item: `${SITE}/read-${source}-books-in-${target}` },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <nav className="mb-6 text-sm text-[color:var(--color-ink-soft)]">
        <Link href="/">Home</Link> · <Link href="/languages">Languages</Link> ·{" "}
        <span>{src.label} → {tgt.label}</span>
      </nav>

      <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
        Read {src.label} books in {tgt.label}, with AI.
      </h1>

      <p className="mt-5 text-lg leading-relaxed text-[color:var(--color-ink-soft)]">
        Drop in any {src.label} PDF or EPUB. Translify rebuilds the whole book
        in {tgt.label} — same paragraphs, same images, same layout — then lets
        you chat with the text, highlight any passage for an AI explanation,
        and quiz yourself so the content sticks. {src.sample}.
      </p>

      <div className="mt-8 flex gap-3">
        <Link
          href="/onboarding"
          className="inline-flex h-12 items-center rounded-full bg-[color:var(--color-saffron)] px-6 font-semibold shadow-[0_2px_0_rgba(140,90,30,0.5)]"
        >
          Start a 14-day trial
        </Link>
        <Link
          href="/#pricing"
          className="inline-flex h-12 items-center rounded-full border-[1.5px] border-[color:var(--color-border-strong)] px-6 font-semibold"
        >
          See plans
        </Link>
      </div>

      <section className="mt-14">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
          Why readers choose Translify for {src.label} → {tgt.label}
        </h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          <Bullet title="Layout preserved, page by page">
            Tables stay tables. Headings stay headings. {src.label}'s script
            renders correctly — including right-to-left and CJK characters
            where relevant.
          </Bullet>
          <Bullet title="Chat with the whole book">
            Ask anything in {tgt.label}. Every answer links to the exact
            passage in the {src.label} source — page number, highlighted
            excerpt, jump button.
          </Bullet>
          <Bullet title="AI-explained highlights">
            Select any passage in the original {src.label}. Get an AI
            explanation in {tgt.label}. Save a note. Quiz on it later.
          </Bullet>
          <Bullet title="Built for serious reading">
            University students, researchers, and curious readers who want to
            actually understand foreign-language books — not just decode words.
          </Bullet>
        </ul>
      </section>

      <section className="mt-14">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
          How {src.label} → {tgt.label} translation works
        </h2>
        <ol className="mt-5 space-y-4 text-[color:var(--color-ink)]">
          <Step n={1} title={`Upload a ${src.label} PDF or EPUB`}>
            Up to 200 MB per book. We accept novels, textbooks, papers, manga,
            and children's books in {src.nativeLabel}.
          </Step>
          <Step n={2} title={`Pick ${tgt.label} as your target`}>
            Translify rebuilds every page in {tgt.label} — paragraphs in the
            same place, images where they were, headings preserved. You can
            switch back to the {src.label} source any time.
          </Step>
          <Step n={3} title="Read, chat, highlight, quiz">
            Ask the book questions in {tgt.label}. Highlight any passage to
            get an AI explanation. Generate quizzes from chapters you've
            actually read.
          </Step>
        </ol>
      </section>

      <section className="mt-14">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
          Frequently asked
        </h2>
        <dl className="mt-5 space-y-5">
          {faqs.map((f) => (
            <div key={f.q}>
              <dt className="font-semibold text-[color:var(--color-ink)]">{f.q}</dt>
              <dd className="mt-1 text-[color:var(--color-ink-soft)]">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-14">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
          Other language pairs
        </h2>
        <p className="mt-2 text-[color:var(--color-ink-soft)]">
          Translify supports 56 pairs across 8 languages. Browse them all:
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {(Object.keys(LANGS) as LangSlug[])
            .filter((l) => l !== source)
            .map((l) => (
              <li key={l}>
                <Link
                  href={`/read-${source}-books-in-${l}`}
                  className="inline-block rounded-full border-[1.5px] border-[color:var(--color-border)] px-3 py-1 text-sm hover:border-[color:var(--color-saffron)]"
                >
                  {src.label} → {LANGS[l].label}
                </Link>
              </li>
            ))}
        </ul>
      </section>
    </main>
  );
}

// ───────────────────────── HELPERS ─────────────────────────

function Bullet({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="rounded-2xl border-[1.5px] border-[color:var(--color-border)] bg-white/60 p-5">
      <h3 className="font-semibold text-[color:var(--color-ink)]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-ink-soft)]">{children}</p>
    </li>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[color:var(--color-saffron)]/15 font-semibold text-[color:var(--color-saffron-deep)]">
        {n}
      </span>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-[color:var(--color-ink-soft)]">{children}</p>
      </div>
    </li>
  );
}

interface Faq { q: string; a: string }

function buildFaqs(
  src: (typeof LANGS)[LangSlug],
  tgt: (typeof LANGS)[LangSlug],
): Faq[] {
  return [
    {
      q: `Can Translify translate any ${src.label} book to ${tgt.label}?`,
      a: `Yes — Translify works with any PDF or EPUB up to 200 MB. We rebuild every page in ${tgt.label} while preserving the original layout, including ${src.label}'s native script. Novels, textbooks, papers, manga, and children's books are all supported.`,
    },
    {
      q: `Does the ${tgt.label} translation preserve the book's layout?`,
      a: `Yes. Tables stay tables, headings stay headings, images stay where they were. A side-by-side mode lets you see the original ${src.label} and the ${tgt.label} translation simultaneously.`,
    },
    {
      q: `Can I ask the book questions in ${tgt.label}?`,
      a: `Yes. Translify includes a built-in chat that uses the whole book as context. Ask anything in ${tgt.label}, get an answer with the exact ${src.label} or ${tgt.label} passage cited, including page number.`,
    },
    {
      q: `How accurate is ${src.label} → ${tgt.label} translation in Translify?`,
      a: `Translify uses Claude (Anthropic) and DeepL — currently the two highest-rated engines for ${src.label} ↔ ${tgt.label} translation quality, particularly for nuance, idiom, and long-context coherence. For technical or literary works, accuracy is suitable for study and comprehension.`,
    },
    {
      q: `Is there a free trial?`,
      a: `Yes — every plan starts with a 14-day trial, plus a 30-day money-back guarantee on every paid plan. No questions asked.`,
    },
    {
      q: `What's the difference between Translify and Google Translate for ${src.label} books?`,
      a: `Google Translate translates text snippets. Translify translates the whole book while preserving layout, then lets you chat with it, highlight passages for AI explanations, and quiz yourself. It's a study tool, not a translation utility.`,
    },
  ];
}
