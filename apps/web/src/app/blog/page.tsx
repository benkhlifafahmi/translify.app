import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "./_posts";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";

export const metadata: Metadata = {
  title: "Blog — Reading, translation, and AI for serious readers",
  description:
    "How to read foreign-language books deeply, compare AI reading tools, and get more from every translated text. Long-form essays from the Translify team.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    title: "Translify Blog",
    description:
      "Long-form essays on reading foreign-language books with AI.",
    url: `${SITE}/blog`,
  },
};

export default function BlogIndex() {
  const sorted = [...BLOG_POSTS].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 lg:py-20">
      <nav className="mb-10 text-sm text-[color:var(--color-ink-soft)]">
        <Link href="/" className="hover:text-[color:var(--color-ink)]">
          ← Back home
        </Link>
      </nav>

      <header className="mb-14">
        <span className="badge-pill bg-[color:var(--color-paper-3)] text-[color:var(--color-ink-soft)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-saffron)]" />
          Translify Blog
        </span>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.4rem,5vw,3.4rem)] font-semibold leading-tight tracking-tight">
          On reading,{" "}
          <em className="text-[color:var(--color-saffron-deep)]">
            translation, and AI
          </em>
          .
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-[color:var(--color-ink-soft)]">
          Long-form essays for people who read foreign-language books and want
          to understand them properly. No sponsored content, no listicle sludge.
        </p>
      </header>

      <section className="space-y-10">
        {sorted.map((post) => (
          <article key={post.slug} className="group">
            <Link href={`/blog/${post.slug}`} className="block">
              <div className="flex flex-wrap gap-2">
                {post.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[color:var(--color-paper-3)]/70 px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[color:var(--color-ink-soft)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold leading-snug tracking-tight transition-colors group-hover:text-[color:var(--color-saffron-deep)] md:text-[1.7rem]">
                {post.title}
              </h2>
              <p className="mt-2 text-[color:var(--color-ink-soft)]">
                {post.excerpt}
              </p>
              <p className="mt-3 text-xs text-[color:var(--color-ink-soft)]">
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                {" · "}
                {post.readingMinutes} min read
              </p>
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
