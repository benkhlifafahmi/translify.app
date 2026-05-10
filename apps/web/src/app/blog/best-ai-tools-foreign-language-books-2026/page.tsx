import type { Metadata } from "next";
import Link from "next/link";
import { BlogShell, H2, H3, Lead, Quote } from "../_shell";
import { findPost } from "../_posts";

const post = findPost("best-ai-tools-foreign-language-books-2026")!;
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
    q: "What's the best AI tool for reading foreign-language books in 2026?",
    a: "There isn't one. The right tool depends on what you read: serious whole-book study (Translify), casual word lookups (Readlang), broad translation across web + video + books (Immersive Translate), raw translation quality (DeepL). The honest comparison below explains which serves which need.",
  },
  {
    q: "Is DeepL enough for reading a foreign-language book?",
    a: "DeepL gives you a translated file. If you only need translation and you'll do your own reading, that's fine. If you want chat, highlights, AI-explained passages, or quizzes — DeepL doesn't have those. Translify uses DeepL under the hood for European pairs and adds the reading layer on top.",
  },
  {
    q: "What's the cheapest AI book reading tool?",
    a: "Readlang at $5/mo is the cheapest of the serious tools. Translify Reader is €11/mo. Immersive Translate Pro is $9.99/mo. The free tiers (Duoreader, Parallel Books) work for casual use but limit features.",
  },
  {
    q: "Can I read foreign-language books in Kindle Translate instead?",
    a: "If your books are in the Kindle Store and you only need EN↔ES or DE→EN translation, yes. Kindle Translate launched in November 2025 with that narrow coverage. For PDFs, EPUBs from elsewhere, or other language pairs, you need an independent tool.",
  },
  {
    q: "Which tool handles right-to-left scripts (Arabic, Hebrew, Urdu) best?",
    a: "Translify and Immersive Translate both render RTL correctly. Readlang and Parallel Books have partial RTL support. DeepL handles RTL text fine in raw translation but doesn't give you a reading experience.",
  },
  {
    q: "Do any of these tools work offline?",
    a: "Not in any meaningful way. AI book reading requires server-side LLM calls for chat and translation. You can download translated PDFs from most tools for offline reading, but the chat / highlight / quiz features are online-only.",
  },
];

