---
register: brand
---

# Translify

## Product purpose

An AI reader for PDFs and EPUBs. Drop in a book, then **chat with it like a tutor that has read every page**, **quiz yourself before exams**, and read it in any of 14 languages with layout preserved.

The category Translify lives in is not "translation". DeepL translates a paragraph. ChatGPT hallucinates sources. Anki tests cards you wrote yourself. Translify rebuilds the whole book, lets you talk to it with cited answers, and generates quizzes from what you actually read.

## Users

Three concrete audiences, ranked by retention value:

1. **Students** (university + serious self-learners). Coursebooks and papers in languages they read more slowly than they think in. Highest payoff per book; the AI quiz + cited chat is what closes the upgrade.
2. **Lifelong polyglot readers**. Have always wanted to finish that French novel. Want to read a Japanese manga at their own pace. Care about layout fidelity (page numbers, footnotes, illustrations stay where they should).
3. **Families** (parent + kids). Kid-safe chat mode, parent dashboard, shared family library. Lower volume but higher retention.

What unifies them: they're *not* trying to learn a language as a goal. They're trying to **read a specific book** and the language is in the way.

## Brand voice

- Warm, paper-like, Duolingo-playful in micro-interactions but adult in copy.
- Concrete verbs. No "elevate", "unleash", "seamless".
- Bilingual moments are the visual signature: source language and target language side by side.
- Lumi (the mascot) is present but quiet. It is not the protagonist; the book is.

## Anti-references

What Translify is NOT:

- **DeepL / Google Translate**: pasted-paragraph tools. We rebuild whole books.
- **ChatGPT / Claude in a tab**: ungrounded chat with no citations. Every Translify answer cites the page.
- **Goodreads**: a social-first reading network that mostly catalogs books you read elsewhere. Translify is where you read them.
- **Anki**: a flashcard tool you fill by hand. Translify's quizzes come from passages you actually read.
- **Duolingo**: language-learning gamification with no real reading. Translify is reading-first; gamification (garden, streaks) is in service of the book.

## Strategic principles

1. **The book is the product**. Every social, gamification, and AI feature exists to make finishing the book more likely.
2. **Citation is the moat**. Every assertion the AI makes links to the exact page. This is what differentiates Translify from chatbots and we should never compromise on it.
3. **Layout fidelity is the second moat**. Tables stay tables, footnotes stay footnotes, RTL stays RTL. This is what differentiates Translify from "AI translation" tools.
4. **Free entry, no card**. Anonymous-first activation via `/join`. Visitors get into the seed library inside 30 seconds without an email. We earn the upgrade.
5. **Bilingual artifacts > monolingual ones**. When we share, when we generate cards, when we render passages: both languages visible. That's the brand.

## Surfaces

| Surface | Job |
|---|---|
| `/` | Conversion landing. Leads with "talk to it, quiz it, then translate it." |
| `/join` | Activation funnel. No-auth seed shelf, anonymous JWT minted on tap. |
| `/pricing` | Honest pricing with comparison anchor (vs DeepL / ChatGPT / Anki). |
| `/onboarding` | Post-signup wizard. 4 steps: persona, language, plan reveal, signup. |
| `/library` | Logged-in book shelf. Continue reading, folders, uploads. |
| `/read/[book]` | The reader. PDF or EPUB rebuilt in target language, with highlights, chat, quiz. |
| `/garden` | Per-book gamification: a plant grows with reading + quiz + translate events. |
| `/account` | Subscription, profile, language, family-safe mode. |
| `/blog`, `/manifesto`, `/languages`, `/alternative`, `/contact` | Brand / SEO surfaces. |
| (planned) `/@username`, `/p/<slug>`, `/feed`, `/discover` | Social layer. Sentence + word + milestone posts. |

## Tone of micro-copy

- "Save a book" not "Add to library".
- "Chat with it" not "Ask AI".
- "Pages" everywhere, never "tokens".
- Numbers in plain English where possible: "ten pages free", not "10 / month rate-limited".
- Money-back guarantee always with no card, no friction, no forms.

## What this project will not become

- A book *store*. We don't sell content.
- A social network *first*. The social layer (in build) is a sharing artifact for readers, not a graph for follower-counters.
- A language *school*. No structured lessons. Books are the curriculum.

## Notes on stack (for designers)

- Next.js 15 App Router. Tailwind v4. Motion (`motion/react`) for client motion.
- Warm-paper palette in `globals.css` via OKLCH-ready hex tokens. Saffron is the singular accent.
- All animations gate behind `prefers-reduced-motion` (see `globals.css`).
- Em-dashes are banned in user-visible copy (Pre-Flight rule; en.ts swept).
- Headers across marketing surfaces use the shared `<MarketingHeader />` component.

---

*Draft from session context. Edit as the product evolves. Run `/impeccable teach` to redo this guided.*
