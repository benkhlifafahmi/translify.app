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
    a: "Readlang at $5/mo is the cheapest of the serious tools. Translify Reader is €7.99/mo. Immersive Translate Pro is $9.99/mo. The free tiers (Duoreader, Parallel Books) work for casual use but limit features.",
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
        I tested seven AI reading tools on the same three books — a García
        Márquez novel in Spanish, a Camus essay in French, and a German
        intro linear-algebra textbook — over about six weeks. Below is what
        actually happened with each one. Full disclosure up front: I work
        on Translify, which is one of the seven. I've done my best to be
        useful about where the others win, because nothing kills a
        comparison post faster than obvious axe-grinding.
      </Lead>

      <p>
        If you're in a hurry: <strong>Translify</strong> if you sit down to
        actually study a book; <strong>Readlang</strong> if you read Spanish
        news for fun and want word lookups; <strong>Immersive Translate</strong>{" "}
        if you live in your browser and translate across everything;{" "}
        <strong>DeepL Pro</strong> if you only need raw translation and
        you'll do the reading somewhere else. Skip Kindle Translate unless
        your books happen to live in the Kindle Store and your language pair
        is English ↔ Spanish or German → English.
      </p>

      <p>
        That covers the decision for maybe 90% of readers. The longer
        version, with what each one actually felt like to use, is below.
      </p>

      <H2>Translify</H2>

      <p>
        Yes, I built it. So take the praise with whatever salt is
        appropriate. What I'll say is what it's actually for.
      </p>

      <p>
        You upload a PDF or an EPUB. It rebuilds the book in your target
        language — keeping the original layout intact, which matters more
        than you'd think for textbooks and anything with footnotes. Then
        you can chat with the whole book (every answer cites the page),
        highlight a passage to get an AI explanation in your language, and
        generate quizzes from chapters you've actually read. The point of
        the thing is comprehension, not translation.
      </p>

      <p>
        If you're reading Hegel for class or a Japanese business book
        you've been putting off for a year, that combination is hard to
        find elsewhere. If you mostly want to read web articles in Spanish
        and build vocabulary, you're overpaying. €0–22/mo, 14-day trial,
        30-day money-back. Onward.
      </p>

      <H2>Readlang</H2>

      <p>
        Readlang is the tool I'd recommend to my sister, who's been
        learning Spanish casually for three years. She reads articles, she
        clicks on words she doesn't know, the flashcards build themselves,
        and she's slowly accumulating a real vocabulary without doing
        anything that feels like studying. It costs $5 a month. It's been
        refined for a decade. The r/languagelearning crowd reveres it for
        a reason.
      </p>

      <p>
        The catch — and it's the reason it's not the only thing I use — is
        that Readlang reflows text. Books lose their layout. For a novel
        that doesn't matter; for a textbook with figures, equations, and
        footnotes, it's a dealbreaker. Readlang also doesn't do chat. You
        can look up words, you can't ask the book what an argument means.
        For its intended audience, that's a feature, not a bug. (Full
        comparison:{" "}
        <Link href="/alternative/readlang" className="underline decoration-[color:var(--color-saffron)]">
          Translify vs Readlang
        </Link>
        .)
      </p>

      <H2>Immersive Translate</H2>

      <p>
        Ten million users, and you can see why the moment you install it.
        It's a browser extension that translates basically everything —
        web pages, PDFs, EPUBs, YouTube subtitles, Zoom captions, manga
        panels, image text. You can swap between twenty-plus translation
        engines. The bilingual side-by-side display is genuinely nice.
      </p>

      <p>
        Where it doesn't quite fit my workflow: it's a translation overlay,
        not a study tool. You can read a German EPUB bilingually, but you
        can't ask &ldquo;what's the author's argument across these three
        chapters&rdquo; — there's no whole-book chat, no highlight-and-ask,
        no quiz mode. I use it for browser stuff and YouTube videos.
        $9.99/mo or $70/yr. (Full comparison:{" "}
        <Link href="/alternative/immersive-translate" className="underline decoration-[color:var(--color-saffron)]">
          Translify vs Immersive Translate
        </Link>
        .)
      </p>

      <H2>DeepL Pro</H2>

      <p>
        DeepL is the gold standard for European-language translation, full
        stop. If you need a German document translated to English and the
        quality has to be right the first time, it's hard to do better.
        Document Translator preserves formatting reasonably well, the API
        is excellent if you're building something, and the desktop app
        lives in my menu bar.
      </p>

      <p>
        It's not really a reading tool, though. DeepL gives you a translated
        file. What you do with it from there is your problem. A lot of us
        use DeepL alongside something like Translify rather than instead
        of it — DeepL translates, Translify reads. Pricing starts at
        $8.74/mo and goes up from there based on how many docs you push
        through it. (Full comparison:{" "}
        <Link href="/alternative/deepl" className="underline decoration-[color:var(--color-saffron)]">
          Translify vs DeepL
        </Link>
        .)
      </p>

      <H2>Linga and Parallel Books</H2>

      <p>
        These belong together because they solve the same problem
        differently than everyone else on the list: they don't let you
        upload anything. Instead, you pick from a curated catalog of
        bilingual books — graded readers, public-domain classics, the kind
        of thing language teachers recommend.
      </p>

      <p>
        For early-intermediate learners who want to read &ldquo;a French
        novel&rdquo; without sourcing one, this is perfect. For anyone who
        needs to read <em>this specific book</em> — a textbook, a paper,
        anything outside the catalog — it doesn't help. Both are free or
        freemium; Parallel Books charges per individual title.
      </p>

      <H2>MyReader</H2>

      <p>
        MyReader is a general document-AI tool that happens to do
        translation. You can upload books, papers, web links, YouTube
        videos and chat with them, get summaries, convert anything to
        audio in 50+ voices. The chat is solid. The audiobook generation
        is actually impressive.
      </p>

      <p>
        It's worth knowing about, but if your primary task is &ldquo;read a
        German textbook in English,&rdquo; the translation features feel
        bolted on rather than built in. Better for varied input — papers,
        articles, videos — than for sustained book reading.
      </p>

      <H2>Amazon Kindle Translate</H2>

      <p>
        Launched November 2025, baked into the Kindle reading experience.
        If your book is in the Kindle Store and your language pair is
        English ↔ Spanish or German → English, this is the easiest path
        you'll find — translation is one tap, you stay in the device or
        app you already know.
      </p>

      <p>
        Three limitations make this a no-go for most of us. The catalog is
        Amazon-only. The language coverage is narrow (no French, no
        Japanese, no Arabic, no anything except those three pairs). And
        there's no chat, no highlight-explain, no quizzes — it's a
        translation layer over the existing Kindle reading experience, not
        a study tool. Worth keeping an eye on as it expands. (Full
        comparison:{" "}
        <Link href="/alternative/kindle-translate" className="underline decoration-[color:var(--color-saffron)]">
          Translify vs Kindle Translate
        </Link>
        .)
      </p>

      <H2>The boring side-by-side table, for completeness</H2>

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
              <td className="border border-[color:var(--color-border)] px-3 py-2">€0–22/mo</td>
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

      <H2>One last thing</H2>

      <p>
        Most of the readers I know — including me — use two tools rather
        than one. Immersive Translate for the everyday browser stuff,
        Translify for the books I actually sit down with. That stack is
        about $20 a month and it covers every foreign-language reading
        situation I run into. If I had to pick one and only one, the
        question I'd ask is: do you read books, or do you read everything
        else? Most people read everything else. A meaningful minority sits
        down with books, and for those people the trade-offs flip.
      </p>

      <p>
        Whatever you pick, the worst move is to keep using Google Translate
        on copy-pasted paragraphs. We're past that. Pick something built
        for the way you actually read, give it two weeks, and decide.
      </p>

      <Quote>
        If &ldquo;the way you actually read&rdquo; sounds like the books
        case, try{" "}
        <Link href="/" className="underline decoration-[color:var(--color-saffron)] not-italic">
          Translify
        </Link>{" "}
        free for 14 days. 30-day money-back, no questions.
      </Quote>
    </BlogShell>
  );
}
