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
];

export function findPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
