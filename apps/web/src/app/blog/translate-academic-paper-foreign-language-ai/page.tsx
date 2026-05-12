import type { Metadata } from "next";
import Link from "next/link";
import { BlogShell, H2, H3, Lead, Quote } from "../_shell";
import { findPost } from "../_posts";

const post = findPost("translate-academic-paper-foreign-language-ai")!;
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
    q: "Can AI accurately translate technical academic papers?",
    a: "For mainstream fields and major language pairs (e.g., German→English in physics, French→English in history), modern LLM translation is production-grade. Specialized terminology, citations, and equations are handled correctly. The risk areas: very niche subfields with non-standard terminology, mathematical notation embedded in prose, and humanities papers with heavy cultural reference.",
  },
  {
    q: "How do I translate equations in a foreign-language paper?",
    a: "Equations themselves are language-independent — they stay as they are. What needs translation is the prose around them ('we define X such that...', 'by substitution we obtain...'). Modern translation tools preserve LaTeX-formatted equations correctly; raster-image equations (in older scanned PDFs) need OCR with mathematical mode (Mathpix, Adobe Acrobat with math OCR) before translation.",
  },
  {
    q: "What about citations and bibliographies in a foreign-language paper?",
    a: "Citations should not be translated. Author names, journal titles, and DOIs stay in their original form. Most translation tools handle this correctly; the worst tools blindly translate everything including journal names. Verify that citations are preserved after translation, especially for footnotes.",
  },
  {
    q: "Can I cite a paper I read only in AI translation?",
    a: "Yes, with appropriate care. The standard academic practice: cite the original paper (with its original-language title), note in your text that you consulted a translation, and verify any direct quotations against the original. Many academic style guides have specific rules for this. The risk is misquotation when translation introduces error; for direct quotes, always verify the original.",
  },
  {
    q: "What's the best AI tool for academic translation specifically?",
    a: "For terminology-heavy academic prose, Claude 4.7 Opus has the strongest record. GPT-4o is close. DeepL produces fluent English but is less reliable on specialized vocabulary and longer arguments. For papers with mathematical content, any of the three works once the equations are properly extracted; the bottleneck is usually OCR quality, not translation quality.",
  },
  {
    q: "How do I skim a paper in a language I don't speak?",
    a: "The same way you skim in English: abstract, introduction, conclusion, figure captions. Translate these four sections first to decide whether the full paper is worth the time. AI handles section-by-section translation well — 30 seconds per section. For most papers, the abstract + introduction is enough to decide; for the rare paper that's directly relevant, translate the rest.",
  },
  {
    q: "What about papers in non-Latin scripts (Chinese, Japanese, Arabic, Russian)?",
    a: "Modern LLM translation handles non-Latin academic prose well in 2026. Chinese and Japanese scientific papers translate at near-publication quality. Arabic and Russian academic translation is solid but the script switch makes verification slower — you need a font that displays the original correctly alongside the English. Most academic PDF readers handle this; some web-based tools don't.",
  },
];

