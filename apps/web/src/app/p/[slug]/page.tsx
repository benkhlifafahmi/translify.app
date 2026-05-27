/**
 * Per-post detail page at /p/[slug].
 *
 * One Post, rendered with the same PostCard the timeline uses, plus the
 * author byline and a "Read on Translify" CTA pointing at /join. The page
 * is the canonical share artifact: every Twitter/Discord/iMessage link to
 * a Translify post resolves here.
 *
 * OG metadata points at /api/og/post/[slug] for the social-unfurl image.
 */
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api";
import { getPost, type Post } from "@/lib/social";
import { PostCard } from "@/components/post-card";
import { MarketingHeader } from "@/components/marketing-header";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function loadPost(slug: string): Promise<Post | null> {
  try {
    return await getPost(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

function metaTextFor(post: Post): { title: string; description: string } {
  const author = post.author?.display_name ?? `@${post.author?.username ?? "Translify"}`;
  const fromBook = post.book_title ? ` from ${post.book_title}` : "";
  switch (post.type) {
    case "word": {
      const p = post.payload as { source_word: string; target_word: string };
      return {
        title: `${p.source_word} = ${p.target_word} · Translify`,
        description: `${author} saved this word${fromBook}.`,
      };
    }
    case "sentence":
    case "passage": {
      const p = post.payload as { source_text: string };
      return {
        title: `${truncate(p.source_text, 70)} · Translify`,
        description: `${author} highlighted this${fromBook}.`,
      };
    }
    case "milestone": {
      const p = post.payload as { label: string };
      return {
        title: `${p.label} · Translify`,
        description: `${author} hit a milestone.`,
      };
    }
    case "list": {
      const p = post.payload as { title: string };
      return {
        title: `${p.title} · Translify`,
        description: `${author}'s reading list.`,
      };
    }
    case "reflection": {
      const p = post.payload as { text: string };
      return {
        title: `${truncate(p.text, 70)} · Translify`,
        description: `${author} reflected on a book${fromBook}.`,
      };
    }
    default:
      return { title: "Post · Translify", description: "Read on Translify." };
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug).catch(() => null);
  if (!post) return { title: "Post not found · Translify" };
  const { title, description } = metaTextFor(post);
  const url = `${SITE}/p/${slug}`;
  const og = `${SITE}/api/og/post/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: "Translify",
      images: [{ url: og, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [og],
    },
  };
}

export default async function PostDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) notFound();

  return (
    <>
      <MarketingHeader />
      <main className="mx-auto max-w-2xl px-5 py-10 sm:px-6 lg:py-14">
        {post.author?.username && (
          <p className="mb-5 text-[0.86rem] text-[color:var(--color-ink-soft)]">
            <Link
              href={`/u/${encodeURIComponent(post.author.username)}`}
              className="font-semibold text-[color:var(--color-ink)] underline decoration-[color:var(--color-saffron)] decoration-2 underline-offset-4"
            >
              @{post.author.username}
            </Link>
          </p>
        )}

        <PostCard post={post} linked={false} />

        <section className="mt-10 rounded-2xl border-[1.5px] border-[color:var(--color-saffron)]/40 bg-gradient-to-br from-[#FFFBF0] to-[#FBE9C2] p-6 sm:p-7">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[color:var(--color-saffron-deep)]">
            From Translify
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.4rem,3vw,1.9rem)] font-semibold leading-tight tracking-tight text-[color:var(--color-ink)]">
            {post.book_title
              ? `Read ${post.book_title} on Translify.`
              : `Read any book. Talk to it. Quiz yourself.`}
          </h2>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-[color:var(--color-ink-soft)]">
            Drop in a PDF or EPUB. We rebuild every page in your language,
            then let you chat with the book and quiz yourself on what you read.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/join"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[color:var(--color-ink)] px-6 font-semibold text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4),0_10px_22px_-8px_rgba(20,16,8,0.4)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-[2px] active:scale-[0.97] active:translate-y-0"
            >
              Start a free trial
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/discover"
              className="inline-flex h-12 items-center rounded-full border-[1.5px] border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)]/70 px-5 font-semibold text-[color:var(--color-ink)] transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[color:var(--color-paper-2)] active:scale-[0.97]"
            >
              See more posts
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}
