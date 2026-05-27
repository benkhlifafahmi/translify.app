/**
 * Dynamic OG image for a post: /api/og/post/[slug]
 *
 * Returns a 1200x630 PNG via Next's ImageResponse. The image is what
 * Twitter / Discord / iMessage / LinkedIn render when someone shares a
 * Translify post link. Per-type templates make each artifact look like its
 * own thing instead of a templated card.
 *
 * Implementation notes:
 *   - Pure inline styles, no Tailwind. ImageResponse only sees CSS-in-JS.
 *   - Divs need explicit ``display: flex`` for layout.
 *   - System sans for V1; V2 can fetch the Fraunces woff2 once at module
 *     init for the brand italic. The default is clean enough that the
 *     card still reads as crafted without the brand font.
 *   - Backend URL comes from NEXT_PUBLIC_API_URL so the same image works
 *     locally and in production.
 */
import { ImageResponse } from "next/og";

export const runtime = "edge";

const SIZE = { width: 1200, height: 630 };
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Brand palette mirrored from globals.css. ImageResponse can't read CSS vars.
const COLORS = {
  paper: "#FAF6EE",
  paper2: "#F4ECDB",
  paper3: "#EFE5CF",
  ink: "#20283A",
  inkSoft: "#4A5263",
  border: "#D4C29C",
  saffron: "#E0A458",
  saffronDeep: "#C8893E",
  sage: "#7BA17C",
  sageDeep: "#5F8763",
  coral: "#E2786C",
  coralDeep: "#C5594D",
  accentText: "#2A1F0F",
};

type PostType = "word" | "sentence" | "passage" | "milestone" | "list" | "reflection";

interface Post {
  id: string;
  type: PostType;
  payload: Record<string, unknown>;
  source_lang: string | null;
  target_lang: string | null;
  note: string | null;
  share_slug: string;
  author: {
    username: string | null;
    display_name: string | null;
  } | null;
  book_title: string | null;
  book_author: string | null;
}

