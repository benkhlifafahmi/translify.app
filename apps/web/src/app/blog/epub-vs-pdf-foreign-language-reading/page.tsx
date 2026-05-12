import type { Metadata } from "next";
import Link from "next/link";
import { BlogShell, H2, H3, Lead, Quote } from "../_shell";
import { findPost } from "../_posts";

const post = findPost("epub-vs-pdf-foreign-language-reading")!;
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
    q: "Which is better for reading foreign-language books — EPUB or PDF?",
    a: "EPUB for novels and general reading; PDF for textbooks, academic papers, and any layout where page numbers matter. EPUB reflows text so highlights, font size, and AI lookups behave predictably. PDF fixes the layout, which is essential when figures, equations, and page references need to stay in place. For most foreign-language readers, EPUB is the default; PDF is the exception.",
  },
  {
    q: "Why does EPUB work better for AI-assisted reading?",
    a: "EPUB stores text as actual text, structured by chapters and paragraphs. AI tools can read it directly, extract clean text for translation, and align highlights to precise character offsets. PDF stores text positionally (where each glyph sits on the page), which makes text extraction noisier, especially for complex layouts. Highlighting and asking questions works in both, but the experience is smoother in EPUB.",
  },
  {
    q: "What about Kindle's AZW3 / KFX format?",
    a: "Kindle's proprietary formats are EPUB-equivalents with DRM. For AI-assisted reading you usually need to convert to EPUB first (Calibre, tools like Epubor for DRM removal where legally allowed), which adds friction. If you have the choice between buying a book on Kindle or as a standalone EPUB, the standalone EPUB is more flexible. Modern Kindle also accepts EPUB uploads.",
  },
  {
    q: "Can I convert PDF to EPUB?",
    a: "Yes, but quality varies enormously. Born-digital PDFs (those created from word processors, never scanned) convert reasonably with Calibre or commercial tools. Scanned PDFs need OCR first, then conversion; results are mediocre. Heavily-formatted PDFs (textbooks, magazines) lose most of their layout on conversion. If layout matters, stay with PDF. If pure text matters, convert.",
  },
  {
    q: "Why does my PDF text look scrambled when I try to highlight or copy it?",
    a: "Two causes. First: the PDF is a scan, meaning the text is actually images and needs OCR. Run OCR (Adobe Acrobat, ABBYY FineReader, or built into many academic readers). Second: the PDF uses non-standard glyph encoding — common in older academic typesetting, where the underlying characters don't match what's displayed. There's no clean fix for the second case; live with the noise or find a different copy.",
  },
  {
    q: "Are foreign-language EPUBs hard to find?",
    a: "Depends on the language. Major European languages (Spanish, French, German, Italian, Portuguese, Russian) have wide EPUB availability through Amazon, Google Books, and country-specific sellers (Fnac, Saturn, Bol). Asian languages are more variable — Japanese EPUBs through BookWalker and DMM, Chinese through major Chinese e-readers (the international ecosystem is thinner). For public-domain classics, Project Gutenberg has EPUBs in dozens of languages.",
  },
  {
    q: "Do reading apps differ in how well they handle foreign-language text?",
    a: "Yes. Most issues are font-related: a reader without proper CJK fonts will render Japanese or Chinese as boxes. Most issues are right-to-left related: Arabic and Hebrew readers need RTL layout support. Apple Books, Calibre's reader, and dedicated tools like Translify handle all major scripts. Some older or budget readers don't.",
  },
];