export default function Page() {
  return (
    <BlogShell post={post} faqs={faqs}>
      <Lead>
        Academic papers are shorter than books, denser than journalism, and
        full of terminology that general-purpose translators get wrong. The
        translation problem is also more pointed: you usually need to extract
        a specific argument or result, not enjoy the prose. This is a
        reference guide to reading academic papers in a foreign language with
        AI assistance — covering terminology preservation, equation handling,
        citation integrity, and how to skim a paper in a language you can't
        read at pace.
      </Lead>

      <H2>What makes academic translation different</H2>

      <p>
        Three properties separate academic translation from general translation:
      </p>

      <H3>Terminology must be exact</H3>

      <p>
        In a novel, &ldquo;feeling&rdquo; and &ldquo;sensation&rdquo; are
        interchangeable. In a phenomenology paper, they're not — they may
        refer to different things in the author's framework. Academic
        translation requires that the same source term maps to the same
        target term throughout the paper, even when context might naturally
        suggest different English words.
      </p>

      <p>
        DeepL is the weakest of the major engines on this dimension. It
        translates well at the sentence level but loses cross-sentence
        consistency. LLM-based translation (Claude, GPT-4o) handles
        terminology consistency substantially better, especially when prompted
        to maintain a glossary across the document.
      </p>

      <H3>Citations are sacred</H3>

      <p>
        In-text citations, footnote references, and bibliography entries
        should never be translated. Author names stay as they are. Journal
        titles stay in their original language. A French paper citing a
        German source should produce an English translation that preserves
        the German citation exactly.
      </p>

      <p>
        Most translation tools handle this correctly; some don't. Always spot-
        check citation preservation after translation.
      </p>

      <H3>Equations and figures are language-independent</H3>

      <p>
        Mathematical notation, chemical structures, and graphical figures are
        already in a universal scientific language. They don't need
        translation; they need to survive the translation process intact.
        What does need translation is the prose surrounding them — the
        captions, the variable definitions, the verbal descriptions of what
        the equation does.
      </p>

      <H2>The skim workflow</H2>

      <p>
        Most academic reading is skimming, not deep reading. You're trying
        to decide whether a paper is worth full attention. For foreign-language
        papers, the skim workflow:
      </p>

      <ul className="!my-4 list-disc space-y-2 pl-6">
        <li>
          <strong>Translate the abstract</strong>. 30 seconds. Decide whether
          the paper looks relevant.
        </li>
        <li>
          <strong>Translate the introduction</strong>. 60-90 seconds. Identify
          the specific contribution.
        </li>
        <li>
          <strong>Translate the conclusion</strong>. 30 seconds. Confirm the
          actual result.
        </li>
        <li>
          <strong>Scan figure captions</strong>. The figures tell you what
          the paper actually did.
        </li>
      </ul>

      <p>
        After these four steps, you'll know whether the rest of the paper
        is worth translating. For 90% of papers you find via citation chase
        or keyword search, the answer is no.
      </p>

      <H2>The deep-read workflow</H2>

      <p>
        For the 10% that are worth it:
      </p>

      <p>
        Translate the full paper section by section, keeping the original
        accessible. Translify, Immersive Translate, and most browser-based
        academic readers handle this well. The original PDF remains; the
        translation appears alongside or on toggle.
      </p>

      <p>
        Read the English translation at your normal academic pace. Mark
        passages where you need to verify against the original — usually:
      </p>

      <ul className="!my-4 list-disc space-y-2 pl-6">
        <li>
          Direct quotes you might cite. Always verify the original wording.
        </li>
        <li>
          Technical claims that depend on a specific term. Check whether
          the English term is the standard rendering in your field.
        </li>
        <li>
          Footnotes that the translator may have flattened. Long discursive
          footnotes (especially in humanities papers) sometimes get
          truncated.
        </li>
      </ul>

      <p>
        For each mark, ask: what does the original literally say here? AI
        provides the word-by-word; you decide if the English captured it.
      </p>

      <H2>Specific issues by field</H2>

      <H3>STEM (physics, math, CS, chemistry)</H3>

      <p>
        Translation is usually high-quality because the prose is structured
        and terminology is standardized. Main risk: mathematical notation
        embedded as raster images in older scanned PDFs. Run a math-OCR
        pass first (Mathpix, Adobe Acrobat with math mode) before
        translation. Once the equations are text, modern translation handles
        the surrounding prose correctly.
      </p>

      <H3>Life sciences (biology, medicine)</H3>

      <p>
        Strong translation quality for English-target. Latin binomial names
        (species names) should not be translated; verify these are
        preserved. Chemical names occasionally get over-translated — IUPAC
        names should be standardized across languages, but the LLM
        translators occasionally rephrase them. Spot-check.
      </p>

      <H3>Humanities (history, philosophy, literature)</H3>

      <p>
        The hardest case. Humanities papers carry the most cultural
        reference, the most untranslatable terminology, and the most prose
        register that depends on the original language. AI translation
        works but with more cross-verification needed than for STEM.
      </p>

      <p>
        For history papers especially, keep an eye on proper nouns. Names
        of places, institutions, and historical figures sometimes get
        translated when they shouldn't (the German city &ldquo;Hannover&rdquo;
        sometimes becomes &ldquo;Hanover&rdquo; — fine in casual prose, but
        academic citation requires the original).
      </p>

      <H3>Social sciences (economics, sociology, political science)</H3>

      <p>
        Reliable translation quality. Field-specific terminology is
        standardized enough that LLM translation handles it well. Statistical
        terminology is universal.
      </p>

      <H2>Citation practices</H2>

      <p>
        If you cite a paper you read only in AI translation, document that
        appropriately. Most style guides require:
      </p>

      <ul className="!my-4 list-disc space-y-2 pl-6">
        <li>
          Cite the original paper with its original-language title.
        </li>
        <li>
          If you quote directly, verify the original-language quotation and
          provide it (in parentheses or footnote) alongside the English.
        </li>
        <li>
          If the translation matters (e.g., a translation in a humanities
          paper), note that you consulted an AI translation and that
          significant quotations were verified.
        </li>
      </ul>

      <p>
        For unpublished or in-progress citation, AI translation is generally
        fine. For published work, particularly for direct quotes,
        verification against the original is necessary. The error rate of
        modern AI translation is low but nonzero, and academic publication
        standards require quotation accuracy.
      </p>

      <H2>Tools</H2>

      <p>
        <strong>For most academic translation</strong>: an LLM-based tool
        with PDF support. Translify, Immersive Translate, and the major
        academic readers (Sumatra, PDF Expert with extensions) handle this
        well. Cost is typically $10-$25/month for academic-volume use.
      </p>

      <p>
        <strong>For scanned PDFs (older papers, archival material)</strong>:
        run OCR first with a tool that handles mathematical content if the
        paper has equations. Adobe Acrobat or ABBYY FineReader. Then
        translate the OCR'd output.
      </p>

      <p>
        <strong>For sensitive material (unpublished, embargoed)</strong>:
        check the translation tool's data policy. Major LLM providers
        (Anthropic, OpenAI) do not train on API data by default in 2026,
        but the consumer-facing chat interfaces may. For confidential
        academic content, use an API-based tool with appropriate
        confidentiality settings.
      </p>

      <Quote>
        Translify handles academic PDF translation with citation
        preservation, equation handling, and per-section translation. Try
        it free for 14 days at{" "}
        <Link href="/onboarding" className="underline decoration-[color:var(--color-saffron)] not-italic">
          translify.app/onboarding
        </Link>
        .
      </Quote>
    </BlogShell>
  );
}