async function fetchPost(slug: string): Promise<Post | null> {
  try {
    const res = await fetch(`${API_URL}/social/posts/${encodeURIComponent(slug)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as Post;
  } catch {
    return null;
  }
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const post = await fetchPost(slug);

  if (!post) {
    return new ImageResponse(<FallbackCard />, { ...SIZE });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "64px 72px",
          background: `linear-gradient(135deg, ${COLORS.paper} 0%, ${COLORS.paper2} 60%, ${COLORS.paper3} 100%)`,
          color: COLORS.ink,
          fontFamily: "sans-serif",
        }}
      >
        <Header
          handle={post.author?.username ?? null}
          displayName={post.author?.display_name ?? null}
        />
        <Body post={post} />
        <Footer
          bookTitle={post.book_title}
          bookAuthor={post.book_author}
          sourceLang={post.source_lang}
          targetLang={post.target_lang}
        />
      </div>
    ),
    { ...SIZE },
  );
}

/* ───────────────────────── Components ───────────────────────── */

function Header({
  handle,
  displayName,
}: {
  handle: string | null;
  displayName: string | null;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <BrandMark />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.4, color: COLORS.ink }}>
          Translify
        </div>
        {handle && (
          <div style={{ fontSize: 18, color: COLORS.inkSoft, marginTop: 2 }}>
            {displayName ? `${displayName} · ` : ""}@{handle}
          </div>
        )}
      </div>
    </div>
  );
}

function Body({ post }: { post: Post }) {
  // Each branch returns a fixed-height block centered in the remaining space.
  // Use marginTop: auto on the wrapper so the body sits between header
  // (top) and footer (bottom) without collapsing.
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        marginTop: 20,
        marginBottom: 20,
      }}
    >
      {post.type === "word" && <WordBody post={post} />}
      {post.type === "sentence" && <SentenceBody post={post} />}
      {post.type === "passage" && <PassageBody post={post} />}
      {post.type === "milestone" && <MilestoneBody post={post} />}
      {post.type === "list" && <ListBody post={post} />}
      {post.type === "reflection" && <ReflectionBody post={post} />}
    </div>
  );
}

function WordBody({ post }: { post: Post }) {
  const p = post.payload as {
    source_word: string;
    target_word: string;
    pronunciation?: string;
    part_of_speech?: string;
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 140,
          fontWeight: 700,
          letterSpacing: -3,
          lineHeight: 1,
          color: COLORS.ink,
        }}
      >
        {truncate(p.source_word, 24)}
      </div>
      {p.pronunciation && (
        <div
          style={{
            fontSize: 24,
            color: COLORS.inkSoft,
            fontStyle: "italic",
            marginTop: 12,
          }}
        >
          /{p.pronunciation}/
        </div>
      )}
      <div
        style={{
          height: 2,
          width: 80,
          background: COLORS.border,
          marginTop: 24,
          marginBottom: 24,
          borderRadius: 2,
        }}
      />
      <div
        style={{
          fontSize: 72,
          fontWeight: 600,
          lineHeight: 1,
          color: COLORS.saffronDeep,
        }}
      >
        {truncate(p.target_word, 28)}
      </div>
      {p.part_of_speech && (
        <div
          style={{
            display: "flex",
            marginTop: 18,
            padding: "8px 18px",
            background: COLORS.paper3,
            borderRadius: 999,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 2,
            color: COLORS.inkSoft,
            textTransform: "uppercase",
          }}
        >
          {p.part_of_speech}
        </div>
      )}
    </div>
  );
}

function SentenceBody({ post }: { post: Post }) {
  const p = post.payload as { source_text: string; target_text: string };
  return (
    <div style={{ display: "flex", flexDirection: "column", maxWidth: 1056 }}>
      <div
        style={{
          fontSize: 46,
          fontWeight: 500,
          fontStyle: "italic",
          lineHeight: 1.18,
          color: COLORS.ink,
          letterSpacing: -0.4,
        }}
      >
        “{truncate(p.source_text, 200)}”
      </div>
      <div
        style={{
          marginTop: 28,
          fontSize: 32,
          lineHeight: 1.3,
          color: COLORS.inkSoft,
          letterSpacing: -0.2,
        }}
      >
        {truncate(p.target_text, 240)}
      </div>
    </div>
  );
}

function PassageBody({ post }: { post: Post }) {
  const p = post.payload as { source_text: string; target_text: string };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: "rgba(255, 251, 240, 0.7)",
        border: `1.5px solid ${COLORS.border}`,
        borderRadius: 20,
        padding: "32px 36px",
        maxWidth: 1056,
      }}
    >
      <div
        style={{
          fontSize: 36,
          fontWeight: 500,
          fontStyle: "italic",
          lineHeight: 1.25,
          color: COLORS.ink,
        }}
      >
        {truncate(p.source_text, 280)}
      </div>
      <div
        style={{
          marginTop: 20,
          fontSize: 26,
          lineHeight: 1.35,
          color: COLORS.inkSoft,
        }}
      >
        {truncate(p.target_text, 340)}
      </div>
    </div>
  );
}

function MilestoneBody({ post }: { post: Post }) {
  const p = post.payload as {
    label: string;
    value?: number | null;
    icon?: string | null;
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        background: `linear-gradient(180deg, #FFFBF0 0%, #FBE9C2 100%)`,
        border: `2px solid ${COLORS.saffronDeep}40`,
        borderRadius: 28,
        padding: "44px 56px",
        maxWidth: 1056,
      }}
    >
      {p.icon && (
        <div style={{ fontSize: 96, lineHeight: 1 }}>{p.icon}</div>
      )}
      {typeof p.value === "number" && (
        <div
          style={{
            marginTop: p.icon ? 16 : 0,
            fontSize: 188,
            fontWeight: 700,
            lineHeight: 0.95,
            color: COLORS.saffronDeep,
            letterSpacing: -4,
          }}
        >
          {p.value}
        </div>
      )}
      <div
        style={{
          marginTop: 16,
          fontSize: 40,
          fontWeight: 600,
          color: COLORS.ink,
          letterSpacing: -0.6,
        }}
      >
        {truncate(p.label, 80)}
      </div>
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
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 4,
          color: COLORS.inkSoft,
        }}
      >
        Reading list
      </div>
      <div
        style={{
          marginTop: 12,
          fontSize: 64,
          fontWeight: 600,
          lineHeight: 1.05,
          color: COLORS.ink,
          letterSpacing: -1.5,
        }}
      >
        {truncate(p.title, 60)}
      </div>
      {p.description && (
        <div
          style={{
            marginTop: 18,
            fontSize: 26,
            color: COLORS.inkSoft,
            lineHeight: 1.35,
            maxWidth: 1056,
          }}
        >
          {truncate(p.description, 200)}
        </div>
      )}
      <div
        style={{
          marginTop: 26,
          fontSize: 22,
          color: COLORS.saffronDeep,
          fontWeight: 600,
          letterSpacing: 1,
        }}
      >
        {p.book_ids.length} {p.book_ids.length === 1 ? "book" : "books"}
      </div>
    </div>
  );
}

