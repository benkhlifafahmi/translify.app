// Registry of blog posts. Single source of truth for the /blog index page
// and the sitemap. Adding a post here ensures it gets indexed.
//
// Leading underscore = Next.js does not treat this as a route.

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  /** Short pull-quote shown on the index page. */
  excerpt: string;
  publishedAt: string;
  modifiedAt?: string;
  /** Reading time estimate. */
  readingMinutes: number;
  /** Topical tags for internal linking + filtering. */
  tags: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "read-german-philosophy-in-english-ai",
    title: "How to read a German philosophy book in English (without losing the nuance)",
    description:
      "Reading Kant, Hegel, or Nietzsche in translation flattens half the argument. Here's how to read German philosophy in English with AI assistance — keeping the original text within reach for the moments that matter.",
    excerpt:
      "Translated philosophy is famously lossy — Geist becomes 'spirit' becomes nothing in particular. Here's a practical workflow for reading German philosophy in English without losing the parts that matter.",
    publishedAt: "2026-05-11",
    readingMinutes: 12,
    tags: ["language-learning", "philosophy", "german", "study"],
  },
  {
    slug: "best-ai-tools-foreign-language-books-2026",
    title: "The best AI tools for studying foreign-language books in 2026",
    description:
      "We tested seven AI tools for reading foreign-language books — Translify, Readlang, Immersive Translate, DeepL Pro, Linga, MyReader, and Parallel Books. Here's an honest comparison with prices, strengths, and the niches each serves best.",
    excerpt:
      "Seven AI reading tools, tested on the same Spanish novel, French essay, and German textbook. No sponsored picks, no SEO sludge — just the honest comparison.",
    publishedAt: "2026-05-11",
    readingMinutes: 14,
    tags: ["comparison", "tools", "ai-reading"],
  },
  {
    slug: "translate-textbook-pdf-epub-guide",
    title: "How to translate a textbook into your native language (PDF + EPUB guide)",
    description:
      "Step-by-step guide to translating a textbook PDF or EPUB into your native language while preserving the layout, footnotes, equations, and figures. Includes what to do about diagrams, glossaries, and how to chat with the translated book.",
    excerpt:
      "Translating a textbook isn't translating a paragraph eight thousand times. Layout, footnotes, equations, glossaries all matter. Here's how to do it right.",
    publishedAt: "2026-05-11",
    readingMinutes: 10,
    tags: ["how-to", "textbook", "translation", "study"],
  },
  {
    slug: "read-russian-literature-english-ai",
    title: "How to read Russian literature (Tolstoy, Dostoevsky, Chekhov) in English with AI",
    description:
      "Reading War and Peace, The Brothers Karamazov, or Anna Karenina in English without losing the patronymics, the religious subtext, and the long Russian sentence rhythm. A reference guide to setup, translations, and AI-assisted comparison reading.",
    excerpt:
      "Pevear/Volokhonsky or Garnett? Patronymics that change every page? Religious references modern readers miss? A reference guide to reading the Russian classics in English without losing what matters.",
    publishedAt: "2026-05-12",
    readingMinutes: 11,
    tags: ["language-learning", "russian", "literature", "study"],
  },
  {
    slug: "read-french-novel-english-original",
    title: "How to read a French novel in English with the original alongside",
    description:
      "Proust, Camus, Flaubert, Houellebecq — how to read modern and classical French literature in English while keeping the French within reach for the moments that matter. Reference guide to translations, parallel reading setup, and AI-assisted comparison.",
    excerpt:
      "French sentences carry rhythm, register, and rude little jokes that translators flatten. Here's a reference guide to reading French literature in English without losing the things English alone can't show you.",
    publishedAt: "2026-05-12",
    readingMinutes: 10,
    tags: ["language-learning", "french", "literature", "study"],
  },
  {
    slug: "read-japanese-novel-english-kanji",
    title: "How to read a Japanese novel in English with the kanji within reach",
    description:
      "Murakami, Mishima, Tanizaki, Ogawa — a reference guide to reading Japanese novels in English while keeping the original kanji accessible for names, untranslatable terms, and the moments translation flattens.",
    excerpt:
      "Japanese has honorifics, three writing systems, and a habit of dropping subjects. English translation loses most of it. Here's how to read Japanese novels in English without losing the parts that depend on the original.",
    publishedAt: "2026-05-12",
    readingMinutes: 11,
    tags: ["language-learning", "japanese", "literature", "study"],
  },
  {
    slug: "read-quran-english-arabic-parallel",
    title: "How to read the Quran in English with the Arabic side by side",
    description:
      "Reading the Quran in English while keeping the Arabic accessible for the verses that carry the weight. A reference guide to translations (Yusuf Ali, Pickthall, Saheeh International, Abdel Haleem), parallel reading setup, and AI-assisted verse-by-verse comparison.",
    excerpt:
      "The Arabic of the Quran is the text; the English is a reading. Here's a reference guide to reading the Quran in English while keeping the original Arabic accessible for the verses that matter.",
    publishedAt: "2026-05-12",
    readingMinutes: 10,
    tags: ["religious-text", "arabic", "quran", "study"],
  },
  {
    slug: "deepl-vs-chatgpt-vs-claude-book-translation-2026",
    title: "DeepL vs ChatGPT vs Claude for translating books (2026 comparison)",
    description:
      "Comparison of DeepL, ChatGPT, and Claude for full-book translation in 2026: quality across language pairs, layout preservation, long-context handling, cost, and which to pick for fiction, technical, and academic books.",
    excerpt:
      "Three of the strongest translation engines, tested on the same novel, textbook, and academic paper. A reference comparison of where each one wins and where it falls down.",
    publishedAt: "2026-05-12",
    readingMinutes: 12,
    tags: ["comparison", "tools", "deepl", "chatgpt", "claude"],
  },
  {
    slug: "learn-language-by-reading-books-ai",
    title: "How to learn a language by reading books with AI (a realistic plan)",
    description:
      "A realistic plan for learning a language by reading books with AI assistance: choosing a level-appropriate book, vocabulary capture, when to translate, spaced repetition, and a 6-month roadmap from A2 to B2 reading.",
    excerpt:
      "Reading books to learn a language works — but only if the plan accounts for vocabulary capture, level mismatch, and the temptation to translate everything. A reference plan for the next six months.",
    publishedAt: "2026-05-12",
    readingMinutes: 13,
    tags: ["language-learning", "how-to", "study", "spaced-repetition"],
  },
  {
    slug: "translate-academic-paper-foreign-language-ai",
    title: "How to read academic papers in a foreign language with AI",
    description:
      "Reference guide to reading academic papers in a foreign language with AI: terminology preservation, citation handling, equations, figures, and how to skim a paper in a language you don't speak well enough to read at pace.",
    excerpt:
      "Papers are short, dense, and full of field-specific terms that general translators get wrong. A reference guide to reading academic papers in a foreign language with AI assistance.",
    publishedAt: "2026-05-12",
    readingMinutes: 9,
    tags: ["how-to", "academic", "translation", "research"],
  },
  {
    slug: "epub-vs-pdf-foreign-language-reading",
    title: "EPUB vs PDF for foreign-language reading: which works better and why",
    description:
      "Reference comparison of EPUB vs PDF for foreign-language reading. Reflow, font scaling, OCR risk, highlight precision, AI tool compatibility, footnote handling, and which format to pick for novels, textbooks, and academic papers.",
    excerpt:
      "EPUB and PDF look interchangeable until you try to read them in a language you don't speak. A reference comparison of which format works better for what, and why.",
    publishedAt: "2026-05-12",
    readingMinutes: 8,
    tags: ["how-to", "epub", "pdf", "ebooks"],
  },
];

export function findPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
