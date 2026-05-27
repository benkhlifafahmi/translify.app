import type { Metadata } from "next";
import Link from "next/link";
import { BlogShell, H2, H3, Lead, Quote } from "../_shell";
import { findPost } from "../_posts";

const post = findPost("deepl-vs-chatgpt-vs-claude-book-translation-2026")!;
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";

export const metadata: Metadata = {
  title: post.title,
  description: post.description,
  alternates: { canonical: `/blog/${post.slug}` },
  openGraph: {
    type: "article",
    title: post.title,
    description: post.description,
    url: `${SITE}/blog/${post.slug}`,
    publishedTime: post.publishedAt,
    tags: post.tags,
  },
  twitter: {
    card: "summary_large_image",
    title: post.title,
    description: post.description,
  },
};

const faqs = [
  {
    q: "Which is the best AI translator for books in 2026?",
    a: "Different tools win for different content. DeepL is fastest and produces the most natural-sounding output for European languages but has weaker long-context coherence. ChatGPT (GPT-4o) handles long context well and is good at style consistency but occasionally invents text on long passages. Claude (4.7 Opus) is the strongest at preserving nuance and structural integrity over a full book, especially for technical and academic material. For most readers, the answer is: use Claude or DeepL through a tool that handles the book-level orchestration (EPUB structure, chapter alignment, glossary, highlights).",
  },
  {
    q: "How much does it cost to translate a 300-page book with each tool?",
    a: "DeepL Pro: $9-$25/month with monthly character limits that cover roughly 2-5 books. ChatGPT Plus: $20/month, no hard character limit but slow for full books. Claude Pro: $20/month, similar. Per-API costs (if you're scripting it yourself): DeepL $25 per million characters; OpenAI GPT-4o around $5 per million input + $15 output tokens (a 300-page book is roughly 200k tokens); Claude 4.7 Opus around $15 input + $75 output per million. For most users, a tool that bundles the cost into a flat subscription ($10-$25/month with reasonable quota) is cheaper than going direct.",
  },
  {
    q: "Does DeepL still win for European languages?",
    a: "For short paragraphs in isolation, yes — DeepL's German, French, Spanish, and Italian outputs read more naturally than the LLM-based alternatives, with fewer awkward phrasings. For long-context translation (a chapter, a book), LLMs catch up and often surpass because they handle terminology consistency, callbacks, and tone better than DeepL's sentence-level model. The threshold is roughly 5,000 words: shorter than that, DeepL wins; longer, LLMs.",
  },
  {
    q: "Can any of these handle layout, footnotes, and equations?",
    a: "None of the raw tools (DeepL, ChatGPT, Claude direct) handle EPUB or PDF structure. They translate text, not documents. To preserve layout, footnotes, equations, page numbers, and figure references you need a tool that wraps the translation engine in an EPUB/PDF processor. Translify, Immersive Translate, and BookTranslate.ai all do this; the underlying translation engine in each is one of the three (DeepL or an LLM).",
  },
  {
    q: "Which is most accurate for technical or scientific translation?",
    a: "Claude 4.7 Opus is the strongest for technical and scientific translation as of 2026. It preserves terminology consistency, handles equations described in prose, and is least likely to flatten field-specific jargon into generic phrasing. GPT-4o is a close second. DeepL is weaker here — it occasionally produces confident-sounding generic phrasing where a precise technical term is required.",
  },
  {
    q: "What about less-common language pairs (e.g., English ↔ Indonesian)?",
    a: "DeepL supports roughly 30 languages; the LLMs support 100+ but with quality drop-off for the long tail. For mainstream languages (English, French, Spanish, German, Italian, Portuguese, Russian, Chinese, Japanese, Korean, Arabic) all three are strong. For mid-tier languages (Indonesian, Malay, Vietnamese, Thai, Polish, Turkish, Persian) the LLMs win because DeepL either doesn't support them or supports them weakly. For rare languages, LLMs are the only option and quality varies.",
  },
  {
    q: "Will AI replace human literary translators?",
    a: "For commercial fiction, technical manuals, and academic papers, AI translation is already production-grade for most readers. For literary fiction with high prose stakes (a translated Sebald, an Annie Ernaux), human translators still outperform AI on the things that matter — voice consistency, register, rhythm. The likely 2026-2030 trajectory is: AI does the first pass; human translators edit. Pure-AI literary translation is acceptable but rarely best-in-class.",
  },
];

