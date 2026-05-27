# Translify UX Audit
**Date**: 2026-05-27
**Scope**: visitor-facing marketing + auth surfaces (not the in-app product UI under `/library`, `/read`, `/account`, `/garden`)
**Mode**: redesign — preserve. The warm-paper / saffron-on-cream brand stays. This is friction-reduction and clarity work, not a visual overhaul.

## How to read this

- **Severity**: `P0` drops users, `P1` slows users, `P2` rough edge
- **Effort**: `S` ≤ 1 turn, `M` 2-3 turns, `L` multi-turn
- **Status**: ✓ shipped this session, → recommended next, ◷ later

---

## Site map

| Route | Purpose | Status |
|---|---|---|
| `/` | Marketing home | ✓ redesigned this session |
| `/join` | Anonymous activation funnel | ✓ redesigned this session |
| `/pricing` | Pricing + FAQ + decide CTA | → next |
| `/login` | Magic-link first sign-in | → next |
| `/register` | Email + password sign-up | → next |
| `/start` | Alt landing (testimonials + demo) | needs reconciliation with `/` |
| `/onboarding` | 5-step post-signup wizard | product-adjacent, audit only |
| `/forgot-password`, `/reset-password`, `/verify-email` | auth utility | quick polish |
| `/manifesto` | Brand long-read | low priority |
| `/languages` | SEO hub | low priority |
| `/alternative` | Competitive landing | low priority |
| `/blog` | Content | low priority |
| `/contact` | Support form | quick polish |
| `/privacy`, `/terms`, `/cookies`, `/refund-policy`, `/opt-out` | Legal | leave alone |

---

## The single biggest issue: the funnel has 3 front doors

Today a visitor can land on `/`, `/start`, or `/join`. They all do similar work but tell different stories:

- `/` → marketing landing with feature showcase, links visitors to `/onboarding` (post-signup) instead of `/join` (anonymous-first)
- `/start` → second marketing landing with testimonials + bilingual demo, links to `/join`
- `/join` → activation funnel (topic picker + seed shelf), silently mints anon JWT
- `/onboarding` → 5-step persona/language wizard for *signed-up* users

The home CTA goes to `/onboarding`. The home secondary CTA goes to `/pricing`. The pricing CTA goes to `/onboarding`. But `/onboarding` requires auth. A cold visitor clicking "Start your 14-day trial" likely ends up at the login wall.

**Fix**: pick one funnel and route everything to it.

- Best option: home + pricing + start all CTA into `/join` (the seed-demo / no-auth path). Move `/onboarding` to fire *after* the visitor claims their anonymous session with email.
- `/start` is basically a duplicate of `/`. Either retire it or repurpose it as an A/B variant under a flag.

This is the **single highest-impact change on the whole site**.

| Severity | Effort | Status |
|---|---|---|
| P0 | M | → first |

---

## Per-route audit

### `/` (Home) ✓ shipped

Carry-overs from this session:
- Chat + quizzes are now the lead value-prop, translation second
- Live demo moved below feature showcase
- New ProofRow + PriceTease bands
- Em-dashes I authored were cleaned (2 dashes I directly wrote)

**Still open** (not blockers, queued for `polish`):
- Hero CTA goes to `/onboarding` — should go to `/join` per the funnel-consolidation fix above. **P0 S**
- Chat mock animation: typing dots are static. One CSS keyframe away from feeling alive. **P2 S**
- Pricing component renders inline below the home — could collapse to a "see plans" CTA on mobile to save scroll length. **P2 S**

### `/join` ✓ shipped

Carry-overs:
- Hero hook + capability pills + functional progress eyebrow
- "Most loved" pill on first seed
- Google-skip CTA at bottom of step 2
- SVG cover art replacing emoji thumbnails

**Still open**:
- `animate-float-in` doesn't currently honor `prefers-reduced-motion` (project-wide CSS concern). **P2 S**
- The shelf row doesn't show what's *inside* a book (one sample question or quiz) — that's the strongest hook for "chat with a book". **P1 M**

### `/pricing` → recommended next

**What it has now**: header with logo + "Start trial" CTA, hero (badge + headline + body), `<Pricing />` card grid, 6 "every plan" feature cards in a generic 2-col grid, FAQ, "still deciding" trust card.

