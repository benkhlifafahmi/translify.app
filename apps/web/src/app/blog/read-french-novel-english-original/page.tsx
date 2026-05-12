import type { Metadata } from "next";
import Link from "next/link";
import { BlogShell, H2, H3, Lead, Quote } from "../_shell";
import { findPost } from "../_posts";

const post = findPost("read-french-novel-english-original")!;
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
    q: "Which English translation of Proust should I read?",
    a: "The Moncrieff/Kilmartin/Enright revision (Modern Library, 1992) is the standard. The newer Penguin edition uses different translators for each volume — Lydia Davis for Swann's Way is justly celebrated; the rest of the volumes vary. If you only read one, start with the Modern Library Swann's Way. If you can switch, Davis's Swann is the better introduction.",
  },
  {
    q: "Is Camus easy enough to read in French?",
    a: "L'Étranger is among the easiest French novels for intermediate learners — simple syntax, controlled vocabulary, short sentences. La Peste is harder. La Chute is the hardest of the three. If you're at B1 or above, reading Camus in French with English assistance for the difficult passages is realistic; for Proust or Houellebecq, English-first with French alongside is more practical.",
  },
  {
    q: "What's lost when French is translated into English?",
    a: "Three things: register (French has a sharper formal/informal split that English flattens), wordplay (French puns and false friends don't survive), and rhythm (French sentences carry emphasis through clause order in ways English usually has to compensate for with italics or restructuring). For most novels these losses are minor. For Proust, Flaubert, and Houellebecq they're substantial.",
  },
  {
    q: "Can I read Houellebecq's recent novels in English without losing the satire?",
    a: "Mostly yes — Houellebecq's prose is direct enough that the English (Frank Wynne for most of the recent novels) preserves the tone. What gets lost is the specifically French context: the references to French intellectual debates, political figures, and class signifiers that English readers may not catch. AI assistance handles this well — highlight the reference, ask for context.",
  },
  {
    q: "What about French philosophy — Foucault, Derrida, Beauvoir?",
    a: "French philosophy in translation has all the problems of German philosophy in translation (terminology that doesn't map, sentences that lose their argument) plus the added problem that some French philosophers wrote deliberately untranslatable prose. For Derrida especially, English translation is closer to a working approximation than a faithful rendering. The dual-window setup applies the same way — keep the French accessible.",
  },
  {
    q: "Where do I find free French-language EPUBs of the classics?",
    a: "Everything before 1950 is public domain in France. Project Gutenberg, Wikisource (fr.wikisource.org), and Gallica (the BnF's digital library, gallica.bnf.fr) cover essentially the entire French literary canon. For modern novels under copyright, buy through a French Kindle account or Fnac.com.",
  },
  {
    q: "Is it worth learning French to read Proust in the original?",
    a: "If you're at B2 reading level, yes — Proust in French is one of the few novels where the experience is qualitatively different in the original. If you're starting from zero, the 2-3 years of study required is more than most people will spend on a single author. AI-assisted English reading captures most of the value at much lower cost.",
  },
];

