/**
 * Polymorphic post card. Renders the six post types differently while
 * sharing the same header + footer + spacing rhythm:
 *
 *   ┌──────────────────────────────────────────────┐
 *   │ [avatar] @handle · 2 days ago     (citation) │  header
 *   │                                              │
 *   │  type-specific body                          │
 *   │                                              │
 *   │  ─── from BookTitle by Author ──────────────│  footer (when book-derived)
 *   └──────────────────────────────────────────────┘
 *
 * Server component. Wrap in <Link> if the surrounding surface wants the
 * whole card to navigate to /p/<slug>; pass `linked` to opt in.
 */
import Link from "next/link";
import type { Post, PostType } from "@/lib/social";

interface Props {
  post: Post;
  /** When true, the card title block links to the per-post page. */
  linked?: boolean;
  /** When true, hide the byline (used on the per-post detail page). */
  hideAuthor?: boolean;
}

export function PostCard({ post, linked = true, hideAuthor = false }: Props) {
  const handle = post.author?.username ?? null;
  const displayName = post.author?.display_name ?? handle ?? "Anonymous";

  return (
    <article
      className="rounded-2xl border-[1.5px] border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-5 shadow-[var(--shadow-paper)] sm:p-6"
    >
      {!hideAuthor && handle && (
        <header className="mb-4 flex items-center gap-3">
          <Avatar src={post.author?.avatar_url} fallback={displayName[0]} />
          <div className="min-w-0 flex-1">
            <Link
              href={`/u/${encodeURIComponent(handle)}`}
              className="block truncate text-[0.92rem] font-semibold leading-tight text-[color:var(--color-ink)] hover:underline decoration-[color:var(--color-saffron)] decoration-2 underline-offset-4"
            >
              {displayName}
            </Link>
            <p className="truncate text-[0.78rem] text-[color:var(--color-ink-soft)]">
              @{handle} · {formatRelative(post.created_at)}
            </p>
          </div>
          {linked && (
            <Link
              href={`/p/${post.share_slug}`}
              aria-label="Open post"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[color:var(--color-ink-soft)] transition-colors duration-150 hover:bg-[color:var(--color-paper-2)] hover:text-[color:var(--color-ink)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </Link>
          )}
        </header>
      )}

      {post.note && (
        <p className="mb-4 text-[0.92rem] leading-snug text-[color:var(--color-ink)]">
          {post.note}
        </p>
      )}

      <PostBody post={post} />

      {post.book_title && post.type !== "list" && (
        <footer className="mt-5 border-t border-dashed border-[color:var(--color-border)] pt-3 text-[0.78rem] text-[color:var(--color-ink-soft)]">
          From <span className="font-semibold text-[color:var(--color-ink)]">{post.book_title}</span>
          {post.book_author && <> by {post.book_author}</>}
        </footer>
      )}
    </article>
  );
}

/* ───────────────────────── Per-type body ───────────────────────── */

function PostBody({ post }: { post: Post }) {
  switch (post.type) {
    case "word":
      return <WordBody post={post} />;
    case "sentence":
      return <SentenceBody post={post} />;
    case "passage":
      return <PassageBody post={post} />;
    case "milestone":
      return <MilestoneBody post={post} />;
    case "list":
      return <ListBody post={post} />;
    case "reflection":
      return <ReflectionBody post={post} />;
    default:
      return null;
  }
}

function WordBody({ post }: { post: Post }) {
  const p = post.payload as {
    source_word: string;
    target_word: string;
    part_of_speech?: string | null;
    pronunciation?: string | null;
    example?: string | null;
  };
  return (
    <div className="rounded-xl bg-[color:var(--color-paper-2)]/40 px-5 py-6 text-center">
      <p className="font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,3rem)] font-semibold leading-tight tracking-tight text-[color:var(--color-ink)]">
        {p.source_word}
      </p>
      {p.pronunciation && (
        <p className="mt-1 text-[0.84rem] italic text-[color:var(--color-ink-soft)]">
          /{p.pronunciation}/
        </p>
      )}
      <div className="mx-auto mt-3 h-px w-12 bg-[color:var(--color-border)]" />
      <p className="mt-3 font-[family-name:var(--font-display)] text-[1.4rem] font-medium text-[color:var(--color-saffron-deep)]">
        {p.target_word}
      </p>
      {p.part_of_speech && (
        <span className="mt-2 inline-block rounded-full bg-[color:var(--color-paper-3)] px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-ink-soft)]">
          {p.part_of_speech}
        </span>
      )}
      {p.example && (
        <p className="mt-4 text-[0.88rem] italic leading-snug text-[color:var(--color-ink-soft)]">
          “{p.example}”
        </p>
      )}
    </div>
  );
}

function SentenceBody({ post }: { post: Post }) {
  const p = post.payload as { source_text: string; target_text: string };
  return (
    <div>
      <p className="font-[family-name:var(--font-display)] text-[clamp(1.05rem,2.2vw,1.3rem)] italic leading-snug text-[color:var(--color-ink)]">
        “{p.source_text}”
      </p>
      <p className="mt-3 text-[clamp(0.95rem,1.8vw,1.1rem)] leading-snug text-[color:var(--color-ink-soft)]">
        {p.target_text}
      </p>
    </div>
  );
}

function PassageBody({ post }: { post: Post }) {
  const p = post.payload as {
    source_text: string;
    target_text: string;
    source_page?: number | null;
  };
  return (
    <blockquote className="relative rounded-xl bg-[color:var(--color-paper-2)]/50 px-5 py-5">
      <span aria-hidden className="absolute left-3 top-1 font-[family-name:var(--font-display)] text-[3rem] leading-[0.7] text-[color:var(--color-saffron-deep)]/30">
        “
      </span>
      <p className="font-[family-name:var(--font-display)] text-[1.02rem] italic leading-relaxed text-[color:var(--color-ink)]">
        {p.source_text}
      </p>
      <p className="mt-3 text-[0.96rem] leading-relaxed text-[color:var(--color-ink-soft)]">
        {p.target_text}
      </p>
      {p.source_page && (
        <p className="mt-2 text-[0.74rem] uppercase tracking-[0.14em] text-[color:var(--color-ink-soft)]">
          Page {p.source_page}
        </p>
      )}
    </blockquote>
  );
}

function MilestoneBody({ post }: { post: Post }) {
  const p = post.payload as {
    kind: string;
    label: string;
    value?: number | null;
    icon?: string | null;
  };
  return (
    <div className="rounded-2xl border border-[color:var(--color-saffron-deep)]/30 bg-gradient-to-br from-[#FFFBF0] to-[#FBE9C2] px-5 py-6 text-center">
      {p.icon && (
        <p className="text-[2.2rem] leading-none" aria-hidden>
          {p.icon}
        </p>
      )}
      {typeof p.value === "number" && (
        <p
          className={`font-[family-name:var(--font-display)] font-semibold tracking-tight text-[color:var(--color-saffron-deep)] ${
            p.icon ? "mt-2" : ""
          } text-[clamp(2.6rem,6vw,3.6rem)] leading-none`}
        >
          {p.value}
        </p>
      )}
      <p className="mt-2 font-[family-name:var(--font-display)] text-[1.05rem] font-semibold leading-snug tracking-tight text-[color:var(--color-ink)]">
        {p.label}
      </p>
    </div>
  );
}

function ListBody({ post }: { post: Post }) {
  const p = post.payload as {
    title: string;
    description?: string | null;
    book_ids: string[];
  };
  return (
    <div>
      <h3 className="font-[family-name:var(--font-display)] text-[1.2rem] font-semibold leading-tight tracking-tight text-[color:var(--color-ink)]">
        {p.title}
      </h3>
      {p.description && (
        <p className="mt-1 text-[0.92rem] leading-snug text-[color:var(--color-ink-soft)]">
          {p.description}
        </p>
      )}
      <p className="mt-3 text-[0.78rem] uppercase tracking-[0.14em] text-[color:var(--color-ink-soft)]">
        {p.book_ids.length} {p.book_ids.length === 1 ? "book" : "books"}
      </p>
    </div>
  );
}

function ReflectionBody({ post }: { post: Post }) {
  const p = post.payload as { text: string };
  return (
    <p className="font-[family-name:var(--font-display)] text-[1.05rem] italic leading-relaxed text-[color:var(--color-ink)]">
      {p.text}
    </p>
  );
}

/* ───────────────────────── Bits ───────────────────────── */

function Avatar({ src, fallback }: { src?: string | null; fallback: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 rounded-full border border-[color:var(--color-border)] object-cover"
        loading="lazy"
      />
    );
  }
  return (
    <span
      aria-hidden
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--color-paper-3)] font-[family-name:var(--font-display)] text-[0.95rem] font-semibold uppercase text-[color:var(--color-ink-soft)]"
    >
      {fallback?.toUpperCase()}
    </span>
  );
}

/** Renders "5m", "2h", "3d", "12 Mar" depending on age. Cheap and locale-naive
 * on purpose: the surrounding page is i18n-aware but these tags are too dense
 * to benefit from full Intl.RelativeTimeFormat at every render. */
function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return "just now";
  const m = Math.floor(diffSec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: now - then > 365 * 24 * 3_600_000 ? "numeric" : undefined,
  });
}

/** Re-exported for surfaces that want to render placeholders before fetch. */
export type { Post, PostType };
