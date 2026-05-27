# Translify Design Tokens

Snapshot of `apps/web/src/app/globals.css`. Edit there for the source of truth; this is the rendered summary.

## Palette: Sunlit Library

Brand mood: warm paper, deep ink, three accents. Friendly enough for kids, refined enough for students. **Restrained** color strategy: one dominant accent (saffron) with sage / coral / plum as secondary roles for distinct surfaces.

### Surfaces

| Token | Hex | Use |
|---|---|---|
| `--color-paper` | `#FAF6EE` | Page background (light cream) |
| `--color-paper-2` | `#F4ECDB` | Section tints, headers |
| `--color-paper-3` | `#EFE5CF` | Subtle pills, sliders, progress tracks |
| `--color-ink` | `#20283A` | Body text, primary buttons |
| `--color-ink-soft` | `#4A5263` | Secondary text, muted labels |
| `--color-muted` | `#F0E8D6` | Disabled / inert |
| `--color-muted-foreground` | `#6B6557` | Disabled text |
| `--color-border` | `#E5D8BC` | Subtle divisions |
| `--color-border-strong` | `#D4C29C` | Card edges, dashed borders |

### Brand accents

| Token | Hex | Role |
|---|---|---|
| `--color-saffron` | `#E0A458` | Primary accent (CTAs, hero swash) |
| `--color-saffron-deep` | `#C8893E` | Saffron-on-light text, italics |
| `--color-sage` | `#7BA17C` | Secondary accent (chat, success, garden) |
| `--color-sage-deep` | `#5F8763` | Sage-on-light text |
| `--color-coral` | `#E2786C` | Tertiary accent (quiz, warnings, "playful") |
| `--color-coral-deep` | `#C5594D` | Coral-on-light text, destructive |
| `--color-plum` | `#6B5B95` | Quaternary (rare; specific personalities) |

### Semantic roles

| Token | Bound to | Meaning |
|---|---|---|
| `--color-primary` | `--color-ink` | Primary action surface |
| `--color-primary-foreground` | `--color-paper` | Text on primary |
| `--color-accent` | `--color-saffron` | Accent fills (saffron CTAs) |
| `--color-accent-foreground` | `#2A1F0F` (custom) | Text on saffron (dark espresso for AAA contrast) |
| `--color-success` | `--color-sage` | Success states |
| `--color-warning` | `--color-saffron` | Warning states |
| `--color-destructive` | `--color-coral-deep` | Error / destructive |

### Color rules

1. **One accent per surface**. Saffron is the page-wide accent in marketing. Sage / coral are local to feature themes (chat → sage, quiz → coral). Never mix accent CTAs on the same page.
2. **Tinted neutrals only**. No pure `#000` or `#fff`. Every neutral is warm (tinted toward paper).
3. **Saffron is sacred**. Do not introduce other accent yellows or oranges. If a brand needs to shift, the whole palette shifts in `globals.css`.

## Shape

| Token | Value | Use |
|---|---|---|
| `--radius` | `0.875rem` (~14px) | Default for cards, inputs, buttons |
| `--radius-sm` | `0.5rem` (~8px) | Small chips, ticks, tight inputs |
| `--radius-lg` | `1.25rem` (~20px) | Hero cards, big surfaces |
| `--radius-pill` | `999px` | CTAs, capability pills, badges |

**Shape consistency lock**: large surfaces are `rounded-2xl` or `rounded-[1.4rem]`; CTAs are `rounded-full`; chips are `rounded-full`. Don't mix systems within a surface.

## Elevation (paper shadows)

| Token | Use |
|---|---|
| `--shadow-paper` | `0 1px 0 rgba(74, 60, 30, 0.06), 0 8px 22px -12px rgba(74, 60, 30, 0.18)` — default card |
| `--shadow-paper-lg` | `0 2px 0 rgba(74, 60, 30, 0.05), 0 22px 44px -18px rgba(74, 60, 30, 0.22)` — hero card |
| `--shadow-inset` | `inset 0 0 0 1px rgba(74, 60, 30, 0.05)` — subtle frame |