**Issues**:
1. **The header CTA fires before the visitor has seen prices.** "Start your trial" sitting in the top-right of a *pricing page* asks for commitment before the page has done its job. Replace with a quieter "Sign in" link or remove. Push the conversion CTA to the bottom of the page after FAQ. **P1 S**
2. **"Every plan includes" is a generic 2-col card grid** — exactly the AI-card-grid tell. With 6 items it should be one of the alternatives from Section 4.9 (chunked groupings, horizontal pills, or featured-vs-rest). **P1 S**
3. **No comparison anchor.** Visitors compare Translify against DeepL/Anki/ChatGPT in their head. A 3-row "Why Translify, not X" strip (versus DeepL: layout preserved; versus ChatGPT: cited answers; versus Anki: generated from your actual reading) would do real conversion work. **P1 M**
4. **Risk-reversal copy is buried.** "30-day money-back" is in the Pricing component and again in the trust card. It should be in the hero subtitle too (it's the single strongest objection-killer). **P0 S**
5. **No social proof on this page.** Pricing is exactly where wavering visitors are. One short quote near the plan grid lifts. **P1 S**
6. **Nav is inconsistent with `/`.** Home uses `SiteNavClient` (full nav). Pricing has just logo + CTA. Means visitors who got here from home now have no way to navigate back to features/how-it-works without browser-back. **P1 S**

| Severity | Effort |
|---|---|
| P0 | M (combined) |

### `/login` → recommended next

**What it has now**: AuthShell with Google button, hairline divider, magic-link form, collapsed password fallback, "new here? make an account" footer link.

**Issues**:
1. **Magic-link-first is excellent UX** (no password to remember post-`/join`). Preserve.
2. **The Google button has a `transition-all hover:-translate-y-[1px]` — but no `:active` press feedback, and no explicit transition properties.** Inconsistent with the rest of the redesigned surfaces. **P2 S**
3. **The "use my password" toggle is hard to find** — small text in a hairline divider. The collapsed-by-default decision is right, but the discovery affordance is too quiet. **P2 S**
4. **Magic-link-sent state has the user's email in bold — but no "we sent it just now" timestamp or "wrong email? change it" affordance in one tap.** Actually the "different email" button exists but is text-only and tiny. **P2 S**
5. **Error messages**: `linkErr` and `pwErr` render in identical pill boxes — fine. But the password-mismatch message ("login.errMismatch") and the magic-link error don't differentiate between "we couldn't reach the server" and "that's not a valid email" / "wrong password". **P1 S**
6. **Email validation regex is local-only** (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`). Doesn't catch many real broken emails. Use the browser-native `type="email"` validation that's already on the input — or pass to the server, which already returns 202 to prevent enumeration. The local regex is dead code. **P2 S**

| Severity | Effort |
|---|---|
| P1 | S |

### `/register` → recommended next

**What it has now**: AuthShell with display-name (optional), email, password, submit. Generic submit error. Footer link to `/login`.

**Issues**:
1. **No Google sign-up on this page.** The `/login` page has Google. The `/register` page has only the email + password form. Visitors who'd happily click "Sign up with Google" have to find that path on /login or /join. **P0 S**
2. **No password requirements visible.** The input has `minLength={8}` but the user doesn't know until they submit. Show requirements inline. **P1 S**
3. **No "what happens after I submit?" reassurance.** Versus the `/join` no-auth path where the visitor sees their library in 30 seconds, this is the slower path — they need to know they're 1 click from done. **P1 S**
4. **Error states are server-message passthrough.** `err.message` from `ApiError` could be anything. Map common ones (email taken, weak password, network) to friendly copy. **P1 S**
5. **No anonymous-session claim hint.** If the user came from `/join` (where they already started reading a seed) and now wants to claim that anonymous session with an email — there's no flow for that here. Probably handled elsewhere, worth verifying. **P0 M**

| Severity | Effort |
|---|---|
| P0 | M |

### `/start` → reconciliation needed

**What it has now**: independent marketing landing with hero, browser-frame demo of French→English with citation, 14-flag language strip, 3 feature cards, 3 testimonials, dark gradient bottom CTA card → `/join`.

**Issues**:
1. **It duplicates `/`** without making it clear *why*. Two front-page marketing landings is confusing for SEO (canonical signal split) and for analytics (events fire on different routes for the same intent). **P0 M**
2. **No nav links beyond "Sign in"** — once on `/start`, the visitor can't get to `/pricing` or `/manifesto`. **P1 S**
3. **The browser-chrome window mockup of "translify.app/read/french-novel/in/english"** is exactly the "fake screenshot built from divs" anti-pattern from Section 9.E and 4.8. It works because the content inside is real text not styled rectangles — but the macOS traffic-light dots + chrome bar feels like a Tell. Could be replaced with a real component preview using the actual reader pane styles. **P2 M**
4. **`— Marcel Proust, Du côté de chez Swann`** uses an em-dash. **P0 S** (mechanical fix)
5. **Stat numbers (`start.stat1.n` etc.)** are likely the same inflated marketing numbers as the home — fine as long as they match across surfaces. **P2 S** verify

| Severity | Effort |
|---|---|
| P0 | M |

**Recommendation**: collapse `/start` into a single A/B-flagged variant under `/`, or convert it into a `/why` brand page with a clear different job from `/`. Retire the duplicate landing.

### `/onboarding` → audit only (product UI)

5 steps: persona → target language → books count → personality preview → final CTA. 882 lines, well-structured but long.

This is product UI per the skill's Section 13 (out of marketing-skill scope), so detailed redesign isn't this skill's job. UX issues observable:

1. **It assumes the user is already signed up** (or anonymously cloned). But the home page CTAs route here directly from cold traffic, who'll hit a login wall. See the "single biggest issue" above.
2. **5 steps is on the high side for an activation flow.** /join does it in 2. Consolidating steps 2 (target language) and 3 (books count) into one screen would shave 20% of the funnel-length perception.
3. **No "skip for now" affordance on each step.** A user who knows what they want should be able to jump out and into the library.

| Severity | Effort |
|---|---|
| P1 | L (do this last, after the funnel is consolidated) |

### `/forgot-password`, `/reset-password`, `/verify-email` → small polish

Haven't audited individually. Apply the same micro-polish: `:active` press states, explicit transitions, error-message clarity, em-dash sweep. Bundle into one S-effort turn.

### `/manifesto`, `/languages`, `/alternative`, `/blog`, `/contact`

Low priority. Touch only after the conversion funnel is sorted. Common likely issues across these:

- Nav inconsistency (each page may have its own header)
- Em-dashes in body copy
- No internal cross-linking between marketing pages

---

## Cross-cutting concerns

### Navigation inconsistency (P0 S)
Three different header treatments observed:
- `/` uses `SiteNavClient` (full nav with menu)
- `/pricing` and `/start` have their own ad-hoc headers (logo + 1 link)
- `/login` / `/register` use `AuthShell` (logo + back link)

**Fix**: extract a single `<MarketingHeader />` component used by `/`, `/pricing`, `/start`, `/manifesto`, `/languages`, `/alternative`, `/blog`, `/contact`. Authenticated pages get the in-app nav. Auth utility pages keep AuthShell.

### Em-dash sweep (P0 S, mechanical)
123 em-dashes across `en.ts`. They show up on every page that hits pricing, plans, faq, manifesto, refund copy. Run a one-pass mechanical replacement (em-dash → comma, period, colon, or parens depending on the sentence). One turn of careful editing.

### `prefers-reduced-motion` is not honored project-wide (P1 S)
`animate-float-in`, `animate-pop-in`, `lumi-bubble-in`, the stagger keyframes — none of them gate behind `@media (prefers-reduced-motion: reduce)`. The skill mandates this for any `MOTION_INTENSITY > 3`. A one-shot global CSS addition fixes it for the whole project.

### `transition-all` used in many places (P2 S)
The Emil-design-eng skill flags `transition-all` as a Tell. Sweep the project for `transition-all` and replace with explicit transitions (`transition-[transform,box-shadow]` etc.). Mostly cosmetic but lifts perceived polish.

### Inflated trust numbers (P2 S, requires user decision)
Home shows `42,000+ books read & chatted` / `14 languages` / `9.4 / 10 reader satisfaction` / `30 days money-back`. Some are verifiable (14 languages, 30 days); the 42k and 9.4/10 numbers risk being fictional. Replace with verifiable claims, or label as "since launch" with a real timestamp, or remove the stat strip.

### Reading direction (i18n)
Project supports Arabic (rtl). Spot checks needed across the redesigned pages to ensure rtl flips correctly (the home page's chat mock has `rtl:rotate-180` on the arrow but I didn't verify all CTAs systematically).

---

## Suggested execution order

| # | Surface / Concern | Severity | Effort | Why now |
|---|---|---|---|---|
| 1 | Funnel consolidation: `/`, `/start`, `/pricing` all CTA into `/join`. Decide fate of `/start`. | P0 | M | Single highest-impact change. Unlocks downstream work. |
| 2 | `/pricing` rework (objection-kill in hero, social proof, comparison anchor, retire top-right CTA) | P0 | M | Conversion lynchpin. |
| 3 | Cross-cutting: extract `<MarketingHeader />`, sweep `transition-all`, gate motion behind `prefers-reduced-motion` | P0 | S | Lifts every subsequent page. |
| 4 | `/login` + `/register` polish (Google on register, password requirements, error mapping, claim-anonymous-session check) | P0 | M | Auth is where intent-positive users drop. |
| 5 | Em-dash mechanical sweep across `en.ts` (123 instances) | P0 | S | Pre-Flight rule. One pass. |
| 6 | Auth utility polish bundle (`/forgot`, `/reset`, `/verify`) | P1 | S | Quick win after the auth pair is done. |
| 7 | `/onboarding` shortening (5 → 3-4 steps, "skip for now" affordances) | P1 | L | Do after the funnel routes correctly. |
| 8 | `/manifesto`, `/languages`, `/alternative`, `/blog`, `/contact` polish bundle | P2 | M | Brand polish, low conversion impact. |

---

## What I will NOT silently change

- URL slugs and route names
- Form field `name`/`id` attributes (analytics + autofill dependencies)
- Primary nav labels
- Brand logo, brand colors
- Legal / consent / cookie copy
- Existing analytics events

Per the skill's redesign-protocol rules.