export default function Page() {
  return (
    <BlogShell post={post} faqs={faqs}>
      <Lead>
        French literature translates more cleanly than German philosophy and
        worse than Russian fiction. The plot and the argument come through.
        What gets lost is the register — French distinguishes formal from
        intimate speech more sharply than English does, and the rhythm of a
        French sentence carries information that English has to compensate for
        in other ways. This is a reference guide to reading French novels in
        English while keeping the original within reach for the moments that
        depend on it.
      </Lead>

      <H2>What gets lost when French is translated into English</H2>

      <H3>Register</H3>

      <p>
        French has tu/vous, plus a sharper split between formal vocabulary
        (literary, often Latinate) and everyday vocabulary (Anglo-Norman or
        modern). A character's choice between dire and prononcer, between
        manger and se restaurer, signals class and intent. English translators
        approximate this through word choice — &ldquo;said&rdquo; vs.
        &ldquo;pronounced,&rdquo; &ldquo;ate&rdquo; vs. &ldquo;dined&rdquo; —
        but the layering is less precise than in French. Flaubert and Proust
        rely on this layering heavily; for them, register loss is the main
        translation cost.
      </p>

      <H3>Sentence shape</H3>

      <p>
        French allows long, balanced periodic sentences where clauses sit in
        precise rhythmic relation. Proust is the obvious case — sentences that
        run for half a page and modulate through several emotional registers
        before landing. English translators face the same choice as with
        Russian: preserve the structure (and produce dense English) or break
        it (and lose the build). The Moncrieff translation of Proust preserves
        more of the structure than the Lydia Davis translation; both choices
        are defensible.
      </p>

      <H3>Wordplay and false friends</H3>

      <p>
        French is full of words that look like English but mean something
        different. <em>Actuellement</em> means &ldquo;currently,&rdquo; not
        &ldquo;actually.&rdquo; <em>Éventuellement</em> means
        &ldquo;possibly,&rdquo; not &ldquo;eventually.&rdquo;{" "}
        <em>Demander</em> means &ldquo;to ask,&rdquo; not &ldquo;to
        demand.&rdquo; In dialogue, especially, characters' choices among
        these false friends carry meaning that the English translation has to
        either footnote or paraphrase away.
      </p>

      <H2>Recommended translations</H2>

      <H3>Proust</H3>

      <p>
        For <em>In Search of Lost Time</em>, two options:
      </p>

      <p>
        <strong>Modern Library edition (Moncrieff/Kilmartin/Enright, 1992)</strong>:
        the one continuous English version of all seven volumes. Translated by
        Moncrieff in the 1920s, revised twice — the current revision incorporates
        the corrected French text published by the Pléiade. This is the
        standard.
      </p>

      <p>
        <strong>Penguin edition (multiple translators, 2002–)</strong>: each
        volume has a different translator. Lydia Davis's <em>Swann's Way</em>{" "}
        is widely considered the best single-volume Proust translation. The
        later volumes are uneven; some readers prefer them, others prefer the
        Modern Library throughout for consistency.
      </p>

      <p>
        Whichever you pick, get the French alongside. The Pléiade edition is
        scholarly standard but expensive; the GF Flammarion or Folio
        paperbacks are cheaper and have the same text. Wikisource has the
        whole novel in French for free.
      </p>

      <H3>Flaubert</H3>

      <p>
        <em>Madame Bovary</em>: Lydia Davis (2010, Penguin) is the modern
        standard. Steegmuller (1957) reads more like a novel and is the
        better introduction; Davis is the better second read.
      </p>

      <p>
        <em>Sentimental Education</em>: Robert Baldick (1964, Penguin) or
        Helen Constantine (2016, Oxford). Constantine reads slightly more
        smoothly.
      </p>

      <H3>Camus</H3>

      <p>
        <em>L'Étranger / The Stranger</em>: Matthew Ward (1988) preserves the
        deliberately flat prose Camus chose; the older Stuart Gilbert (1946)
        adds sophistication the French doesn't have. Always go with Ward.
      </p>

      <p>
        <em>La Peste / The Plague</em>: Laura Marris (2021) is the modern
        translation and is excellent. The older Stuart Gilbert is fine but
        dates.
      </p>

      <p>
        <em>La Chute / The Fall</em>: Justin O'Brien (1956) remains the
        standard.
      </p>

      <H3>Hugo</H3>

      <p>
        <em>Les Misérables</em>: Christine Donougher (2013, Penguin) is the
        current standard and the most readable. Norman Denny (1976) is shorter
        — Denny abridged the long digressions, which most readers prefer.
        Julie Rose (2007) preserves them all and is the choice if you want the
        full Hugo experience.
      </p>

      <H3>Houellebecq</H3>

      <p>
        Frank Wynne translates most of the recent novels and his English
        catches the tone well. Lorin Stein's <em>The Elementary Particles</em>{" "}
        is also strong. Houellebecq is short enough per novel that comparing
        translations isn't necessary; pick one and read.
      </p>

      <H2>Setup for parallel French reading</H2>

      <p>
        Two-window reading is the standard. Translify aligns the French and
        English editions by chapter; if you're doing this manually, two
        browser tabs work equivalently. Read the English at pace; mark the
        passages where you want to check the French.
      </p>

      <p>
        For a 300-page French novel in English translation, expect to mark
        20–40 passages. This is fewer than for Russian (no patronymics) and
        much fewer than for German philosophy (no specialized terminology).
        Most marks will be:
      </p>

      <ul className="!my-4 list-disc space-y-2 pl-6">
        <li>
          Register questions — &ldquo;is this character being formal or
          intimate?&rdquo;
        </li>
        <li>
          Cultural references — French political figures, intellectuals, films,
          neighborhoods. Especially common in Houellebecq and Annie Ernaux.
        </li>
        <li>
          Untranslatable phrases — usually flagged in the English with italics
          or a footnote; sometimes not. Worth checking the original anyway.
        </li>
      </ul>

      <p>
        At each mark, the useful questions are: what does the French actually
        say here? What's the register? What cultural context am I missing? A
        highlight-and-ask interface handles all three in seconds.
      </p>

      <H2>Reading French with an upgrade path</H2>

      <p>
        French is among the easier major languages for English speakers to
        learn to reading level. B1 (intermediate) is achievable in 12–18 months
        of consistent study; at B1 you can read Camus, Sagan, and Annie Ernaux
        comfortably with occasional dictionary lookups. B2 (upper intermediate)
        takes another year and opens up Flaubert, Camus's harder works, and
        most contemporary literary fiction. C1 is required for comfortable
        Proust.
      </p>

      <p>
        If you're planning the upgrade, the natural progression is:
      </p>

      <ul className="!my-4 list-disc space-y-2 pl-6">
        <li>
          <strong>A2/B1</strong>: Camus's <em>L'Étranger</em>, Saint-Exupéry's
          <em> Le Petit Prince</em>, Sagan's <em>Bonjour Tristesse</em>.
        </li>
        <li>
          <strong>B1/B2</strong>: Modiano's short novels, Ernaux, Houellebecq's
          earlier work.
        </li>
        <li>
          <strong>B2/C1</strong>: Flaubert, Stendhal, Maupassant.
        </li>
        <li>
          <strong>C1+</strong>: Proust, Céline, Genet.
        </li>
      </ul>

      <p>
        For everything above B1, AI assistance turns difficult French into
        readable French. The transition from &ldquo;reading French
        translated&rdquo; to &ldquo;reading French with help&rdquo; is the
        important step; the rest is just time.
      </p>

      <Quote>
        Try this on{" "}
        <Link href="/read/french/in/english" className="underline decoration-[color:var(--color-saffron)] not-italic">
          Translify for French → English
        </Link>
        . Upload the French original plus the English translation, or ask the
        book to translate as you read.
      </Quote>
    </BlogShell>
  );
}