export default function Page() {
  return (
    <BlogShell post={post} faqs={faqs}>
      <Lead>
        Seven AI tools tested on the same three books: a Spanish novel
        (García Márquez), a French essay (Camus), and a German textbook
        (introductory linear algebra). Below is what each tool actually did,
        what it costs, and the niche it serves best. No sponsored picks. No
        listicle sludge — just the comparison.
      </Lead>

      <p>
        I work on one of these tools (Translify), so my biases are in plain
        view. I've tried to be honest about where competitors win, because
        if you're reading a comparison post, the worst possible outcome is
        choosing the wrong tool and being annoyed with all of us.
      </p>

      <H2>Quick summary — which to pick</H2>

      <ul className="list-disc space-y-2 pl-6">
        <li><strong>Whole-book deep reading + AI chat:</strong> Translify</li>
        <li><strong>Casual web/Kindle reading with word lookups:</strong> Readlang</li>
        <li><strong>Translate across web, video, meetings as well as books:</strong> Immersive Translate</li>
        <li><strong>Raw translation quality, no reading layer:</strong> DeepL Pro</li>
        <li><strong>Pre-translated bilingual books from a catalog:</strong> Parallel Books, Linga</li>
        <li><strong>Document Q&A on any uploaded file (not book-specific):</strong> MyReader, NotebookLM</li>
      </ul>

      <p>
        Now the long version.
      </p>

      <H2>1. Translify</H2>

      <p>
        <strong>What it does:</strong> Upload any PDF or EPUB up to 200 MB.
        Translify rebuilds the whole book in your target language while
        preserving the layout — tables stay tables, figures stay where they
        were, footnotes stay attached to the right paragraph. Then you can
        chat with the whole book (cited answers, with page numbers), highlight
        any passage for an AI explanation in your language, and generate
        quizzes from chapters you've actually read.
      </p>

      <p>
        <strong>What it's best at:</strong> serious foreign-language reading.
        University students reading texts for class. Researchers reading
        primary sources. Prosumers reading European philosophy or Japanese
        novelists in their original language. Anyone who wants to{" "}
        <em>understand</em> the book, not just decode it.
      </p>

      <p>
        <strong>Where it loses:</strong> if you want browser-wide translation
        (Immersive Translate is built for that), if you just need cheap word
        lookups while reading (Readlang is $5/mo and does this well), or if
        you want to translate a Kindle Store book and read on a Kindle device
        (Kindle Translate is bundled).
      </p>

      <p>
        <strong>Pricing:</strong> Reader €11/mo (2,000 pages/month), Scholar
        €19/mo (unlimited), Family €27/mo (5 readers). 14-day trial, 30-day
        money-back.
      </p>

      <H2>2. Readlang</H2>

      <p>
        <strong>What it does:</strong> Web-based reader for articles, EPUBs,
        and Kindle books. Click any word for a translation; clicks become
        flashcards for spaced repetition. Premium adds AI context-aware
        translations.
      </p>

      <p>
        <strong>What it's best at:</strong> casual language learning. You're
        reading Spanish articles on the web, building vocabulary
        organically. You want a $5/mo tool that's been refined for a decade
        and has a working flashcard system.
      </p>

      <p>
        <strong>Where it loses:</strong> Readlang reflows text — books lose
        their original layout. There's no chat with the whole book and no
        whole-book AI features. For dense academic PDFs or textbooks, the
        reflow alone is a dealbreaker.
      </p>

      <p>
        <strong>Pricing:</strong> Free (limited), Premium $5/mo. Long-time
        favorite of the r/languagelearning crowd.
      </p>

      <p>
        See also: our{" "}
        <Link href="/alternative/readlang" className="underline decoration-[color:var(--color-saffron)]">
          Readlang vs Translify comparison
        </Link>
        .
      </p>

      <H2>3. Immersive Translate</H2>

      <p>
        <strong>What it does:</strong> Browser extension that translates
        websites, PDFs, EPUBs, video subtitles (YouTube, Netflix), image
        text, and meeting captions (Zoom, Meet, Teams). Bilingual side-by-side
        display. 20+ translation engines you can pick from. 10M+ users.
      </p>

      <p>
        <strong>What it's best at:</strong> being everywhere. If you spend
        your day translating across the web, watching foreign-language video,
        and joining international meetings, this is the tool that lives in
        your workflow.
      </p>

      <p>
        <strong>Where it loses:</strong> book-specific depth. It translates
        books well but doesn't chat with them, doesn't generate quizzes,
        doesn't have AI-explained highlights. It's wide rather than deep.
      </p>

      <p>
        <strong>Pricing:</strong> Free tier (limited bilingual translations),
        Pro $9.99/mo or $69.99/yr.
      </p>

      <p>
        See also: our{" "}
        <Link href="/alternative/immersive-translate" className="underline decoration-[color:var(--color-saffron)]">
          Immersive Translate vs Translify comparison
        </Link>
        .
      </p>

      <H2>4. DeepL Pro</H2>

      <p>
        <strong>What it does:</strong> The gold standard for machine
        translation quality, especially in European languages. Document
        Translator preserves formatting for PDFs and Word docs. Available as
        web app, desktop app, browser extension, and API.
      </p>

      <p>
        <strong>What it's best at:</strong> raw translation accuracy. If
        you're a professional translator using DeepL as a first draft, or a
        developer building a translation feature, or someone who occasionally
        needs to translate a document and then read it elsewhere, DeepL is
        unmatched.
      </p>

      <p>
        <strong>Where it loses:</strong> reading experience. DeepL gives you
        a translated file. The reading, study, comprehension all happens
        somewhere else. Many users (myself included) use DeepL alongside a
        reading tool rather than instead of one.
      </p>

      <p>
        <strong>Pricing:</strong> Free (1,500 chars/month, 3 docs), Starter
        $8.74/mo, Advanced $28.74/mo, Ultimate $57.49/mo.
      </p>

      <p>
        See also: our{" "}
        <Link href="/alternative/deepl" className="underline decoration-[color:var(--color-saffron)]">
          DeepL vs Translify comparison
        </Link>
        .
      </p>

      <H2>5. Linga (and Parallel Books)</H2>

      <p>
        <strong>What it does:</strong> Pre-translated bilingual book catalog
        — pick from 1,000+ books across 6 languages (Linga) or 11 languages
        (Parallel Books), read them side-by-side. Definitions and grammar
        notes inline.
      </p>

      <p>
        <strong>What it's best at:</strong> structured reading practice. The
        catalog is curated for language learners — graded readers, classic
        novels at appropriate levels. You don't have to source your own
        books.
      </p>

      <p>
        <strong>Where it loses:</strong> you can't upload your own books.
        You're limited to the catalog. For serious reading, this is a
        dealbreaker — most of the books a researcher or student needs aren't
        in any catalog.
      </p>

      <p>
        <strong>Pricing:</strong> Linga is freemium with paid tiers; Parallel
        Books has a free version and an in-app book purchase model.
      </p>

      <H2>6. MyReader</H2>

      <p>
        <strong>What it does:</strong> Upload books, papers, documents, web
        links, or YouTube videos; get chat, summaries, audiobook conversion
        (50+ voices, 30+ languages).
      </p>

      <p>
        <strong>What it's best at:</strong> not foreign-language books
        specifically — it's a general document AI tool. Strong if your input
        mix is varied (papers, videos, web articles) and you primarily want
        chat and audio.
      </p>

      <p>
        <strong>Where it loses:</strong> not built for foreign-language
        reading specifically. The translation features are an afterthought
        compared to chat. If your primary task is "read this German book in
        English," there are better tools.
      </p>

      <p>
        <strong>Pricing:</strong> Free tier exists; Pro pricing on their site.
      </p>

      <H2>7. Amazon Kindle Translate</H2>

      <p>
        <strong>What it does:</strong> Built into the Kindle reading
        experience, launched November 2025. AI-translates Kindle Store
        titles. Currently supports EN↔ES and DE→EN.
      </p>

      <p>
        <strong>What it's best at:</strong> if you only buy Kindle Store
        books and your language pair is one of the three supported, this is
        the path of least resistance. You're already in Kindle; the
        translation is one tap away.
      </p>

      <p>
        <strong>Where it loses:</strong> closed ecosystem. Books outside the
        Kindle Store don't work. Other language pairs (French↔English,
        Japanese→English, anything to Arabic or Indonesian) aren't
        supported. No chat or highlight features.
      </p>

      <p>
        <strong>Pricing:</strong> Bundled with Kindle for eligible titles.
      </p>

      <p>
        See also: our{" "}
        <Link href="/alternative/kindle-translate" className="underline decoration-[color:var(--color-saffron)]">
          Kindle Translate vs Translify comparison
        </Link>
        .
      </p>

      <H2>The honest comparison table</H2>

      <div className="!my-8 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--color-paper-2)]/60">
            <tr>
              <th className="border border-[color:var(--color-border)] px-3 py-2 text-left">Tool</th>
              <th className="border border-[color:var(--color-border)] px-3 py-2 text-left">Upload your books</th>
              <th className="border border-[color:var(--color-border)] px-3 py-2 text-left">Chat with book</th>
              <th className="border border-[color:var(--color-border)] px-3 py-2 text-left">AI highlight explain</th>
              <th className="border border-[color:var(--color-border)] px-3 py-2 text-left">Quizzes</th>
              <th className="border border-[color:var(--color-border)] px-3 py-2 text-left">Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-[color:var(--color-border)] px-3 py-2 font-semibold">Translify</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">✓ PDF/EPUB 200MB</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">✓ With citations</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">✓</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">✓</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">€11–27/mo</td>
            </tr>
            <tr className="bg-[color:var(--color-paper-2)]/30">
              <td className="border border-[color:var(--color-border)] px-3 py-2 font-semibold">Readlang</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">✓ EPUB/Kindle</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">—</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">Word-level only</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">Flashcards (SRS)</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">$5/mo</td>
            </tr>
            <tr>
              <td className="border border-[color:var(--color-border)] px-3 py-2 font-semibold">Immersive Translate</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">✓ PDF/EPUB</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">—</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">—</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">—</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">$9.99/mo</td>
            </tr>
            <tr className="bg-[color:var(--color-paper-2)]/30">
              <td className="border border-[color:var(--color-border)] px-3 py-2 font-semibold">DeepL Pro</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">✓ PDF/DOCX (limited)</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">—</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">—</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">—</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">$8.74+/mo</td>
            </tr>
            <tr>
              <td className="border border-[color:var(--color-border)] px-3 py-2 font-semibold">Linga / Parallel Books</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">— Catalog only</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">—</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">—</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">—</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">Free/freemium</td>
            </tr>
            <tr className="bg-[color:var(--color-paper-2)]/30">
              <td className="border border-[color:var(--color-border)] px-3 py-2 font-semibold">MyReader</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">✓ Many formats</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">✓</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">—</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">—</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">Freemium</td>
            </tr>
            <tr>
              <td className="border border-[color:var(--color-border)] px-3 py-2 font-semibold">Kindle Translate</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">— Kindle Store only</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">—</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">—</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">—</td>
              <td className="border border-[color:var(--color-border)] px-3 py-2">Bundled</td>
            </tr>
          </tbody>
        </table>
      </div>

      <H2>How to choose, in one sentence per case</H2>

      <ul className="list-disc space-y-3 pl-6">
        <li>
          <strong>You read serious books deeply</strong> → Translify.
        </li>
        <li>
          <strong>You read articles on the web with occasional word
          lookups</strong> → Readlang.
        </li>
        <li>
          <strong>You want one tool that translates across your whole
          browser</strong> → Immersive Translate.
        </li>
        <li>
          <strong>You only need raw translation, not a reading experience</strong>{" "}
          → DeepL Pro.
        </li>
        <li>
          <strong>You want a curated bilingual catalog and don't need to
          upload your own books</strong> → Linga or Parallel Books.
        </li>
        <li>
          <strong>You read Kindle Store titles in EN↔ES or DE→EN</strong> →
          Kindle Translate (it's bundled, just use it).
        </li>
        <li>
          <strong>You want one tool that does papers, videos, AND books</strong>{" "}
          → MyReader.
        </li>
      </ul>

      <p>
        Many readers — myself included — use two tools. Immersive Translate
        for everyday web translation, Translify for the books they actually
        sit down to read. That's a $20/month stack that covers basically every
        foreign-language reading need.
      </p>

      <Quote>
        Try{" "}
        <Link href="/" className="underline decoration-[color:var(--color-saffron)] not-italic">
          Translify
        </Link>{" "}
        free for 14 days. 30-day money-back, no questions.
      </Quote>
    </BlogShell>
  );
}