All shadows are **warm-tinted** (rgba 74/60/30). Never pure black drop shadows on this paper background.

## Typography

| Token | Stack | Use |
|---|---|---|
| `--font-display` | Fraunces, then Georgia / Times | Display headlines, italic emphasis |
| `--font-body` | Hanken Grotesk, then system sans | Body, UI, labels |
| `--font-mono` | JetBrains Mono, then ui-monospace | Code, citation tags |

**About Fraunces**: it's listed as a default-banned serif in some external skills, but it's Translify's existing brand. The italic of Fraunces is the signature look for "Talk to it" / "Remember it" / "in your language" emphasis words. Keep.

Typography rules:
- Display: `font-[family-name:var(--font-display)] text-[clamp(2.6rem,6vw,4.8rem)] font-semibold leading-[1.02] tracking-tight`
- Body: max line length 65-75ch
- Italic for emphasis lives in display (saffron + italic Fraunces). Body uses bold, not italic.
- Eyebrows: `text-[0.7rem] uppercase tracking-[0.22em]` — used sparingly (max 1 per 3 sections per `impeccable` brand rules).

## Motion

- Default easing: `cubic-bezier(0.23, 1, 0.32, 1)` (strong ease-out)
- Default duration: `200ms` for UI (buttons, hovers); `260-500ms` for entrance reveals
- Press feedback: `active:scale-[0.97]` (or `0.98` for full-width buttons) + `active:translate-y-0`
- Hover lift: `hover:-translate-y-[1-3px]`
- **All multi-frame animations gate behind `@media (prefers-reduced-motion: reduce)` in `globals.css`** — `animate-float-in`, `animate-pop-in`, `lumi-*`, `.stagger > *`, `.shimmer` all collapse to static when reduced motion is requested.
- **No `transition-all`**. Always specify properties: `transition-[transform,box-shadow]`.

## Components

The codebase has these reusable building blocks:

- `<MarketingHeader />` — shared nav across all marketing surfaces (`/`, `/pricing`, `/start`, `/manifesto`, `/languages`, `/contact`, `/blog/*`). Pass `compact` for tighter pages.
- `<SeedCover slug={...} />` — 8 typographic SVG book covers for seed library
- `<Lumi />` and `<LumiGuide />` — mascot states (waving, thinking, celebrating, reading, sad, etc.)
- `<TranslifyMark />` / `<TranslifyIcon />` — logo + wordmark
- `<LanguageSwitcher />` — locale picker
- `<AuthShell />` — wrapper for `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`
- shadcn-style `<Button />`, `<Input />`, `<Label />` (lightly customized)

## Backgrounds

The signature backdrop is a soft warm-paper gradient with three blurred color blobs:

```css
.bg-paper-blobs {
  background: var(--color-paper);
}
/* Plus three absolutely-positioned blur blobs:
   - saffron at top-left
   - sage at right
   - coral at bottom-third
   All sized ~28rem with blur-3xl. */
```

## Em-dash policy

**Banned in all visible UI copy.** `en.ts` swept clean (119 → 0). Use commas, colons, periods, parentheses. This is non-negotiable per impeccable brand rules and Pre-Flight Check.

## Recent (May 2026) tightening

- All hero CTAs route to `/join` (anonymous-first activation), not `/onboarding` (auth-required)
- `/onboarding` shortened from 5 to 4 steps (books-per-month slider removed)
- All `transition-all` swept to explicit transitions
- Cross-page reduced-motion gate added
- 8 inline SVG seed covers replaced emoji thumbnails on `/join`
- New `<MarketingHeader />` unifies the header chrome across all marketing surfaces

---

*Snapshot. The source is `apps/web/src/app/globals.css`. Run `/impeccable document` to regenerate.*
