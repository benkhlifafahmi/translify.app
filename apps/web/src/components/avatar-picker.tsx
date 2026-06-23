"use client";

/**
 * Reddit-style generated-avatar picker.
 *
 * Uses DiceBear's hosted "avataaars" style (https://dicebear.com), the same
 * cartoon-face family Slack/GitHub-clones tend to use. Avatars are SVGs
 * served from `https://api.dicebear.com/9.x/avataaars/svg?seed=<seed>` —
 * deterministic per seed, no API key, no backend changes (we just store
 * the resulting URL in `users.avatar_url`).
 *
 * UI: a grid of 8 randomly seeded previews, a "Roll again" button, and the
 * currently saved avatar shown above. Clicking a preview selects it; the
 * parent reads `value` to know which URL to save.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";

const STYLE = "avataaars";
const API = `https://api.dicebear.com/9.x/${STYLE}/svg`;

function makeSeed(): string {
  // 8-char URL-safe random seed. Crypto when available, fallback otherwise.
  const bytes = new Uint8Array(6);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes)
    .map((b) => b.toString(36))
    .join("")
    .slice(0, 10);
}

export function avatarUrlForSeed(seed: string): string {
  return `${API}?seed=${encodeURIComponent(seed)}`;
}

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  /** Optional initial seed (e.g., the user's handle) for the first roll. */
  initialSeed?: string | null;
}

export function AvatarPicker({ value, onChange, initialSeed }: Props) {
  const { t } = useI18n();
  const [seeds, setSeeds] = useState<string[]>(() => {
    const first = initialSeed ?? makeSeed();
    return [first, ...Array.from({ length: 7 }, makeSeed)];
  });

  const options = useMemo(
    () => seeds.map((s) => ({ seed: s, url: avatarUrlForSeed(s) })),
    [seeds],
  );

  // If the parent hasn't set a value yet, pre-select the first option so the
  // grid never looks "nothing chosen" on first render.
  useEffect(() => {
    if (!value && options[0]) onChange(options[0].url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reroll = useCallback(() => {
    const next = Array.from({ length: 8 }, makeSeed);
    setSeeds(next);
    onChange(avatarUrlForSeed(next[0]));
  }, [onChange]);

  const clear = useCallback(() => onChange(null), [onChange]);

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <CurrentAvatar url={value} />
        <div className="flex flex-col gap-1.5">
          <p className="text-[0.85rem] font-semibold text-[color:var(--color-ink)]">
            {t("avatar.heading")}
          </p>
          <p className="text-[0.78rem] leading-snug text-[color:var(--color-ink-soft)]">
            {t("avatar.description")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-8">
        {options.map(({ seed, url }) => {
          const selected = url === value;
          return (
            <button
              key={seed}
              type="button"
              onClick={() => onChange(url)}
              aria-label={t("avatar.select")}
              aria-pressed={selected}
              className={
                selected
                  ? "relative aspect-square overflow-hidden rounded-2xl border-[2.5px] border-[color:var(--color-saffron-deep)] bg-white shadow-[0_4px_0_rgba(152,96,24,0.30)] transition-[transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]"
                  : "relative aspect-square overflow-hidden rounded-2xl border-[1.5px] border-[color:var(--color-border)] bg-white transition-[transform,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-[1px] hover:border-[color:var(--color-border-strong)] active:scale-[0.97]"
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                width={96}
                height={96}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              {selected && (
                <span
                  aria-hidden
                  className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[color:var(--color-saffron-deep)] text-white"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={reroll}
          className="inline-flex h-10 items-center gap-2 rounded-full border-[1.5px] border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)] px-4 text-[0.86rem] font-semibold text-[color:var(--color-ink)] transition-[transform,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[color:var(--color-paper-2)] active:scale-[0.97]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
          {t("avatar.reroll")}
        </button>
        {value && (
          <button
            type="button"
            onClick={clear}
            className="inline-flex h-10 items-center rounded-full px-3 text-[0.84rem] font-medium text-[color:var(--color-ink-soft)] underline decoration-dotted underline-offset-4 transition-colors duration-150 hover:text-[color:var(--color-ink)]"
          >
            {t("avatar.clear")}
          </button>
        )}
      </div>
    </div>
  );
}

function CurrentAvatar({ url }: { url: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        width={80}
        height={80}
        className="h-20 w-20 shrink-0 rounded-full border-[1.5px] border-[color:var(--color-border-strong)] bg-white object-cover shadow-[var(--shadow-paper)]"
      />
    );
  }
  return (
    <span
      aria-hidden
      className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-[1.5px] border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-paper-2)] font-[family-name:var(--font-display)] text-[1.4rem] font-semibold text-[color:var(--color-ink-soft)]"
    >
      ?
    </span>
  );
}
