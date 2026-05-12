import type { Metadata } from "next";
import Link from "next/link";
import { BlogShell, H2, H3, Lead, Quote } from "../_shell";
import { findPost } from "../_posts";

const post = findPost("learn-language-by-reading-books-ai")!;
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";

export const metadata: Metadata = {
  title: post.title,
  description: post.description,
  alternates: { canonical: `/blog/${post.slug}` },
  openGraph: {
    type: "article",
    title: post.title,
    description: post.description,
    url: `${SITE}/blog/${post.slug}`,
    publishedTime: post.publishedAt,
    tags: post.tags,
  },
  twitter: {
    card: "summary_large_image",
    title: post.title,
    description: post.description,
  },
};

const faqs = [
  {
    q: "Can you really learn a language by reading books?",
    a: "Yes — reading is one of the most efficient inputs for language acquisition once you're past beginner level. Stephen Krashen's input hypothesis (1980s) and decades of subsequent SLA research support it: comprehensible input drives vocabulary growth and grammatical intuition faster than most other methods. The catch is 'comprehensible' — reading material 5 levels above your competence doesn't teach you anything. The trick is choosing books at the right level, or using AI assistance to make a too-hard book accessible.",
  },
  {
    q: "What level do I need to start reading books in a foreign language?",
    a: "Roughly A2 for graded readers (simplified texts written for learners), B1 for accessible adult fiction (Camus, Sagan, Cabré), B2 for most contemporary literary fiction, C1 for classic literature and difficult modern prose. Below A2, books are too hard even with AI assistance — vocabulary lookups exceed reading and the activity stops being reading. Stick with graded readers and short articles until A2.",
  },
  {
    q: "Should I look up every word I don't know?",
    a: "No. Looking up every word breaks reading flow and is the main reason people abandon reading-based learning. The standard recommendation: skip 80% of unknowns and look up 20% — the words that appear multiple times, the words blocking comprehension of the sentence, and the words that look interesting. Most words you skip you'll encounter again; meaning will accrete from context.",
  },
  {
    q: "How does AI-assisted reading compare to Anki or Duolingo for vocabulary?",
    a: "Different mechanisms. Anki teaches isolated words via spaced repetition — efficient for the words you choose to study but limited to those words. Duolingo teaches a controlled vocabulary in context — good for beginners, hits a ceiling around A2-B1. Reading exposes you to the actual distribution of vocabulary in the language and trains comprehension at the sentence level. The best approach is usually combined: read for breadth and grammar-in-context; Anki the highest-frequency words you encounter.",
  },
  {
    q: "How long until I can read a real novel in the target language?",
    a: "From zero to B1 reading: roughly 600 hours for a Romance language (Spanish, French, Italian, Portuguese), 800 hours for German, 1,200 hours for Russian or Japanese. At 1 hour/day, that's 1.5-3 years to B1. From B1 to comfortable adult-fiction reading (B2): another 300-500 hours. AI-assisted reading can accelerate the B1→B2 transition because it makes harder books accessible earlier.",
  },
  {
    q: "What's the right book to start with at B1 level?",
    a: "Short, contemporary, narrative-driven. For French: Camus's L'Étranger, Sagan's Bonjour Tristesse. For Spanish: Cabré's Yo confieso (long but accessible), Almudena Grandes's short stories. For German: Schlink's Der Vorleser, Süskind's Das Parfum. For Italian: Calvino's Le città invisibili. Avoid: any author known for difficult prose (Proust, Tolstoy, Mann, Borges) until B2+.",
  },
  {
    q: "Is AI translation 'cheating' for language learning?",
    a: "Translation isn't cheating; over-translation is. Looking up words and phrases you don't know is normal reading behavior in a foreign language. Translating every sentence into English and reading the English defeats the purpose. The boundary is roughly: translate to unblock specific comprehension problems, not to skip the work of reading the target language.",
  },
];

