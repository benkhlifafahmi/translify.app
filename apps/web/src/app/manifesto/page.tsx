import type { Metadata } from "next";
import Link from "next/link";

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
  // Article schema strengthens E-E-A-T signal for AI search engines.
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
    <main className="mx-auto max-w-2xl px-6 py-16 lg:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <nav className="mb-10 text-sm text-[color:var(--color-ink-soft)]">
        <Link href="/" className="hover:text-[color:var(--color-ink)]">
          ← Back home
        </Link>
      </nav>

      <header>
        <span className="badge-pill bg-[color:var(--color-paper-3)] text-[color:var(--color-ink-soft)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-saffron)]" />
          Manifesto
        </span>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-[clamp(2.4rem,5vw,3.6rem)] font-semibold leading-[1.05] tracking-tight">
          Reading should not stop{" "}
          <em className="text-[color:var(--color-saffron-deep)]">at language</em>.
        </h1>
        <p className="mt-4 text-sm text-[color:var(--color-ink-soft)]">
          Published May 10, 2026 — by the Translify team
        </p>
      </header>

      <article className="prose-manifesto mt-12 space-y-6 text-[1.05rem] leading-relaxed text-[color:var(--color-ink)]">
        <p>
          Translify is an AI reading companion for serious readers — students,
          researchers, prosumers, anyone who wants to read a book in a language
          they don't speak fluently and actually understand it.
        </p>

        <p>
          We built it because the existing tools fall into two camps, neither
          of which solves the real problem. On one side: translation utilities
          (Google Translate, DeepL) that give you a translated file and call
          it done. On the other: AI study tools (NotebookLM, Mindgrasp) that
          only work on documents already in your language. Neither tool is
          built for the actual experience of reading a foreign-language book
          deeply.
        </p>

        <h2 className="!mt-12 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
          What we believe
        </h2>

        <p>
          <strong>Reading is comprehension, not decoding.</strong> Translating
          word-by-word — or even sentence-by-sentence — loses the thread of
          argument that makes a book worth reading in the first place. The
          point of reading Goethe is to understand what Goethe was actually
          saying, not just to know what each German word means in English.
        </p>

        <p>
          <strong>Layout is meaning.</strong> A tabular comparison says
          something a paragraph cannot. A footnote next to its referent says
          something a footnote at the end of the document cannot. Reflowing a
          book to plain text — which most translation tools quietly do — is a
          kind of lossy compression we don't have to accept anymore.
        </p>

        <p>
          <strong>The reader is the right unit of attention.</strong> We
          don't build for the publishing house (Amazon's Kindle Translate),
          for the language learner (Readlang, Beelinguapp), or for the
          casual web-page translator (Immersive Translate). We build for
          the person who has chosen this particular book and wants to read
          it well.
        </p>

        <h2 className="!mt-12 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
          Why now
        </h2>

        <p>
          Three things became true in 2025 that weren't true in 2022. First:
          long-context language models (Claude, GPT-4o) can now hold an
          entire book in working memory and reason across it — chat,
          citation, summary, the whole package. Second: layout-preserving
          translation has crossed the quality threshold for serious reading,
          especially in European languages. Third: vector databases became
          cheap and fast enough to do real-time semantic retrieval over a
          book without thinking about it.
        </p>

        <p>
          The combination unlocks a reading experience that wasn't possible
          before. Upload the book. Read it in your language with the layout
          intact. Ask the book questions. Highlight a passage and get the AI
          to explain it. Quiz yourself on the chapter you just read. None of
          this is novel in isolation — the novelty is putting all of it in
          one place, around the actual act of reading.
        </p>

        <h2 className="!mt-12 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
          Who this is for
        </h2>

        <p>
          University students reading texts for class in a language they
          haven't mastered. Researchers reading primary sources in their
          original languages. Knowledge-worker prosumers reading the great
          European philosophers, the Japanese novelists, the Spanish-language
          essayists — in the language they were actually written. Polyglots
          who want a study tool, not a translation toy.
        </p>

        <p>
          We are deliberately not for everyone. If you only need word
          lookups, Readlang costs $5 and does that well. If you need
          browser-wide translation, Immersive Translate has 10 million users
          for a reason. If you're a casual reader who picks up a translated
          paperback once a year, the existing supply chain is fine.
        </p>

        <p>
          Translify is for when you've decided to read this specific book,
          and you want to understand it.
        </p>

        <h2 className="!mt-12 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
          What we promise
        </h2>

        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Your uploads are yours.</strong> Books you upload are
            encrypted at rest, never used to train any AI model, and
            permanently deletable at any time.
          </li>
          <li>
            <strong>No fake reviews.</strong> When we publish ratings, they
            link to a verifiable source.
          </li>
          <li>
            <strong>Cited answers, or none.</strong> When the chat or
            highlight-explain feature can't find a faithful source passage,
            it tells you instead of hallucinating one.
          </li>
          <li>
            <strong>Cancel any time, refund any time within 30 days.</strong>{" "}
            No retention forms. No "are you sure" loops. Reply to the welcome
            email, get a refund.
          </li>
        </ul>

        <hr className="!my-12 border-[color:var(--color-border)]" />

        <p className="text-[color:var(--color-ink-soft)]">
          — The Translify team.{" "}
          <Link
            href="/onboarding"
            className="font-semibold text-[color:var(--color-saffron-deep)] underline decoration-[color:var(--color-saffron)]/40 hover:decoration-[color:var(--color-saffron)]"
          >
            Try it free for 14 days →
          </Link>
        </p>
      </article>
    </main>
  );
}
