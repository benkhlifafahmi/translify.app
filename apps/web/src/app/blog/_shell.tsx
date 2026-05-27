// Shared chrome for blog posts: header, footer, typography wrapper, schema.
//
// Leading underscore = not a route.

import Link from "next/link";
import type { BlogPost } from "./_posts";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";

interface Props {
  post: BlogPost;
  children: React.ReactNode;
  /** Optional list of FAQs rendered at the bottom + emitted as FAQPage JSON-LD. */
  faqs?: { q: string; a: string }[];
}

export function BlogShell({ post, children, faqs }: Props) {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    author: { "@type": "Organization", name: "Translify", url: SITE },
    publisher: {
      "@type": "Organization",
      name: "Translify",
      logo: { "@type": "ImageObject", url: `${SITE}/icon.svg` },
    },
    datePublished: post.publishedAt,
    dateModified: post.modifiedAt ?? post.publishedAt,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}/blog/${post.slug}` },
  };

  const faqSchema = faqs?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 lg:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <nav className="mb-10 text-sm text-[color:var(--color-ink-soft)]">
        <Link href="/blog" className="hover:text-[color:var(--color-ink)]">
          ← Back to blog
        </Link>
      </nav>

      <header className="mb-12">
        <div className="mb-5 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[color:var(--color-paper-3)]/70 px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[color:var(--color-ink-soft)]"
            >
              {tag}
            </span>
          ))}
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.2rem,4.5vw,3.2rem)] font-semibold leading-[1.1] tracking-tight">
          {post.title}
        </h1>
        <p className="mt-4 text-sm text-[color:var(--color-ink-soft)]">
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          {" · "}
          {post.readingMinutes} min read
          {" · "}by the Translify team
        </p>
      </header>

      <article className="prose-post space-y-5 text-[1.05rem] leading-relaxed text-[color:var(--color-ink)]">
        {children}

        {faqs && faqs.length > 0 && (
          <section>
            <h2 className="!mt-14 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
              Frequently asked
            </h2>
            <dl className="mt-5 space-y-5">
              {faqs.map((f) => (
                <div key={f.q}>
                  <dt className="font-semibold">{f.q}</dt>
                  <dd className="mt-1 text-[color:var(--color-ink-soft)]">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <hr className="!my-14 border-[color:var(--color-border)]" />

        <div className="rounded-2xl border-[1.5px] border-[color:var(--color-saffron)] bg-[color:var(--color-saffron)]/5 p-6 text-center">
          <p className="font-[family-name:var(--font-display)] text-xl font-semibold">
            Try Translify free for 14 days.
          </p>
          <p className="mt-2 text-sm text-[color:var(--color-ink-soft)]">
            Upload your first book. No credit card. 30-day money-back on every paid plan.
          </p>
          <Link
            href="/join"
            className="mt-4 inline-flex h-11 items-center rounded-full bg-[color:var(--color-saffron)] px-5 font-semibold"
          >
            Start reading →
          </Link>
        </div>
      </article>
    </main>
  );
}

// ────── Inline typographic helpers for blog post bodies ──────

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="!mt-12 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
      {children}
    </h2>
  );
}

export function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="!mt-8 font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
      {children}
    </h3>
  );
}

export function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p className="!text-[1.15rem] !leading-relaxed text-[color:var(--color-ink-soft)]">
      {children}
    </p>
  );
}

export function Quote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="!my-6 border-l-2 border-[color:var(--color-saffron)] bg-[color:var(--color-saffron)]/5 py-2 pl-5 italic text-[color:var(--color-ink-soft)]">
      {children}
    </blockquote>
  );
}
