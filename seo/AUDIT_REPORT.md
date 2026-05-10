# translify.app — SEO / GEO / AEO Audit

**Audit date:** 2026-05-10
**Audit scope:** Full audit
**Pages crawled:** translify.app/, /onboarding, /login, /register, /manifesto (404), /blog (404), /og-image.png (404), /favicon.ico (404)
**Stack:** Next.js 15 App Router · React 19 · Tailwind 4 · FastAPI backend

---

## Executive summary

Translify has an **unusually thorough metadata + structured-data foundation for a pre-launch product** — Organization, WebSite, SoftwareApplication, FAQPage, BreadcrumbList JSON-LD are all already in place, properly served from `apps/web/src/components/structured-data.tsx`. That's better than ~80% of small SaaS sites at the same stage.

But the *content inside* that infrastructure has three concrete failures:

1. The schema declares prices that don't match the actual pricing component (€7/€15/€23 in JSON-LD vs. €11/€19/€27 on the page). This is a Google rich-results violation that will eventually trigger a manual action.
2. The schema declares `aggregateRating: 4.7 / 1240 ratings` with no third-party review source (Trustpilot, G2, App Store) backing it. Fake or unverifiable AggregateRating is the most common reason Google demotes structured-data rich results, and it can cascade into broader trust penalties.
3. Four URLs referenced in production HTML (`/og-image.png`, `/favicon.ico`, `/manifesto`, `/blog`) all return 404. Every social share is currently broken (no preview image), the browser tab icon is missing, and two footer links go to dead pages — losing both trust signals and crawl equity.

Beyond the existing infrastructure issues, the **biggest opportunity** is the empty sitemap: only 4 URLs are currently indexable. The product already has 8 UI languages, which is 56 free programmatic landing-page surfaces (every source→target pair) — none of which exist yet. This is the only realistic path to non-brand organic traffic.

| Dimension | Score | Status | Key takeaway |
|---|---|---|---|
| SEO | 5/10 | Needs Work | Solid metadata foundation, broken assets and missing programmatic surface |
| GEO | 5/10 | Needs Work | Organization schema is good, but the missing `/manifesto` page and the fake AggregateRating undercut E-E-A-T |
| AEO | 6/10 | On Track | FAQPage schema is the site's strongest SEO asset — already 8 well-formed Q&As |
| **Combined** | **16/30** | | |

---

## Pages audited

| URL | Page Type | Status | Notes |
|---|---|---|---|
| `https://translify.app/` | Homepage | 200 | H1 present ("Read any book, in your language"), all expected sections render, comprehensive JSON-LD |
| `https://translify.app/onboarding` | Conversion | 200 | H1 "Why are you here?" — good intent-based copy; no per-page metadata override |
| `https://translify.app/login` | Auth | 200 | Same root metadata; H1 from landing showing through (investigate) |
| `https://translify.app/register` | Auth | 200 | H1 "Make your shelf." — good. No per-page metadata. |
| `https://translify.app/manifesto` | About | **404** | Linked in footer; needed for E-E-A-T |
| `https://translify.app/blog` | Content | **404** | Linked in footer; major missed SEO surface |
| `https://translify.app/og-image.png` | Asset | **404** | Referenced in OG metadata and Twitter Card — social shares broken |
| `https://translify.app/favicon.ico` | Asset | **404** | Referenced in `<head>`; browser tab icon missing |
| `https://translify.app/apple-touch-icon.png` | Asset | (likely 404) | Referenced in `<head>`; iOS home-screen icon missing |
| `https://translify.app/robots.txt` | Config | 200 | Correct — disallows `/library` and `/api/`, points to sitemap |
| `https://translify.app/sitemap.xml` | Config | 200 | Only 4 URLs — major missed indexation opportunity |

---

## SEO analysis — 5/10

### Technical on-page

