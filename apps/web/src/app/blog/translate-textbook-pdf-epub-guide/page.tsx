import type { Metadata } from "next";
import Link from "next/link";
import { BlogShell, H2, H3, Lead, Quote } from "../_shell";
import { findPost } from "../_posts";

const post = findPost("translate-textbook-pdf-epub-guide")!;
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
    q: "Can I legally translate a textbook for my personal study?",
    a: "Personal-use translation of legally-acquired textbooks falls under fair use in most jurisdictions (US, EU, UK). You can translate a textbook you own to read it in your native language. You cannot distribute, sell, or share the translation — that requires the publisher's permission. Check your local copyright law for specifics.",
  },
  {
    q: "What's the best AI tool for translating a textbook PDF?",
    a: "For pure translation: DeepL Pro for European languages, Google Translate for everything else. For translation + reading + study: Translify (preserves layout, lets you chat with the textbook, supports highlights and quizzes). For very large textbooks (1,000+ pages), BookTranslate.ai's multi-pass mode is worth considering.",
  },
  {
    q: "How long does it take to translate a 500-page textbook?",
    a: "AI translation: 5–30 minutes depending on the tool, layout complexity, and language pair. Human-quality translation (translator + post-editor): 4–8 weeks at $0.10–$0.20 per word, so $5,000–$10,000 for a 50,000-word textbook. AI is 99%+ cheaper and 99%+ faster; the trade-off is occasional unfortunate phrasing in technical sections.",
  },
  {
    q: "Will the translated textbook keep its equations, figures, and footnotes?",
    a: "Yes, with the right tool. Translify, Immersive Translate, and BookTranslate.ai preserve images (including equation images), keep footnote references attached to the right paragraphs, and maintain the original page layout. Plain document translators (older versions of Google Translate, basic OCR-then-translate tools) typically lose this.",
  },
  {
    q: "Can AI translate technical jargon in a STEM textbook correctly?",
    a: "Mostly yes. Modern LLM-based translation (Claude, GPT-4o, DeepL) handles standard scientific terminology reliably. Domain-specific jargon — niche subfields, recent terminology — sometimes mistranslates. The fix: read with the original PDF accessible alongside, and use highlight-and-ask to verify terms you're not sure about.",
  },
  {
    q: "What about images of text inside the PDF (scanned books)?",
    a: "Scanned PDFs need OCR before translation. Most modern tools (including Translify) run OCR automatically. Quality depends on scan resolution — 300 DPI or higher is reliable; lower-quality scans (under 200 DPI) produce more OCR errors that propagate into the translation.",
  },
  {
    q: "Can I quiz myself on a translated textbook?",
    a: "Yes, if your tool supports it. Translify generates AI-driven quizzes from chapters you've actually read, with citations back to the page where each answer appears. For most other tools you'll need to make flashcards manually or use a separate spaced-repetition app like Anki.",
  },
];