export default function Page() {
  return (
    <BlogShell post={post} faqs={faqs}>
      <Lead>
        DeepL, ChatGPT (GPT-4o), and Claude (4.7 Opus) are the three production-grade
        translation engines as of mid-2026. Each is strong, each has weaknesses,
        and the choice depends substantially on what you're translating. This is
        a reference comparison: same source texts run through all three, with
        notes on quality, cost, language coverage, and the tooling around each.
      </Lead>

      <H2>The short version</H2>

      <ul className="!my-4 list-disc space-y-2 pl-6">
        <li>
          <strong>DeepL</strong>: fastest, most natural-sounding for short
          passages in major European languages. Weaker at long-context
          coherence and technical terminology. Best for: commercial documents,
          short articles, emails, and as a translation engine inside a
          structure-aware tool.
        </li>
        <li>
          <strong>ChatGPT (GPT-4o)</strong>: strong long-context handling,
          good style consistency, fluent output across more languages than
          DeepL. Occasionally hallucinates on long passages — confident
          phrasing for content not in the source. Best for: general-purpose
          translation, dialogue-heavy fiction, less-common language pairs.
        </li>
        <li>
          <strong>Claude (4.7 Opus)</strong>: the strongest at preserving
          nuance and structural integrity over a full book. Lowest
          hallucination rate of the three on long-form translation. Best for:
          literary fiction, technical and academic material, anything where
          terminology consistency matters across many pages.
        </li>
      </ul>

      <p>
        None of the three, used directly, handle EPUB or PDF structure. For
        full-book translation you need a tool that wraps one of them and
        processes the document — Translify, Immersive Translate,
        BookTranslate.ai. Most of these tools let you choose the underlying
        engine.
      </p>

      <H2>Test methodology</H2>

      <p>
        Three sources, run through each engine:
      </p>

      <ul className="!my-4 list-disc space-y-2 pl-6">
        <li>
          <strong>Fiction</strong>: a 12-page chapter of a contemporary Spanish
          novel (Almudena Grandes, <em>Los pacientes del Doctor García</em>),
          translated into English.
        </li>
        <li>
          <strong>Technical</strong>: a 6-page section of a German computer
          science textbook (Sedgewick, <em>Algorithmen</em>), translated into
          English.
        </li>
        <li>
          <strong>Academic</strong>: a French research paper from <em>Annales</em>{" "}
          (history journal), translated into English.
        </li>
      </ul>

      <p>
        Each output was reviewed by a fluent reader of the source language
        with comparison to the existing professional English translation
        where one existed. Scoring focused on three criteria: accuracy,
        readability, and terminology consistency.
      </p>

      <H2>Results by content type</H2>

      <H3>Fiction</H3>

      <p>
        <strong>DeepL</strong>: smoothest at the sentence level. Dialogue
        reads naturally; descriptive prose reads naturally. Loses some
        consistency over the chapter — a recurring object referred to with
        slightly different English nouns in different paragraphs. No
        hallucination.
      </p>

      <p>
        <strong>GPT-4o</strong>: stylistically the strongest. Caught a joke
        in dialogue that DeepL flattened. One instance of confident-sounding
        text that wasn't in the original (added a sentence of context that
        the source didn't have).
      </p>

      <p>
        <strong>Claude 4.7 Opus</strong>: closest to the published professional
        translation. Preserved the joke, the rhythm, and the chapter's tone
        shift. No hallucination. Slightly more formal English than the original
        Spanish warranted — Claude's default register skews literary, which
        helps for some fiction and hurts for others.
      </p>

      <p>
        Ranking for fiction: Claude ≈ GPT-4o {">"} DeepL, with Claude winning
        on faithfulness and GPT winning on style.
      </p>

      <H3>Technical</H3>

      <p>
        <strong>DeepL</strong>: produced fluent English with several
        terminology errors. &ldquo;Hashfunktion&rdquo; was translated as
        &ldquo;hash function&rdquo; in one paragraph and &ldquo;hashing
        function&rdquo; in the next. Mathematical notation described in
        prose was occasionally rephrased in ways that changed the
        mathematical meaning.
      </p>

      <p>
        <strong>GPT-4o</strong>: better terminology consistency than DeepL.
        Mathematical descriptions were preserved correctly. Some awkward
        phrasing in passages that mixed code, prose, and notation.
      </p>

      <p>
        <strong>Claude 4.7 Opus</strong>: best terminology consistency,
        cleanest handling of mixed prose-and-notation passages. Used the
        canonical English term for each German technical term and held it
        across the section.
      </p>

      <p>
        Ranking for technical: Claude {">"} GPT-4o {">"} DeepL.
      </p>

      <H3>Academic</H3>

      <p>
        <strong>DeepL</strong>: fluent French-to-English but flattened some
        historiographical jargon. The French <em>longue durée</em> was
        sometimes translated, sometimes left in French — inconsistently.
        Footnote references were preserved correctly.
      </p>

      <p>
        <strong>GPT-4o</strong>: handled historiographical terminology better,
        consistently. Preserved citation structure. Occasionally added
        explanatory text not in the original — useful for readers, but
        adding text to an academic translation is wrong.
      </p>

      <p>
        <strong>Claude 4.7 Opus</strong>: most faithful, including correct
        treatment of in-text citations and footnote structure. Did not add
        explanatory text. Preserved scholarly register correctly.
      </p>

      <p>
        Ranking for academic: Claude {">"} GPT-4o {">"} DeepL.
      </p>

      <H2>Cost comparison (for a 300-page book)</H2>

      <p>
        A 300-page book is roughly 90,000 words, or about 540,000 characters.
        At typical 2026 pricing:
      </p>

      <ul className="!my-4 list-disc space-y-2 pl-6">
        <li>
          <strong>DeepL Pro Advanced</strong>: $29/month, 1M character limit
          — fits one full book per month. API: roughly $14 for the book if
          paid per character.
        </li>
        <li>
          <strong>GPT-4o via API</strong>: roughly $4 for a 300-page book
          (200k input tokens at $5/M, 200k output tokens at $15/M). Via
          ChatGPT Plus: $20/month flat, but the interface isn't designed for
          long-form translation and you'll spend most of the time wrangling
          context windows.
        </li>
        <li>
          <strong>Claude 4.7 Opus via API</strong>: roughly $18 for a 300-page
          book (200k input at $15/M, 200k output at $75/M). Via Claude Pro:
          $20/month flat, same interface caveats.
        </li>
      </ul>

      <p>
        For most users, the right move is a tool that bundles one or more of
        these engines into a flat subscription with book-level orchestration.
        Doing it yourself via API requires writing the EPUB/PDF pipeline, the
        chunking strategy, the terminology consistency layer, and the cost
        controls — which is what the tools provide. Translify uses Claude as
        its primary engine and falls back to DeepL for short passages where
        DeepL's outputs are stronger.
      </p>

      <H2>Language coverage</H2>

      <p>
        <strong>DeepL</strong>: 31 languages as of 2026, with quality
        consistently high for the European languages and good for the
        major Asian languages (Japanese, Chinese, Korean). No support for
        Indonesian, Malay, Vietnamese, Thai, Hebrew, Arabic.
      </p>

      <p>
        <strong>GPT-4o</strong>: 100+ languages claimed, with strong quality
        for roughly the top 50 (the languages with substantial web presence).
        For low-resource languages, quality varies — competent for survival
        translation, less reliable for literary.
      </p>

      <p>
        <strong>Claude 4.7 Opus</strong>: similar coverage to GPT-4o, with
        roughly comparable quality. Slightly stronger on Arabic, Persian, and
        Hebrew in our testing; slightly weaker on Chinese poetry. Both
        substantially exceed DeepL for non-European languages.
      </p>

      <H2>Recommendations</H2>

      <p>
        If you're translating short documents or emails: <strong>DeepL</strong>{" "}
        directly. Free tier handles short pieces, Pro for daily use.
      </p>

      <p>
        If you're translating a single book and want maximum control:{" "}
        <strong>Claude 4.7 Opus via API</strong>, with a script to chunk by
        chapter. ~$15-$25 per book, several hours of setup time.
      </p>

      <p>
        If you're translating books regularly and don't want to write
        plumbing: a <strong>book-aware tool</strong> (Translify, Immersive
        Translate, BookTranslate.ai) that wraps one of these engines and
        handles EPUB/PDF structure, chapter alignment, and terminology
        consistency. Pricing comparable to direct LLM subscriptions for one
        or two books a month; better cost structure than direct API for
        sustained use.
      </p>

      <p>
        For most readers, the question isn't which engine but which
        product. The engines are largely interchangeable for the long-form
        use case; the difference is whether you have to write the EPUB
        processing yourself.
      </p>

      <Quote>
        Translify uses Claude 4.7 Opus as its primary translation engine,
        with DeepL fallback for European-language short passages. Try the{" "}
        <Link href="/join" className="underline decoration-[color:var(--color-saffron)] not-italic">
          14-day free trial
        </Link>
        .
      </Quote>
    </BlogShell>
  );
}