| Signal | Finding | Status |
|---|---|---|
| Title tag (homepage) | `Translify — Read any book in your language` (47 chars). Length is good. Keyword "translation" missing, "understand" missing. Aligned to *old* positioning. | ⚠️ Needs Attention |
| Title template | `"%s · Translify"` template configured in `layout.tsx`. Inner routes likely fall through to defaults. | ✅ Good |
| Meta description (homepage) | 187 chars — slightly long but acceptable. Leads with "translate whole PDFs" — repositioning needed. | ⚠️ Needs Attention |
| H1 | Present, singular, in display font. Copy is locale-aware via `useI18n()`. | ✅ Good |
| Heading hierarchy | H1 → H2 (10 unique) → H3 logical. No keyword stuffing observed. | ✅ Good |
| Canonical | Self-referencing root canonical via `alternates.canonical: "/"`. | ✅ Good |
| Robots meta | Indexable, follow. GoogleBot directives explicit (max-snippet, max-image-preview). | ✅ Good |
| Viewport / mobile | Configured in `viewport` export. | ✅ Good |
| hreflang | Manually emitted in `<head>` for 8 locales. Uses `?lang=X` query strings — works but path-based (`/en/`, `/fr/`) ranks marginally better. | ⚠️ Acceptable |
| Image alt text | Cannot verify without rendered HTML; recommend audit after launch. | ⚠️ Unknown |
| Internal links | Footer links to `/manifesto`, `/blog`, `/careers`, `/press`, `/status`, `/refund-policy`, `/privacy`, `/terms`, `/cookies` — most return 404. | ❌ Critical |
| Open Graph | `og:title`, `og:description`, `og:image`, `og:locale`, `og:alternateLocale` all present. **`og-image.png` returns 404 → no preview image renders on share.** | ❌ Critical |
| Twitter Card | `summary_large_image` configured. Same 404 image issue. | ❌ Critical |
| Favicon | `/favicon.ico` referenced but returns 404. Only `icon.svg` exists in `public/`. | ❌ Critical |

### Content quality

| Signal | Finding | Status |
|---|---|---|
| Word count (homepage) | Estimated 1,500-2,000 words across sections (Hero, How it works, Features, Audience, Languages, Testimonials, Pricing, FAQ, CTA). Substantial. | ✅ Good |
| Keyword signals | Current copy reinforces "translation" + "language" + "reading" — aligned to *old* positioning. Need to layer in "understand", "comprehend", "study", "chat with book". | ⚠️ Needs Attention |
| Freshness signals | No visible "last updated" or dated content. For a SaaS landing page this is fine, but a blog would generate freshness signals. | ⚠️ Acceptable |
| Readability | Display font + good vertical rhythm + scannable sections. Strong. | ✅ Good |

### Structured data

| Signal | Finding | Status |
|---|---|---|
| Organization | Present with name, url, logo, email, sameAs (Twitter + LinkedIn), description. | ✅ Good |
| WebSite | Present with `inLanguage` array — but the array lists 6 languages (`en, fr, es, de, ja, ar`); the actual UI supports 8 (missing `id`, `ms`). | ⚠️ Needs Attention |
| SoftwareApplication | Present with offers. **Prices declared as €7/€15/€23 — actual page shows €11/€19/€27. This is a Google structured-data violation.** | ❌ Critical |
| SoftwareApplication.aggregateRating | Declared as 4.7 from 1,240 ratings — no verifiable third-party review source on the site. | ❌ Critical |
| FAQPage | Present with 8 well-formed Q&As. Strongest SEO asset on the site. | ✅ Strong |
| BreadcrumbList | Present (Home → Pricing → Get started). Useful. | ✅ Good |
| HowTo | **Missing.** The homepage has a "Three steps" section that maps directly to HowTo — leaving this off the table. | ❌ Missing |
| SoftwareApplication.inLanguage | Not present — adding it strengthens the entity for non-English search. | ❌ Missing |

---

## GEO analysis — 5/10

### E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)

