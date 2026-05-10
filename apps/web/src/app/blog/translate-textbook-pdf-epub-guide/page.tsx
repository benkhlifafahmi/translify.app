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
        Translating a textbook is not translating one paragraph eight thousand
        times. Layout matters. Footnotes matter. Equations, figures, glossary
        cross-references, the way the author refers back to a definition
        from chapter two — all of it carries meaning. Get the wrong tool
        and you end up with a translation that's technically complete and
        practically useless. I've watched friends abandon their study
        plans because of this. Here's how to avoid it.
      </Lead>

      <H2>Start with a clean source file</H2>

      <p>
        Translation quality starts at the source. Garbage in, garbage out
        applies harder here than in most places because errors at the OCR
        layer propagate into the translation, and then into your reading,
        and you'll never know whether the weird phrasing was the author or
        the pipeline.
      </p>

      <p>
        EPUB is better than PDF when you have the choice. EPUB stores text
        as actual text, with structural metadata for chapters, sections,
        and footnotes that translation tools can work with directly.
        Modern textbook PDFs (anything published in the last ten years or
        so) embed their text and extract cleanly too. The trouble starts
        with scanned PDFs — books that are essentially photographs of pages
        rather than searchable documents. Those need an OCR pass before
        translation, and the OCR quality determines everything downstream.
      </p>

      <p>
        Quick test: open your PDF and try to select a sentence with your
        cursor. If you can highlight it as text, you're fine. If your cursor
        draws a selection box but no text gets highlighted, it's a scan —
        OCR it first. Most modern tools (Translify included) do this
        automatically; if you're doing it yourself, Adobe Acrobat, ABBYY
        FineReader, and Tesseract all work, and 300 DPI is the minimum
        scan resolution worth bothering with.
      </p>

      <H2>Pick a tool that actually preserves layout</H2>

      <p>
        For a textbook specifically — not a novel, not an essay collection,
        a textbook with figures and equations and footnotes — layout
        preservation isn't a nice-to-have. It's the only thing that
        matters between &ldquo;I can study from this&rdquo; and &ldquo;I
        give up after three chapters.&rdquo;
      </p>

      <p>
        The shortlist is small. <strong>Translify</strong> if you want the
        translation plus the reading experience around it — chat with the
        book, highlight-to-ask, quiz mode. <strong>DeepL Pro</strong> if
        you want the highest raw translation quality for European
        languages and you'll do your reading and studying elsewhere — its
        Document Translator preserves formatting cleanly and the European
        pairs are best-in-class. <strong>BookTranslate.ai</strong> is
        worth a look for books over 500 pages where terminology drift
        between chapters becomes a real problem; their multi-pass mode is
        slower but more consistent. <strong>Immersive Translate</strong>
        if you also translate web pages and videos and you want one tool
        that does all of it.
      </p>

      <p>
        What to avoid: Google Translate's free document tier (reflows
        everything, loses your layout), older OCR-and-translate
        combos (they routinely mangle equations into nonsense by trying
        to OCR them as text), and anything that doesn't explicitly
        promise to preserve footnotes and figures. You'll waste an evening
        finding out the hard way.
      </p>

      <H2>Take a minute on the settings</H2>

      <p>
        Before you click translate, two things to think about.
      </p>

      <p>
        First, your target language. Pick the one you read most fluently,
        which isn't necessarily your native language. If you grew up in
        Brazil but studied at MIT and now read English faster than
        Portuguese, translate to English. The point is comprehension
        speed, not nostalgia. I've seen people insist on translating to
        their native language out of principle and then read slower than
        if they'd stuck with the original — which defeats the purpose.
      </p>

      <p>
        Second, the translation engine matters more than people assume,
        and it varies a lot by language pair. For European pairs (EN to
        or from DE, FR, ES, IT, PT, NL), DeepL is the best in class and
        Claude is close. For Chinese, Japanese, Korean to English, Claude
        or GPT-4o win; DeepL handles Japanese decently but is weaker on
        Chinese and Korean. Arabic to or from English is Claude or
        GPT-4o territory — DeepL doesn't support Arabic at all. For
        less-common pairs like Indonesian, Malay, Vietnamese, or
        Turkish, Claude and Google are both reliable. Translify picks
        automatically based on the pair; if your tool gives you the
        choice, choose deliberately.
      </p>

      <p>
        One more setting worth knowing about if your tool supports it:
        glossaries. Textbooks are full of terms-of-art that the translator
        must render consistently across hundreds of pages. DeepL Pro lets
        you upload a glossary. Translify lets you pin term preferences.
        For a linear algebra textbook, telling the tool that{" "}
        <em>Eigenwert</em> should always be &ldquo;eigenvalue&rdquo; (and
        not &ldquo;characteristic value&rdquo; or &ldquo;proper value,&rdquo;
        both of which are technically correct and entirely confusing if
        used inconsistently) saves you 200 small papercuts.
      </p>

      <H2>Translate, then verify before you commit</H2>

      <p>
        Upload. Wait. Five to thirty minutes depending on length and tool.
        Get the translated file. Now — before you spend the next month
        studying from it — do three spot checks.
      </p>

      <p>
        Pick a random page near the beginning, one in the middle, and one
        toward the end. Read them side-by-side with the source. If the
        translations read naturally and the technical terms are correct,
        you're done. Then pick an equation-dense page; equations
        themselves should be identical to the source (they're images or
        LaTeX, not translated), but the surrounding explanation text
        should read like a real sentence. Then check a footnote page —
        footnote markers should line up with the same paragraphs as the
        original, and the footnote text itself should actually be in your
        target language. (Sometimes tools translate the body and forget
        the footnotes. Worth catching now.)
      </p>

      <p>
        If any of those checks fail, don't try to power through. Re-translate
        with a different tool or engine. The two hours it costs to redo
        the translation is much cheaper than the forty hours of confusion
        you'd get reading a bad one.
      </p>

      <H2>Studying from it</H2>

      <p>
        Translation gets you a readable book. Studying from it requires
        more, and this is where the right tool actually earns its place.
      </p>

      <p>
        Keep the source language version accessible. Translify lets you
        toggle on any page; with other tools you'll need a second window
        open. You won't reach for it often — but when you hit a concept
        that feels wrong, you want the original right there, not three
        clicks away.
      </p>

      <p>
        Use a highlight-and-ask flow on dense passages. Textbook authors
        compress on purpose — they're trying to fit decades of thought
        into one paragraph. Selecting a paragraph and asking the AI to
        explain it in plain language using the surrounding chapters is
        the single move that makes hard textbooks readable. It feels
        like cheating the first few times. It isn't.
      </p>

      <p>
        Quiz yourself after each chapter. Five to ten multiple-choice
        questions with citations back to the page each answer came from.
        This is more useful than re-reading. Re-reading feels like
        learning; quizzing reveals what you actually retained. (If your
        tool doesn't do this, Anki works — it's just slower to set up.)
      </p>

      <p>
        And keep a glossary of the field's vocabulary as you go. By
        chapter ten you'll have a bilingual term sheet that's more
        valuable than any single chapter of the textbook. Eventually
        you'll stop needing the translation altogether for that field.
        That's the win condition.
      </p>

      <H2>Things that will go wrong, and what they mean</H2>

      <p>
        <strong>Your pages got reflowed.</strong> You used the wrong tool.
        Re-translate with one that preserves layout. There's no fix
        downstream — this is a source-quality problem.
      </p>

      <p>
        <strong>Footnotes ended up in the wrong place.</strong> Almost
        always an OCR-quality issue from a scanned PDF. Re-OCR at higher
        resolution, or find an EPUB version of the book if one exists.
      </p>

      <p>
        <strong>Technical terms come out inconsistently from chapter to
        chapter.</strong> Your translation tool doesn't have a large
        enough context window to keep terminology stable across the whole
        book. Use a multi-pass tool (BookTranslate.ai) or one that
        supports a glossary (DeepL Pro, Translify).
      </p>

      <p>
        <strong>Equations got translated into broken text.</strong> Your
        tool tried to OCR an equation image and butchered it. Either the
        source PDF stored equations as raster images (find a better
        source) or the tool is misdetecting equations as regular text
        (find a better tool).
      </p>

      <p>
        <strong>The translation is technically correct but reads
        stiffly.</strong> Machine translation has a long-standing
        reputation for grammatical but unnatural prose. For dense
        technical content this barely matters — you're reading for
        information, not style. For narrative passages it matters more.
        Claude and GPT-4o give you the most natural reading; DeepL is
        the most accurate but sometimes wooden. Trade-off.
      </p>

      <H2>The whole thing in five lines</H2>

      <p>
        Get a clean source file (or OCR it). Pick a layout-preserving
        tool. Take a minute on settings — target language, engine,
        glossary. Spot-check the result before committing. Then study
        actively: source alongside, highlight-and-ask, quiz yourself,
        glossary as you go. That's it.
      </p>

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
