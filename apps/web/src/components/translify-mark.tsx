import Link from "next/link";

// One source of truth for the Translify mark.
//
// Design intent:
//   - Book outline (paper-cream stroke on deep-ink tile) = "this is a book product"
//   - Saffron ribbon-bookmark hanging out the top = the brand mark, says "you
//     keep your place here." Universally readable as a reading symbol.
//   - The ribbon's V-notch matches the existing brand vocabulary of small
//     hand-drawn paper details.
//
// The two-color design degrades fine at small sizes — at 16px the ribbon
// becomes a 2px saffron stub, still legible as "something marked".

interface MarkProps {
  /** Square tile size in px. Defaults to 36. */
  size?: number;
  /** Optional className applied to the outer wrapper. */
  className?: string;
}

/** Just the icon tile — no wordmark. Used for tight spaces. */
export function TranslifyIcon({ size = 36, className = "" }: MarkProps) {
  // Outer tile uses CSS vars so dark backgrounds (e.g. landing footer) still
  // look right if we ever invert.
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-xl bg-[color:var(--color-ink)] text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4)] ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={Math.round(size * 0.6)}
        height={Math.round(size * 0.6)}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        {/* Book outline — same path the brand has been using; familiar shape. */}
        <path
          d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Saffron ribbon bookmark — the distinguishing element. */}
        <path
          d="M13 2 v7 l1.5 -1.2 l1.5 1.2 v-7"
          fill="#E0A458"
          stroke="#E0A458"
          strokeWidth="0.6"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

interface BrandProps extends MarkProps {
  /** Href the brand link points to. Defaults to "/". */
  href?: string;
  /** Whether to render the "Translify" wordmark next to the icon. */
  withWordmark?: boolean;
  /** Tailwind text size class for the wordmark. */
  wordmarkClassName?: string;
}

/** Icon + (optional) wordmark, wrapped in a Link. The site-level "logo". */
export function TranslifyMark({
  size = 36,
  href = "/",
  withWordmark = true,
  className = "",
  wordmarkClassName = "text-2xl",
}: BrandProps) {
  return (
    <Link
      href={href}
      aria-label="Translify"
      className={`flex items-center gap-2.5 font-[family-name:var(--font-display)] font-semibold tracking-tight text-[color:var(--color-ink)] ${className}`}
    >
      <TranslifyIcon size={size} />
      {withWordmark && <span className={wordmarkClassName}>Translify</span>}
    </Link>
  );
}