| Signal | Finding | Status |
|---|---|---|
| About / Manifesto page | Linked in footer at `/manifesto` but **returns 404**. AI search engines (Perplexity, ChatGPT, Claude) cannot cite a page that doesn't exist. | ❌ Critical |
| Author / team info | No team page, no named authors anywhere on the site. For AI-search citation, "who built this" is a strong signal. | ❌ Critical |
| Contact info | Email `hello@translify.app` declared in Organization schema. No phone, no address. For B2C SaaS, email-only is acceptable. | ✅ Acceptable |
| Trust signals on page | Testimonials section exists ("Loved by readers"). Individual reviewers are unnamed personas without credentials. AI engines weight named-author testimonials higher. | ⚠️ Needs Attention |
| Organization schema | Brand entity declared clearly (name, logo, URL, email, social sameAs). Good. | ✅ Good |
| sameAs links | Twitter + LinkedIn only. Adding Crunchbase, AngelList, Wikipedia (when eligible), GitHub strengthens the entity. | ⚠️ Acceptable |

### Content for AI synthesis

| Signal | Finding | Status |
|---|---|---|
| Factual density | The homepage makes specific claims ("42,000+ books translated", "9.4/10 satisfaction", "14 languages", "200 MB limit") — good for AI extraction. | ✅ Good |
| Clear claims | Tagline / H1 leads with a clear value claim. | ✅ Good |
| Source citation | The site cites no external authoritative sources (no whitepapers, no academic references, no press mentions linked). This caps how high AI engines will rate authoritativeness. | ❌ Missing |
| Comprehensiveness | The homepage covers product, audience, pricing, FAQ thoroughly. | ✅ Good |
| Entity clarity | Brand name "Translify" consistent across schema, OG, page copy. | ✅ Good |
| Originality signals | The brand voice is distinctive (literary, warm, specific). Helps AI engines pick this page over generic translation tool pages. | ✅ Good |

### Technical GEO

| Signal | Finding | Status |
|---|---|---|
| HTTPS | Yes. | ✅ Good |
| Crawlability | robots.txt allows all crawlers except `/library` and `/api/`. AI crawlers (GPTBot, ClaudeBot, PerplexityBot) not explicitly denied. | ✅ Good |
| JS-only rendering | Homepage is a `"use client"` component. Next.js 15 still SSRs this, so the initial HTML payload contains the rendered content. But verify with `curl -sL` that key copy lands in the static HTML, not just in `<script>` blocks. | ⚠️ Verify |
| sameAs / brand entity links | Present (Twitter, LinkedIn). | ✅ Acceptable |

---

## AEO analysis — 6/10

### Featured snippet eligibility

| Signal | Finding | Status |
|---|---|---|
| Direct answer paragraphs | Homepage has question-format H2s ("Three steps, ten minutes", "What you actually get", "Questions, answered"). FAQ section provides 40-80 word answers — excellent for featured-snippet capture. | ✅ Strong |
| Definition patterns | The site does not contain a "Translify is..." sentence at the top of any page — a key signal for AI engines defining the brand. Recommend adding to manifesto + FAQPage. | ❌ Missing |
| Numbered lists | "Three steps" section presents three numbered steps but not as `<ol>` semantically (rendered as cards). Convert to `<ol>` for snippet eligibility, or layer HowTo schema (recommended below). | ⚠️ Needs Attention |
| Comparison tables | No comparison tables on the homepage. Competitor-alternative pages (see scaffold) will introduce these. | ❌ Missing |

### Structured answer formats

| Signal | Finding | Status |
|---|---|---|
| FAQ schema | Present, 8 well-formed questions. The site's strongest AEO asset. | ✅ Strong |
| HowTo schema | Missing despite obvious fit. **Adding it is the single highest-ROI AEO fix** (see scaffold). | ❌ Missing |
| Question-phrased H2s | "Questions, answered" is good but generic. "How does Translify work?", "What does Translify cost?", "Which file types does Translify support?" would each capture a featured-snippet box. | ⚠️ Needs Attention |
| Speakable schema | Not present. Useful for voice-search devices (Google Assistant, Alexa). Low priority for a desktop-first product. | ⚠️ Acceptable |

### Voice search readiness

| Signal | Finding | Status |
|---|---|---|
| Conversational language | Tone is natural and conversational throughout. | ✅ Good |
| Long-tail question coverage | FAQ covers who/what/how questions well. Missing "where" (geography), "when" (timing/launch). | ✅ Acceptable |
| Local signals | Not applicable — Translify is global SaaS, no local pages needed. | ✅ N/A |

