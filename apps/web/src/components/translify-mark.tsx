import Link from "next/link";

// One source of truth for the Translify mark.
//
// Design intent:
//   - The mascot Lumi (paper owl) on a deep-ink tile = "this is Translify".
//   - Simplified geometry — head, ear tufts, two eyes, saffron beak, sage scarf —
//     so the silhouette stays readable from 16px favicon up to 60px avatar.
//   - Wings/body intentionally omitted at icon scale; they don't survive small
//     sizes. Full Lumi lives in components/lumi/lumi.tsx for hero contexts.

interface MarkProps {
  /** Square tile size in px. Defaults to 36. */
  size?: number;
  /** Optional className applied to the outer wrapper. */
  className?: string;
}

/** Just the icon tile — no wordmark. Used for tight spaces. */
export function TranslifyIcon({ size = 36, className = "" }: MarkProps) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-xl bg-[color:var(--color-ink)] shadow-[0_2px_0_rgba(20,16,8,0.4)] ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={Math.round(size * 0.78)}
        height={Math.round(size * 0.78)}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        {/* Ear tufts */}
        <path d="M6.8 5 L5.4 2 L8.2 4.2Z" fill="#FAF6EE" />
        <path d="M17.2 5 L18.6 2 L15.8 4.2Z" fill="#FAF6EE" />
        {/* Head */}
        <ellipse cx="12" cy="11" rx="8.4" ry="7.6" fill="#FAF6EE" />
        {/* Left eye */}
        <circle cx="9" cy="10.2" r="2.4" fill="#20283A" />
        <circle cx="9" cy="10.2" r="1.5" fill="#FAF6EE" />
        <circle cx="9.2" cy="10.4" r="0.95" fill="#20283A" />
        {/* Right eye */}
        <circle cx="15" cy="10.2" r="2.4" fill="#20283A" />
        <circle cx="15" cy="10.2" r="1.5" fill="#FAF6EE" />
        <circle cx="15.2" cy="10.4" r="0.95" fill="#20283A" />
        {/* Saffron beak */}
        <path d="M10.6 13.2 L12 15.2 L13.4 13.2 Q12 12.6 10.6 13.2Z" fill="#E0A458" />
        {/* Sage scarf */}
        <path
          d="M5.4 17.6 Q12 15.8 18.6 17.6 Q17.2 21.4 12 22 Q6.8 21.4 5.4 17.6Z"
          fill="#7BA17C"
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