function ReflectionBody({ post }: { post: Post }) {
  const p = post.payload as { text: string };
  return (
    <div
      style={{
        display: "flex",
        fontSize: 44,
        fontStyle: "italic",
        fontWeight: 500,
        lineHeight: 1.2,
        color: COLORS.ink,
        maxWidth: 1056,
        letterSpacing: -0.4,
      }}
    >
      “{truncate(p.text, 240)}”
    </div>
  );
}

function Footer({
  bookTitle,
  bookAuthor,
  sourceLang,
  targetLang,
}: {
  bookTitle: string | null;
  bookAuthor: string | null;
  sourceLang: string | null;
  targetLang: string | null;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 18,
        borderTop: `1.5px dashed ${COLORS.border}`,
        fontSize: 20,
        color: COLORS.inkSoft,
      }}
    >
      <div style={{ display: "flex" }}>
        {bookTitle ? (
          <span>
            From <b style={{ color: COLORS.ink }}>{truncate(bookTitle, 60)}</b>
            {bookAuthor ? ` by ${truncate(bookAuthor, 40)}` : ""}
          </span>
        ) : (
          <span>translify.app</span>
        )}
      </div>
      {sourceLang && targetLang && (
        <div
          style={{
            display: "flex",
            padding: "6px 14px",
            borderRadius: 999,
            background: COLORS.paper3,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 2,
            color: COLORS.inkSoft,
            textTransform: "uppercase",
          }}
        >
          {sourceLang.toUpperCase()} → {targetLang.toUpperCase()}
        </div>
      )}
    </div>
  );
}

function BrandMark() {
  // Tiny inline mark — matches the logo on opengraph-image.tsx.
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 56,
        height: 56,
        borderRadius: 12,
        background: COLORS.ink,
      }}
    >
      <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
        <path d="M6.8 5 L5.4 2 L8.2 4.2Z" fill={COLORS.paper} />
        <path d="M17.2 5 L18.6 2 L15.8 4.2Z" fill={COLORS.paper} />
        <ellipse cx="12" cy="11" rx="8.4" ry="7.6" fill={COLORS.paper} />
        <circle cx="9" cy="10.2" r="2.4" fill={COLORS.ink} />
        <circle cx="9" cy="10.2" r="1.5" fill={COLORS.paper} />
        <circle cx="9.2" cy="10.4" r="0.95" fill={COLORS.ink} />
        <circle cx="15" cy="10.2" r="2.4" fill={COLORS.ink} />
        <circle cx="15" cy="10.2" r="1.5" fill={COLORS.paper} />
        <circle cx="15.2" cy="10.4" r="0.95" fill={COLORS.ink} />
        <path d="M10.6 13.2 L12 15.2 L13.4 13.2 Q12 12.6 10.6 13.2Z" fill={COLORS.saffron} />
        <path
          d="M5.4 17.6 Q12 15.8 18.6 17.6 Q17.2 21.4 12 22 Q6.8 21.4 5.4 17.6Z"
          fill={COLORS.sage}
        />
      </svg>
    </div>
  );
}

function FallbackCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
        background: `linear-gradient(135deg, ${COLORS.paper} 0%, ${COLORS.paper2} 60%, ${COLORS.paper3} 100%)`,
        color: COLORS.ink,
        fontFamily: "sans-serif",
      }}
    >
      <BrandMark />
      <div style={{ marginTop: 32, fontSize: 56, fontWeight: 700, letterSpacing: -1.5 }}>
        Translify
      </div>
      <div
        style={{
          marginTop: 18,
          fontSize: 28,
          color: COLORS.inkSoft,
          textAlign: "center",
          maxWidth: 880,
          lineHeight: 1.3,
        }}
      >
        Read any book. Talk to it. Quiz yourself.
      </div>
    </div>
  );
}

/* ───────────────────────── Utils ───────────────────────── */

function truncate(s: string, n: number): string {
  if (!s) return "";
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}