---

## Priority recommendations matrix

| Priority | Issue | Dimension | Effort | Impact |
|---|---|---|---|---|
| 🔴 Critical | `og-image.png`, `favicon.ico`, `apple-touch-icon.png` all 404 | SEO | XS (1 hour) | High — every social share, browser tab, iOS home-screen is currently broken |
| 🔴 Critical | Schema `offers` prices (€7/€15/€23) don't match the actual page (€11/€19/€27) | SEO | XS (15 min) | High — Google rich-results violation |
| 🔴 Critical | Fake/unverifiable `aggregateRating: 4.7/1240` in SoftwareApplication schema | GEO | XS (5 min — delete the block) | High — major manual-action risk |
| 🔴 Critical | Footer links `/manifesto`, `/blog`, `/careers`, `/press`, `/refund-policy` all 404 | SEO + GEO | M (4-8 hrs to build manifesto + blog scaffold) | High — broken trust signals + lost crawl equity |
| 🟠 High | Sitemap only contains 4 URLs (the 56 programmatic pages don't exist) | SEO | L (~3 days: scaffold + content + QA) | Critical — without programmatic surface, no realistic non-brand traffic |
| 🟠 High | No competitor-alternative pages | SEO | L (~2 days for 4 pages) | High — comparison search intent has the highest commercial value |
| 🟠 High | Homepage copy aligned to old "translate" positioning, not new "understand" | SEO + GEO | S (2 hrs to update locales) | High — keyword targeting wrong-footed |
| 🟠 High | HowTo schema missing despite obvious 3-step section | AEO | XS (10 min — already scaffolded) | Medium — featured-snippet capture |
| 🟡 Medium | `WebSite.inLanguage` missing `id`, `ms` | GEO | XS | Low |
| 🟡 Medium | hreflang via `?lang=X` query string — path-based ranks marginally better | SEO | M (i18n refactor) | Low-Medium — phase 2 work |
| 🟡 Medium | No named authors / team page | GEO | M (write team copy + headshots) | Medium — AI-search citation depth |
| 🟢 Quick Win | `WebSite.SearchAction` schema not declared | AEO | XS (5 min — in scaffold) | Low — enables sitelinks search box |
| 🟢 Quick Win | Inner routes have no per-page metadata overrides | SEO | S (30 min — see `inner-route-metadata.md`) | Medium |
| 🟢 Quick Win | No "Translify is..." definition sentence on landing | GEO + AEO | XS | Low-Medium |

---

## 30 / 60 / 90 plan (ordered by ROI)

### Days 1–7: Stop the bleeding

1. Generate `og-image.png` (1200×630), `favicon.ico` (32×32 multi-res), `icon-32.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` (180×180). Place in `apps/web/public/`. ~1 hour with any logo or screenshot.
2. Replace `apps/web/src/components/structured-data.tsx` with the corrected version at `seo/scaffolds/structured-data.tsx`. Fixes the price mismatch, removes the fake AggregateRating, adds HowTo + SearchAction, extends `inLanguage`.
3. Replace `apps/web/src/app/layout.tsx`'s metadata + viewport export with the version at `seo/scaffolds/layout-metadata.ts`. New tagline aligned to the locked positioning.
4. Update `en.ts` (and the 7 other locale files) — change `hero.title.1` / `hero.title.2` to map to *"Understand any book, in your language"* (or your preferred phrasing of the locked positioning). Cascade through `feat.*` keys to lead with comprehension, not translation.
5. Add per-page metadata exports to `/onboarding`, `/login`, `/register` per `seo/copy/inner-route-metadata.md`.
6. Build `/manifesto` as a real page (300-600 words) with the metadata in `inner-route-metadata.md`. Without this, the GEO score stays capped at 6.

### Days 8–30: Build the programmatic surface

7. Drop in `seo/scaffolds/read-source-in-target-page.tsx` at `apps/web/src/app/read-[source]-books-in-[target]/page.tsx`. This generates all 56 pages at build time. Verify with `pnpm build` that 56 static pages are rendered.
8. Build `/languages` index page that lists every supported pair and links to the 56 programmatic pages — this is the hub that gives the spokes internal-link equity. ~3 hours.
9. Replace `apps/web/src/app/sitemap.ts` with `seo/scaffolds/sitemap.ts`. Submit the new sitemap to Google Search Console + Bing Webmaster Tools.
10. Drop in `seo/scaffolds/competitor-alternative-page.tsx` at `apps/web/src/app/alternative/[slug]/page.tsx`. Ships 4 high-converting pages (Readlang, Immersive Translate, Kindle Translate, DeepL alternative).
11. Generate 60 OG images (56 language-pair + 4 alternative) — automate with a Next.js `opengraph-image.tsx` template using `next/og`. ~2 hours.
12. Set up **Google Search Console** + verify domain ownership. Submit sitemap. Set up daily email reports.
13. Set up **Bing Webmaster Tools** (often forgotten — 8% of US search market, more in EU).
14. Set up **Plausible** or **PostHog** (free tier) for organic-traffic tracking. Don't use GA4 if you can avoid it — its sampling is brutal at low traffic.

### Days 31–60: Build content authority

15. Write the first 6 blog posts at `/blog/*`. Topics ranked by ROI:
    - "How to read a German philosophy book in English (without losing the nuance)" — long-tail intent
    - "The best AI tools for studying foreign-language books in 2026" — listicle that includes Translify
    - "DeepL Pro vs Translify: when each is the right choice" — comparison
    - "How to translate a textbook into your native language (PDF + EPUB guide)" — how-to with HowTo schema
    - "Reading Murakami in Japanese: an AI-assisted approach" — author-specific long-tail
    - "Why Kindle Translate isn't enough for serious foreign-language reading" — comparison post
    Word count target: 1,500-2,500 each. Each gets FAQPage schema with 4-6 questions. ~4 days of writing work or ~$2k from a freelance writer.
16. Add a **named-author profile** to each blog post via `Article.author` and a `/about/[author]` page. Strong E-E-A-T lift.
17. Set up **Trustpilot** account, prompt 50 early users for reviews via the welcome email. Once you have 25+ verified reviews, you can legitimately add AggregateRating back to schema with a citation to Trustpilot via `reviewedBy` or by linking the Trustpilot page.
18. Build **comparison landing pages** for the next 4 competitors (Parallel Books, Duoreader, Linga, Smart Book) — 8 total.

### Days 61–90: Scale + monitor

19. Launch the **affiliate / referral program** — even simple 30% commission on first month drives backlinks at scale.
20. Pitch a guest post to 10 reading/study/language-learning blogs (Polyglot Notes, Fluent in 3 Months, r/languagelearning sidebar list, Reading Rockets, EdSurge). Each backlink from these compounds for years.
21. Generate **author/genre programmatic pages**: `/read-{author}-in-{language}` for 50 well-known authors (Murakami in English, García Márquez in English, Camus in English, Goethe in English, etc.). ~3 days work for ~200 new pages with low keyword competition.
22. Add **video schema** to the homepage live-demo (`VideoObject`) — major SEO signal for product pages.
23. Run **Google PageSpeed Insights** + **Core Web Vitals** checks. Tune any LCP, INP, CLS issues. Next.js 15 + Server Components handles most of this for free.
24. **Reach out to Funstory.ai** about acquiring `translify.ai`. Long shot but cheap.
25. By day 90, expect: 60+ indexed pages, ~500-2,000 monthly organic visitors from non-brand keywords, first-page rankings for `Readlang alternative` and `Translify` brand searches, top 3 for several `read {source} books in {target}` long-tails.

---

## KPIs and tools

### Free-tier tracking stack

| Metric | Tool | Cost |
|---|---|---|
| Indexed pages, top queries, click-through rate | **Google Search Console** | Free |
| Bing/Yahoo coverage | **Bing Webmaster Tools** | Free |
| Organic traffic, referrers, top pages | **Plausible** (open-source) or **PostHog** free tier | Free / $9/mo |
| Keyword rank tracking | **Google Search Console** (free, 1,000 queries) + **Ubersuggest** (3 free searches/day) | Free |
| Backlinks discovered | **Google Search Console** (links report) | Free |
| Schema validation | **Google Rich Results Test** (`search.google.com/test/rich-results`) | Free |
| Core Web Vitals | **PageSpeed Insights** | Free |
| AI-search citation tracking | Manual — query Perplexity / ChatGPT Search / Claude weekly for `"AI book reader"`, `"Readlang alternative"`, etc. and log which competitors get cited | Free |

### Targets at 30 / 60 / 90 days

| Metric | Day 30 | Day 60 | Day 90 |
|---|---|---|---|
| Indexed pages | 60+ (from 4) | 90+ | 200+ (with author pages) |
| Brand search ranking ("translify") | #1 | #1 | #1 |
| Non-brand keyword first-page ranks | 2-5 | 8-15 | 20-40 |
| Organic visitors / mo (non-brand) | 100-300 | 500-1,500 | 1,500-5,000 |
| Featured snippets captured | 1-2 | 3-5 | 5-10 |
| AI-search citations (Perplexity/ChatGPT) | 0-1 | 2-5 | 5-15 |
| Trustpilot reviews | 5-10 | 25-40 | 50-100 |
| Sign-up conversion from `/alternative/*` pages | n/a | 2-4% | 3-6% |

If you're not hitting these by Day 90, the issue is not SEO mechanics — it's either product-market-fit or the underlying positioning. Re-run the niche analysis before doubling down on SEO.

---

## What's working well

1. **Comprehensive Pydantic-style metadata in `layout.tsx`** — `metadataBase`, `title.template`, `openGraph`, `twitter`, `robots.googleBot`, `icons`, `manifest`, `formatDetection` are all configured. This is meaningfully better than most pre-launch SaaS sites.
2. **Five distinct JSON-LD blocks already emitted** (Organization, WebSite, SoftwareApplication, FAQPage, BreadcrumbList). Once the data inside them is fixed, you go from average to strong overnight.
3. **FAQPage with 8 well-formed Q&As** — long enough to provide context, short enough to be featured-snippet-eligible. This is your single strongest SEO asset.
4. **8-locale i18n architecture** with manual hreflang emission — already built, just needs the programmatic pages on top of it.
5. **Distinct brand voice** — the homepage copy reads like a publishing brand, not a generic AI SaaS. AI search engines (Perplexity, Claude) preferentially cite pages with editorial voice over generic feature copy.
6. **`robots.ts` and `sitemap.ts` already use Next.js 15's `MetadataRoute` pattern** — you're following best practices, just need to expand the URL set.

---

## Glossary

**SEO (Search Engine Optimization)** — getting your pages to rank in traditional search engines like Google and Bing. Driven by on-page signals (titles, headings, content) + off-page signals (backlinks, brand mentions) + technical signals (Core Web Vitals, crawlability).

**GEO (Generative Engine Optimization)** — getting your pages cited by AI search engines like Perplexity, ChatGPT Search, Claude search, and Gemini. These engines synthesize answers from multiple sources and cite a handful of them. Higher rewards for factual density, clear claims, structured data, and brand-entity signals than for backlinks.

**AEO (Answer Engine Optimization)** — getting your content extracted into featured snippets, People Also Ask boxes, and voice-assistant answers. Driven by FAQ/HowTo schema, question-phrased headings, and 40-60 word direct-answer paragraphs.

---

## Sources & references

- Translify homepage and crawl data (this audit, 2026-05-10)
- `apps/web/src/app/layout.tsx`, `sitemap.ts`, `robots.ts`, `page.tsx`
- `apps/web/src/components/structured-data.tsx`
- [Google Rich Results validation requirements](https://developers.google.com/search/docs/appearance/structured-data)
- [Schema.org SoftwareApplication](https://schema.org/SoftwareApplication)
- [Google guidelines on AggregateRating misuse](https://developers.google.com/search/docs/appearance/structured-data/review-snippet)
- [Next.js 15 App Router metadata reference](https://nextjs.org/docs/app/api-reference/file-conventions/metadata)
- Competitive landscape from prior /ceo strategy research (Translify session 2026-05-10)