export default function Page() {
  return (
    <BlogShell post={post} faqs={faqs}>
      <Lead>
        EPUB and PDF look interchangeable until you try to read a book in a
        language you don't speak. Then the differences matter. Reflow vs. fixed
        layout, text-as-text vs. text-as-pixels, clean structure vs. positional
        rendering — each format makes specific things easier and other things
        harder. This is a reference comparison for foreign-language reading.
      </Lead>

      <H2>The short version</H2>

      <ul className="!my-4 list-disc space-y-2 pl-6">
        <li>
          <strong>EPUB wins for</strong>: novels, general non-fiction, anything
          where reflow and clean text extraction matter. AI-assisted reading
          is smoother in EPUB.
        </li>
        <li>
          <strong>PDF wins for</strong>: textbooks, academic papers, anything
          where page numbers, figures, equations, or layout need to stay
          fixed.
        </li>
      </ul>

      <p>
        For most foreign-language readers, the default should be EPUB. PDF
        is the right choice when the visual layout is itself meaningful —
        textbook chapter structure, paper figures, scanned historical
        documents.
      </p>

      <H2>The technical difference</H2>

      <p>
        EPUB is structured text. Under the hood it's HTML and CSS with
        chapter metadata. Readers display it; they don't render a fixed
        page. You can change font, size, color, line spacing without
        affecting the document.
      </p>

      <p>
        PDF is a fixed page description. Each character is placed at a
        specific x/y coordinate. Readers display the pages as designed; you
        can zoom, but you can't reflow. Text extraction works by reading
        the character coordinates and reconstructing word order, which works
        well for simple layouts and badly for complex ones.
      </p>

      <p>
        This technical difference cascades into every aspect of the reading
        experience.
      </p>

      <H2>Reflow and font scaling</H2>

      <p>
        For foreign-language readers, font choice and size matter more than
        for native readers. Reading kanji at 18pt is faster than at 11pt
        for most learners; Cyrillic at smaller sizes is harder for English-
        trained eyes; right-to-left scripts (Arabic, Hebrew) often display
        better with specific fonts and spacing.
      </p>

      <p>
        EPUB readers let you adjust all of this. Set the font, size, line
        height, page margins. The text reflows to match. PDF readers can
        zoom, but zooming a fixed page makes pages too wide for the screen
        — you scroll horizontally, which is impractical for sustained reading.
      </p>

      <p>
        For mobile reading especially, EPUB is meaningfully better. A PDF
        designed for letter or A4 paper is unreadable on a phone without
        reflow features, which most readers don't have for PDF.
      </p>

      <H2>Highlights and AI lookups</H2>

      <p>
        Highlighting works in both formats but with different precision.
        EPUB highlights attach to character offsets in the underlying HTML
        — they're precise and survive font changes. PDF highlights attach
        to page positions and become fragile if the PDF is reflowed
        elsewhere.
      </p>

      <p>
        AI lookups (highlight a word, ask what it means) work better in
        EPUB because the text extraction is cleaner. In PDFs, especially
        those with complex columns or footnotes, the extracted text
        sometimes scrambles word order, breaks across columns, or includes
        adjacent text the user didn't select.
      </p>

      <p>
        This isn't a categorical PDF problem — well-typeset modern PDFs
        extract cleanly. But it's a higher-variance experience than EPUB.
      </p>

      <H2>OCR risk</H2>

      <p>
        Older PDFs, especially of scanned books and archival material, are
        images of text rather than text itself. These need OCR before any
        text-based operation: copying, highlighting, translation, AI
        lookup.
      </p>

      <p>
        Modern OCR (Adobe Acrobat, ABBYY, Tesseract) handles Latin scripts
        well and major Asian scripts adequately. Quality depends on scan
        resolution. 300 DPI is the standard recommendation; lower-quality
        scans produce errors that propagate into translation.
      </p>

      <p>
        EPUB never has this problem because the text is always text. If
        you have a choice between an OCR'd PDF and a properly-typeset
        EPUB, the EPUB is almost always cleaner.
      </p>

      <H2>Footnotes and references</H2>

      <p>
        Footnote behavior differs sharply between formats.
      </p>

      <p>
        EPUB typically renders footnotes as inline links — tap the footnote
        marker, the footnote text appears as a popup or at the end of the
        chapter. This is convenient for reading and for AI lookup
        (translation tools can usually access the footnote text directly).
      </p>

      <p>
        PDF renders footnotes at the bottom of the page, as they appeared
        in print. This preserves the visual layout of academic typography
        but makes the footnote text harder to extract programmatically. For
        academic papers and textbooks where footnotes are dense, this is
        a meaningful drawback of EPUB-conversion — you lose the page-level
        spatial relationship between text and footnote.
      </p>

      <H2>Layout preservation</H2>

      <p>
        For some books, the layout is the content. Textbooks with chapter-
        opening figures, magazines with multi-column spreads, illustrated
        children's books, art books. EPUB doesn't preserve any of this; PDF
        preserves all of it.
      </p>

      <p>
        For these books, even if PDF is harder to highlight and translate,
        it's the right format. The convenience trade-off has to acknowledge
        what the book actually is.
      </p>

      <H2>Tool compatibility</H2>

      <p>
        EPUB compatibility in 2026:
      </p>

      <ul className="!my-4 list-disc space-y-2 pl-6">
        <li>
          Universal support in dedicated readers (Apple Books, Calibre,
          Pocketbook, KOReader).
        </li>
        <li>
          Wide support in AI reading tools (Translify, Immersive Translate,
          Readlang, Linga, MyReader).
        </li>
        <li>
          Kindle accepts EPUB uploads since 2022; it converts to its
          internal format.
        </li>
      </ul>

      <p>
        PDF compatibility in 2026:
      </p>

      <ul className="!my-4 list-disc space-y-2 pl-6">
        <li>
          Universal support everywhere. PDFs are the most portable document
          format in existence.
        </li>
        <li>
          Variable quality in AI tools. Some handle PDFs well (Translify,
          Adobe's AI features, academic-paper-focused tools like
          SciSpace); some handle them poorly.
        </li>
        <li>
          Always test a PDF in your reading tool of choice before assuming
          it'll work. Complex layouts cause silent extraction errors.
        </li>
      </ul>

      <H2>Recommendations by use case</H2>

      <H3>Reading a novel in a foreign language</H3>

      <p>
        EPUB. Get the EPUB, drop it into a reader with AI assistance, read.
        For most learners, this is the default workflow.
      </p>

      <H3>Studying a textbook in a foreign language</H3>

      <p>
        PDF, if the textbook is layout-heavy (most STEM textbooks are).
        EPUB if the textbook is mostly prose (most humanities textbooks).
        For STEM, PDF preserves the equations and figures correctly; EPUB
        conversion often breaks them.
      </p>

      <H3>Reading academic papers</H3>

      <p>
        PDF, always. Papers are designed for print layout; EPUB conversion
        loses the figure placement, the equation rendering, and the page
        numbering used in citation.
      </p>

      <H3>Reading manga or comics</H3>

      <p>
        PDF or CBZ/CBR (comic archive format). The layout is the content.
        EPUB conversion of manga produces unusable results.
      </p>

      <H3>Reading scanned historical documents</H3>

      <p>
        PDF, with OCR before reading. EPUB conversion of scanned material
        is possible but lossy. Better to read the PDF directly with OCR.
      </p>

      <H2>Practical setup</H2>

      <p>
        For a serious foreign-language reading habit:
      </p>

      <ul className="!my-4 list-disc space-y-2 pl-6">
        <li>
          Prefer EPUB when buying or downloading. Avoid Kindle for
          foreign-language reading specifically because the DRM adds
          friction.
        </li>
        <li>
          Use Calibre as a library manager and format converter. It's free,
          handles every common format, and runs OCR if needed.
        </li>
        <li>
          For AI-assisted reading, pick a tool that handles your format of
          choice well. Translify supports both EPUB and PDF natively;
          others are stronger on one or the other.
        </li>
        <li>
          For PDFs, prefer born-digital versions over scanned ones. The
          quality difference is large and the OCR'd alternative usually
          isn't worth the effort.
        </li>
      </ul>

      <Quote>
        Translify accepts both EPUB and PDF for foreign-language reading,
        with AI-assisted translation, highlights, and chat-with-book on
        either format. Try it at{" "}
        <Link href="/onboarding" className="underline decoration-[color:var(--color-saffron)] not-italic">
          translify.app/onboarding
        </Link>
        .
      </Quote>
    </BlogShell>
  );
}