export default function Page() {
  return (
    <BlogShell post={post} faqs={faqs}>
      <Lead>
        Translating a textbook is not translating a paragraph eight thousand
        times. Layout matters. Footnotes matter. Equations, figures, glossary
        cross-references, index entries — all of it carries meaning. Doing
        this with the wrong tool produces a translation that's technically
        complete and practically useless.
      </Lead>

      <p>
        Here's the step-by-step guide for translating a textbook into your
        native language so you can actually study from it. Works for PDFs and
        EPUBs. Works across most languages.
      </p>

      <H2>Step 1 — Get a clean source file</H2>

      <p>
        Translation quality depends entirely on source quality. Garbage in,
        garbage out. Specifically:
      </p>

      <ul className="list-disc space-y-2 pl-6">
        <li>
          <strong>EPUB is better than PDF</strong> when you have the choice.
          EPUB stores text as text, with structural metadata (chapter,
          section, footnote). Translation tools can work with this directly.
        </li>
        <li>
          <strong>PDF with embedded text is fine</strong> — most modern
          textbook PDFs (anything published in the last 10 years) embed the
          text. Translation tools extract it cleanly.
        </li>
        <li>
          <strong>Scanned PDFs need OCR first.</strong> If your PDF is
          essentially a photograph of pages, you need an OCR pass before
          translation. Tools like Translify do this automatically; standalone
          OCR via Adobe Acrobat, ABBYY FineReader, or Tesseract work too.
          Aim for 300 DPI minimum source resolution.
        </li>
      </ul>

      <p>
        Check whether your PDF has embedded text: open it in any PDF viewer,
        try to select a sentence with your cursor. If you can highlight it
        as text, embedded text is there. If your cursor draws a box but no
        text is highlighted, it's a scan — OCR it before translating.
      </p>

      <H2>Step 2 — Pick a tool that preserves layout</H2>

      <p>
        For textbooks specifically, layout-preserving tools are the only
        viable option. The tools worth considering:
      </p>

      <H3>Translify (recommended for study)</H3>

      <p>
        Translation + a full reading experience: chat with the textbook,
        highlight-to-ask, quiz mode. Best for actually <em>studying</em> from
        the translated book, not just reading it through. Free 14-day trial.
        See the{" "}
        <Link href="/languages" className="underline decoration-[color:var(--color-saffron)]">
          full language pair list
        </Link>
        .
      </p>

      <H3>DeepL Pro (recommended for pure translation)</H3>

      <p>
        Highest raw translation quality for European languages. Document
        translation preserves formatting. Gives you a translated file — you
        do the studying elsewhere. $8.74/mo for unlimited.
      </p>

      <H3>BookTranslate.ai (recommended for very long books)</H3>

      <p>
        Multi-pass translation: a first pass for accuracy, a second pass for
        consistency across chapters. Worth the slower speed for books over
        500 pages where terminology drift is a real problem. $0.005–0.01 per
        page.
      </p>

      <H3>Immersive Translate (recommended for everyday + books)</H3>

      <p>
        Bilingual side-by-side display. Browser-based. $9.99/mo. If you also
        translate web pages and videos, this is the convenient single-tool
        option.
      </p>

      <p>
        Avoid for textbooks: Google Translate's free document tier (reflows
        text and loses layout), older OCR-based translators (often mangle
        equations), tools that don't explicitly preserve footnotes and
        figures.
      </p>

      <H2>Step 3 — Configure the translation</H2>

      <p>
        Before you click translate, take 60 seconds to set up correctly.
      </p>

      <H3>Choose target language carefully</H3>

      <p>
        Pick the language you read most fluently — not necessarily your
        native language. If you grew up in Brazil but studied in the US and
        now read English faster than Portuguese, translate to English. The
        goal is comprehension speed, not nostalgia.
      </p>

      <H3>Pick the right translation engine for the language pair</H3>

      <p>
        Quality varies significantly by source-target combination:
      </p>

      <ul className="list-disc space-y-2 pl-6">
        <li><strong>European pairs (EN ↔ DE/FR/ES/IT/PT/NL):</strong> DeepL is best, Claude is close.</li>
        <li><strong>CJK (Chinese/Japanese/Korean) ↔ EN:</strong> Claude or GPT-4o; DeepL handles JA but is weaker for ZH and KO.</li>
        <li><strong>Arabic ↔ EN:</strong> Claude and GPT-4o; Google's NMT is decent. DeepL doesn't support Arabic.</li>
        <li><strong>Less common pairs (Indonesian, Malay, Vietnamese, Turkish to EN):</strong> Claude and Google are reliable. DeepL coverage varies.</li>
      </ul>

      <p>
        Translify automatically picks the best engine per pair, but if you're
        using a tool with engine choice, pick consciously.
      </p>

      <H3>Set glossary terms if your tool supports it</H3>

      <p>
        Textbooks are full of terms-of-art the translator must render
        consistently. DeepL Pro lets you upload a glossary. Translify lets
        you set author-specific term preferences. If you're translating a
        linear algebra textbook, telling the tool that "Eigenwert" should
        always be "eigenvalue" (not "characteristic value" or "proper
        value") prevents 200 inconsistencies.
      </p>

      <H2>Step 4 — Translate and verify</H2>

      <p>
        Upload, wait 5–30 minutes depending on tool and book length, get the
        translated file. Before you commit to studying from it, verify three
        things:
      </p>

      <ol className="list-decimal space-y-3 pl-6">
        <li>
          <strong>Spot-check three random pages.</strong> Pick page 1, the
          middle, and a page near the end. Read them side-by-side with the
          source. If the translation reads naturally and the technical terms
          are correct, you're fine.
        </li>
        <li>
          <strong>Check one equation-dense page.</strong> Equations should be
          identical to the source (they're typically not translated — they're
          preserved as images or LaTeX). Surrounding explanation text should
          read naturally.
        </li>
        <li>
          <strong>Check one footnote page.</strong> Footnote markers should
          line up with the same paragraphs as the original. The footnote text
          itself should be translated.
        </li>
      </ol>

      <p>
        If any of these fail, re-translate with a different tool or engine
        rather than studying from a flawed version.
      </p>

      <H2>Step 5 — Study from the translated textbook</H2>

      <p>
        This is where the right tool pays for itself. Translation alone gets
        you a readable book. Studying from it requires more.
      </p>

      <H3>Read with the original alongside</H3>

      <p>
        For technical material, keep the source language version accessible.
        Translify lets you toggle between source and translation on any page;
        with other tools you'll need to keep two windows open. When you hit a
        concept that feels off, check the original.
      </p>

      <H3>Highlight and explain dense passages</H3>

      <p>
        Textbook authors write densely on purpose — they're trying to
        compress decades of thought into one paragraph. With an AI tool that
        supports highlight-to-ask (Translify, NotebookLM), select dense
        passages and ask "explain this in plain language using the
        surrounding context." This is the move that makes hard textbooks
        readable.
      </p>

      <H3>Generate chapter quizzes</H3>

      <p>
        After each chapter, generate a quiz. 5–10 multiple-choice questions
        with citations to where each answer appears. This is more useful than
        re-reading: re-reading feels like learning; quizzing reveals what you
        actually retained.
      </p>

      <H3>Build a personal glossary</H3>

      <p>
        Track the terms-of-art that appeared with their definitions and
        canonical translations. By the end of the textbook you'll have your
        own bilingual glossary of the field's vocabulary, which is worth more
        than any single chapter.
      </p>

      <H2>Common problems and fixes</H2>

      <H3>"The translation reflowed all my pages"</H3>

      <p>
        You used a tool that doesn't preserve layout. Re-translate with a
        layout-preserving tool. For textbooks, this is non-negotiable.
      </p>

      <H3>"Footnotes ended up in the wrong place"</H3>

      <p>
        Almost always an OCR-quality issue with scanned PDFs. Re-OCR at
        higher quality (300+ DPI), or find an EPUB version of the book.
      </p>

      <H3>"Technical terms are translated inconsistently"</H3>

      <p>
        Translation tools without context windows large enough to see
        terminology consistency. Use a tool with multi-pass translation
        (BookTranslate.ai), or a glossary-supporting tool (DeepL Pro,
        Translify).
      </p>

      <H3>"Equations got translated as text and now they're broken"</H3>

      <p>
        A bad tool tried to OCR an equation image. Either the source PDF had
        equations as raster images (use a different source file) or the tool
        is mis-detecting equations as text (use a better tool).
      </p>

      <H3>"The translation is good but reads stiffly"</H3>

      <p>
        Machine translation is famous for grammatically correct but
        unnatural prose. For dense technical content this is usually fine —
        you're reading for information, not style. For narrative passages it
        matters more. If you need natural prose, use Claude or GPT-4o as the
        engine; if you need raw accuracy, use DeepL.
      </p>

      <H2>The minimum viable workflow, in 5 lines</H2>

      <ol className="list-decimal space-y-2 pl-6">
        <li>Get a clean PDF or EPUB. OCR scanned books before translating.</li>
        <li>Upload to a layout-preserving tool. (Translify, BookTranslate.ai, DeepL Pro Document.)</li>
        <li>Spot-check three random pages before committing.</li>
        <li>Read with the original within reach for the moments that matter.</li>
        <li>Quiz yourself after each chapter. (Or use Anki / SRS if your tool doesn't generate quizzes.)</li>
      </ol>

      <Quote>
        Try this with{" "}
        <Link href="/onboarding" className="underline decoration-[color:var(--color-saffron)] not-italic">
          Translify
        </Link>{" "}
        — upload your first textbook free for 14 days, see if the workflow
        clicks for you. 30-day money-back on every paid plan.
      </Quote>
    </BlogShell>
  );
}