export default function Page() {
  return (
    <BlogShell post={post} faqs={faqs}>
      <Lead>
        Reading books is the highest-leverage input for language acquisition
        past beginner level, and the second-most-common point of failure for
        self-directed learners (after speaking practice). The failure mode is
        consistent: pick a book too hard, look up every word, lose patience,
        stop. AI-assisted reading addresses the difficulty problem without
        producing the lookup tax. This is a realistic six-month plan for using
        it to move from A2/B1 to comfortable adult-fiction reading.
      </Lead>

      <H2>Why reading works for language learning</H2>

      <p>
        Comprehensible input — text or speech you can mostly understand — is
        the strongest known driver of vocabulary growth and grammatical
        intuition. The mechanism is straightforward: when you encounter a
        word in three different sentences, you triangulate its meaning;
        when you encounter a grammar pattern in twenty different
        constructions, it stops feeling like grammar and starts feeling like
        the natural way to say things. Reading delivers high input density
        at low cost.
      </p>

      <p>
        The bottleneck has always been finding material at the right level.
        Graded readers (texts simplified for learners) cover A1-B1 reasonably
        well; native-target fiction is mostly B2+. The gap between B1 graded
        readers and B2 native fiction is where most learners stall. AI
        assistance closes this gap by making B2 material accessible earlier
        than it would otherwise be.
      </p>

      <H2>Choosing the right book for your level</H2>

      <H3>A2 → B1 (early intermediate)</H3>

      <p>
        Stick with graded readers and short-form material. Penguin Active
        Readers, Klett Verlag's <em>Leichte Literatur</em>, and the
        Olly Richards series (<em>Short Stories in Spanish</em> etc.) cover
        most major languages at this level.
      </p>

      <p>
        Avoid: Twitter feeds, song lyrics, and chat transcripts. These
        contain too much slang and idiom for the level. They feel accessible
        because they're short, but they're often harder than literary
        prose.
      </p>

      <H3>B1 (intermediate)</H3>

      <p>
        Real adult fiction becomes feasible — short, contemporary, narrative-
        driven works. The standard recommendations for B1 reading:
      </p>

      <ul className="!my-4 list-disc space-y-2 pl-6">
        <li>
          <strong>Spanish</strong>: Almudena Grandes (short stories), Carmen
          Laforet (<em>Nada</em>), Mario Vargas Llosa (early works only).
        </li>
        <li>
          <strong>French</strong>: Albert Camus (<em>L'Étranger</em>), Françoise
          Sagan, Patrick Modiano.
        </li>
        <li>
          <strong>German</strong>: Bernhard Schlink (<em>Der Vorleser</em>),
          Patrick Süskind (<em>Das Parfum</em>), Hermann Hesse (<em>Demian</em>,
          <em>Siddhartha</em>).
        </li>
        <li>
          <strong>Italian</strong>: Italo Calvino (<em>Le città invisibili</em>),
          Niccolò Ammaniti (<em>Io non ho paura</em>).
        </li>
        <li>
          <strong>Russian</strong>: Chekhov short stories, Pelevin
          (<em>Omon Ra</em>).
        </li>
        <li>
          <strong>Japanese</strong>: Banana Yoshimoto (<em>Kitchen</em>),
          Sayaka Murata (<em>Konbini Ningen</em>).
        </li>
      </ul>

      <p>
        With AI assistance, B1 readers can also approach B2 books — see
        below.
      </p>

      <H3>B2 (upper intermediate)</H3>

      <p>
        Most contemporary literary fiction is feasible. The barriers shift
        from vocabulary to register and cultural reference. AI assistance
        helps with both.
      </p>

      <H3>C1+ (advanced)</H3>

      <p>
        Classic literature, difficult contemporary prose, and academic
        writing. At this level, AI is useful for occasional gloss but the
        reading is doing most of the work.
      </p>

      <H2>How to read with AI assistance</H2>

      <p>
        The mechanics of AI-assisted reading are the same across most tools.
        Open the book in a reader that allows highlighting and asking
        questions. Read at your normal target-language pace. When you hit
        something you can't parse, highlight it and ask.
      </p>

      <p>
        Four useful question types:
      </p>

      <ul className="!my-4 list-disc space-y-2 pl-6">
        <li>
          <em>What does this word mean here?</em> Better than a dictionary
          because the AI uses the surrounding context to pick the right sense.
        </li>
        <li>
          <em>What's the grammatical structure of this sentence?</em> Useful
          for B1-B2 learners encountering subjunctive, conditional, or
          syntactically complex constructions.
        </li>
        <li>
          <em>Translate this paragraph.</em> Use sparingly — the goal is to
          read the target language, not the English. Reserve this for
          passages where you genuinely can't extract meaning otherwise.
        </li>
        <li>
          <em>What's the cultural reference here?</em> For passages that
          assume context (a Spanish historical figure, a French political
          movement, a Japanese cultural practice).
        </li>
      </ul>

      <p>
        The first question should be the most common. The third the least.
      </p>

      <H2>Vocabulary capture</H2>

      <p>
        Reading alone teaches vocabulary, but slowly. Adding spaced repetition
        for the highest-frequency unknowns you encounter accelerates retention
        dramatically.
      </p>

      <p>
        The standard workflow:
      </p>

      <ul className="!my-4 list-disc space-y-2 pl-6">
        <li>
          Read for an hour. Mark unknown words but don't break flow to study
          them.
        </li>
        <li>
          After reading, review marked words. Keep the ones that look
          high-frequency or generally useful; discard rare or domain-specific
          terms.
        </li>
        <li>
          Make Anki cards (or equivalent) for the kept words. Include the
          sentence you encountered them in — context aids retention.
        </li>
        <li>
          Review the cards daily. Spaced repetition does the rest.
        </li>
      </ul>

      <p>
        Some tools (Translify, Readlang) automate the capture step — you
        click a word, it goes into a study queue with its context. This is
        meaningfully faster than manual Anki entry and most learners stick
        with it where they wouldn't with manual entry.
      </p>

      <H2>A six-month reading plan (B1 → B2)</H2>

      <p>
        This assumes you start at solid B1 reading (you can finish a Camus
        novel with effort) and want to get to comfortable B2 (you can read
        contemporary literary fiction without breaks for translation).
      </p>

      <H3>Months 1-2: Volume</H3>

      <p>
        Goal: 4-5 short novels at B1 level. Don't worry about difficulty;
        build the habit of reading consistently in the target language.
        30-45 minutes per day, daily. AI-assisted lookup as needed but
        without over-translating.
      </p>

      <H3>Months 3-4: Difficulty ramp</H3>

      <p>
        Goal: 2-3 B1/B2 books with more challenging prose or longer length.
        Begin systematic vocabulary capture — Anki the 10-20 highest-frequency
        unknown words per session. Aim for 60-minute reading sessions.
      </p>

      <H3>Months 5-6: B2 immersion</H3>

      <p>
        Goal: one full literary novel at B2 level. Pick something you
        actually want to read in the target language, not a learner-chosen
        easier book. AI assistance for the genuinely difficult passages;
        push through the merely hard ones.
      </p>

      <p>
        At month six, test by picking up a B2 book without AI assistance.
        If you can read a chapter with occasional dictionary lookups but
        without losing comprehension flow, you've moved to B2 reading.
      </p>

      <H2>Common failure modes</H2>

      <p>
        <strong>Picking a book that's too hard.</strong> The most common
        failure. Tolstoy in Russian at B1 is impossible even with AI; you
        spend more time translating than reading. Stick to the level
        recommendations above for the first few books.
      </p>

      <p>
        <strong>Over-translating.</strong> Translating every sentence to
        English defeats the point. The goal is reading the target language;
        AI is for unblocking comprehension, not for skipping the work.
      </p>

      <p>
        <strong>Inconsistent practice.</strong> Reading for two hours on
        weekends works less well than 30 minutes daily. Language acquisition
        benefits from frequency; long gaps between sessions cause
        forgetting that gradual study avoids.
      </p>

      <p>
        <strong>No vocabulary capture.</strong> Pure reading without spaced
        repetition is fine but slow. Adding 15 minutes of Anki review per
        day roughly doubles vocabulary retention from reading.
      </p>

      <p>
        <strong>Skipping audio.</strong> Reading without ever hearing the
        language produces readers who can't speak. The AI-assisted reading
        plan above pairs naturally with the audiobook (where available) for
        the same text — read for vocabulary and grammar, listen for
        pronunciation and rhythm.
      </p>

      <Quote>
        Translify supports reading-based language learning with{" "}
        <Link href="/onboarding" className="underline decoration-[color:var(--color-saffron)] not-italic">
          highlight-and-ask vocabulary capture, in-book quizzes, and parallel
          translation
        </Link>
        . Free 14-day trial.
      </Quote>
    </BlogShell>
  );
}
