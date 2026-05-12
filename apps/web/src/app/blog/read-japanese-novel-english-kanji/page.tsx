import type { Metadata } from "next";
import Link from "next/link";
import { BlogShell, H2, H3, Lead, Quote } from "../_shell";
import { findPost } from "../_posts";

const post = findPost("read-japanese-novel-english-kanji")!;
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
    q: "Which English translations of Murakami should I read?",
    a: "Jay Rubin and Philip Gabriel are the principal Murakami translators in English, with Alfred Birnbaum doing the early novels. Rubin translates Norwegian Wood, The Wind-Up Bird Chronicle, and most of the major works; his English is closest to Murakami's actual register. Birnbaum's earlier versions read smoother but take more liberties. There's almost no case for going back to Birnbaum once Rubin has retranslated a book.",
  },
  {
    q: "What's the deal with the three writing systems?",
    a: "Japanese uses hiragana (phonetic, native words), katakana (phonetic, foreign loanwords), and kanji (Chinese-derived ideograms). Authors choose between writing a word in hiragana or kanji partly for meaning, partly for style, partly for character — a word in hiragana feels softer, more colloquial, sometimes childlike. None of this survives translation into English. AI can flag when the choice was unusual.",
  },
  {
    q: "Why do Japanese sentences feel different from translated English?",
    a: "Japanese frequently drops the subject of a sentence and relies on context. It also uses honorifics that encode the speaker's relationship to the listener — formality, age difference, intimacy — in ways English needs explicit modifiers to express. The result: Japanese prose often reads more elliptical and more atmospheric than its English translation. Translators have to fill in subjects and flatten honorifics; both losses are real.",
  },
  {
    q: "Can I read manga in original Japanese as a learner?",
    a: "Manga targeted at younger readers (shōnen and shōjo, both written for teens) include furigana — small phonetic readings above difficult kanji. This makes them feasible for intermediate learners (N4-N3 JLPT level). Adult manga (seinen, josei) usually lack furigana and are harder. Translify handles furigana-annotated manga; the highlight-then-ask flow works on the kanji directly.",
  },
  {
    q: "Are there Japanese authors who translate especially well or especially badly into English?",
    a: "Translate well: Kazuo Ishiguro (writes in English anyway), Yoko Ogawa (precise, controlled prose survives), Banana Yoshimoto (the simplicity translates). Translate poorly: Yukio Mishima's late style (highly ornate, full of classical references), Junichiro Tanizaki's older works (period-specific class signifiers don't survive), most Heian-era classics (Genji, the Pillow Book) — the original cultural context is gone.",
  },
  {
    q: "What about light novels and isekai — same approach?",
    a: "Mostly yes, with one difference: the official English translations of light novels and isekai are inconsistent in quality. Where the official translation has problems, MTL (machine-translated) fan versions sometimes circulate. AI-assisted reading of the original Japanese is often higher-quality than the worst official translations.",
  },
  {
    q: "How long does it take to learn Japanese well enough to read novels in the original?",
    a: "Reading literary Japanese comfortably requires roughly N2 JLPT level — about 1,500 hours of study for a native English speaker. That's 2-4 years of consistent work. Reading manga (with furigana) is achievable at N4, around 600 hours, or roughly a year. For most readers, AI-assisted English reading captures the value at a fraction of the time investment.",
  },
];

export default function Page() {
  return (
    <BlogShell post={post} faqs={faqs}>
      <Lead>
        Japanese is the most linguistically distant of the major literary
        languages from English. Three writing systems, honorifics that encode
        social relationships in the grammar itself, sentences that drop subjects
        and rely on context, and a literary tradition that includes 1,000-year-old
        novels still in print. English translation handles all of this with
        approximations that are mostly fine and sometimes lossy. This is a
        reference guide to reading Japanese novels in English while keeping the
        kanji within reach.
      </Lead>

      <H2>What gets lost in Japanese-to-English translation</H2>

      <H3>Honorifics and social register</H3>

      <p>
        Japanese encodes speaker-listener relationships in verb forms and
        suffixes (-san, -kun, -chan, -sama, -sensei). A character switching
        from -san to -chan mid-conversation signals a change in intimacy that
        English can only render with awkward modifiers (&ldquo;suddenly
        familiar,&rdquo; &ldquo;dropping the formality&rdquo;). Most
        translators flatten the honorifics into standard English speech, which
        loses information.
      </p>

      <p>
        Some translators preserve -san and -sensei in the English text (kept as
        Japanese), which works but limits the audience. The Murakami
        translators generally drop them; the manga translators usually keep
        them. Neither approach is wrong; both lose something.
      </p>

      <H3>Subject dropping and ambiguity</H3>

      <p>
        A Japanese sentence routinely drops the grammatical subject when
        context makes it clear. This produces prose that feels more atmospheric
        and less assertive in the original than in any English translation,
        which must add the subjects back in. The cumulative effect across a
        novel is significant — Murakami in Japanese feels more dreamlike than
        Murakami in English, and the translation isn't to blame; the language
        is.
      </p>

      <H3>Kanji choice</H3>

      <p>
        Most Japanese words can be written in kanji (ideogram, often Chinese-
        derived), hiragana (phonetic, native), or katakana (phonetic, used for
        loanwords and emphasis). An author's choice signals tone, character
        voice, and sometimes meaning. The word for &ldquo;woman&rdquo; in
        kanji (女) is neutral; in katakana (オンナ) it can read sleazy or
        emphatic; in hiragana (おんな) it reads soft, sometimes literary. None
        of this is visible in English.
      </p>

      <p>
        For most reading purposes this loss is acceptable. For specific
        authors — Mishima, Tanizaki, Kawabata — the kanji choice is part of
        the prose style. The highlight-and-ask workflow lets you check the
        original choice in the moments that matter.
      </p>

      <H2>Recommended translations by author</H2>

      <H3>Haruki Murakami</H3>

      <p>
        Jay Rubin for <em>Norwegian Wood</em>, <em>The Wind-Up Bird
        Chronicle</em> (his retranslation, not Birnbaum's), <em>after the
        quake</em>, and most of the canonical novels. Philip Gabriel for{" "}
        <em>Kafka on the Shore</em>, <em>1Q84</em> (with Rubin), <em>Killing
        Commendatore</em>. Both are reliable. Avoid Birnbaum's older versions
        of books that have been retranslated.
      </p>

      <H3>Yoko Ogawa</H3>

      <p>
        Stephen Snyder translates most of Ogawa's recent work into English (
        <em>The Memory Police</em>, <em>The Housekeeper and the Professor</em>,
        <em>Revenge</em>). His translations preserve Ogawa's careful,
        controlled prose; she's one of the cleanest Japanese authors to read
        in English.
      </p>

      <H3>Yukio Mishima</H3>

      <p>
        Mishima is notoriously hard to translate well. Different translators
        for different books: Donald Keene for <em>After the Banquet</em>,
        John Nathan for <em>The Sailor Who Fell from Grace with the Sea</em>,
        Michael Gallagher for <em>Spring Snow</em>. The late ornate style
        (the Sea of Fertility tetralogy) loses the most in translation. Keep
        the Japanese accessible.
      </p>

      <H3>Junichiro Tanizaki</H3>

      <p>
        Edward Seidensticker for <em>The Makioka Sisters</em> and <em>Some
        Prefer Nettles</em>; Anthony Chambers for <em>Naomi</em> and several
        of the shorter works. Seidensticker is the standard. Tanizaki's prose
        is full of period-specific Osaka and Tokyo class markers; AI
        assistance helps with the cultural references the English can't carry.
      </p>

      <H3>Yasunari Kawabata</H3>

      <p>
        Edward Seidensticker for <em>Snow Country</em>, <em>Thousand
        Cranes</em>, and <em>The Sound of the Mountain</em>. Kawabata's prose
        is sparse and elliptical in Japanese; even Seidensticker's careful
        translation adds explicitness the original doesn't have.
      </p>

      <H3>Modern authors</H3>

      <p>
        Sayaka Murata (<em>Convenience Store Woman</em>): Ginny Tapley Takemori
        translates; very good. Mieko Kawakami: Sam Bett and David Boyd; good.
        Hiromi Kawakami: Allison Markin Powell; good. Hiroko Oyamada: David
        Boyd; good. The contemporary literary scene is well-served by
        translation; Murakami remains the most-translated and most-discussed.
      </p>

      <H2>Setup for reading Japanese alongside English</H2>

      <p>
        Two-source reading is feasible even at low Japanese proficiency, because
        you're not trying to read the Japanese for pleasure — you're checking
        it at specific moments.
      </p>

      <p>
        Drop the Japanese EPUB and the English translation into Translify; the
        chapters align automatically. Read the English at pace. Mark passages
        where you want to check the original — usually:
      </p>

      <ul className="!my-4 list-disc space-y-2 pl-6">
        <li>
          A character name whose meaning matters (Japanese names often carry
          symbolic readings — &ldquo;Toru&rdquo; can mean &ldquo;to pierce
          through&rdquo; in some kanji, which Murakami plays with).
        </li>
        <li>
          A dialogue scene where the honorifics matter to the character
          dynamics.
        </li>
        <li>
          A moment of sudden literary register shift that the English flattens.
        </li>
      </ul>

      <p>
        Per 300-page Japanese novel, expect 15–30 marks. The most useful
        questions: what's the kanji here, and what does it literally mean?
        What honorific is being used between these characters? What's the
        cultural reference the English flattened?
      </p>

      <H2>Reading manga in the original</H2>

      <p>
        Manga is the most accessible entry point to Japanese literature in
        the original language, because shōnen and shōjo manga include furigana
        — small hiragana annotations above difficult kanji that show their
        pronunciation. This makes them readable at N4 (intermediate-beginner)
        level rather than the N2 required for literary novels.
      </p>

      <p>
        Practical setup: get the raw Japanese (DMM, BookWalker, or Amazon
        Japan) plus the official English translation if one exists. Read the
        Japanese first, page by page; check the English when you're stuck.
        AI-assisted glossing of unknown kanji works well over the original.
      </p>

      <p>
        Adult manga (seinen, josei) typically lack furigana. They're harder,
        but the same workflow applies — you just need to look up more kanji
        readings yourself.
      </p>

      <H2>What's worth learning Japanese for</H2>

      <p>
        Most modern Japanese prose translates well enough that learning the
        language for literary purposes is a luxury. The exceptions:
      </p>

      <ul className="!my-4 list-disc space-y-2 pl-6">
        <li>
          <strong>Classical literature</strong>: The Tale of Genji, the Pillow
          Book, the Manyōshū poetry collection. Even Japanese natives need
          modern annotated editions to read these; English translation
          flattens further. If you care about pre-modern Japan, learning at
          least classical-adjacent Japanese is rewarding.
        </li>
        <li>
          <strong>Mishima and Kawabata at full register</strong>: their late
          styles depend on kanji choice and rhythm that English can't carry.
        </li>
        <li>
          <strong>Poetry and haiku</strong>: untranslatable as poetry. The
          English versions are explanations, not poems.
        </li>
      </ul>

      <p>
        For Murakami, Ogawa, Kawakami, and most contemporary fiction, AI-
        assisted English with the Japanese in reach is the practical setup.
        The 2-4 years of language study to reach N2 are worth it for other
        reasons, but not strictly required to engage with the literature.
      </p>

      <Quote>
        Try this on{" "}
        <Link href="/read/japanese/in/english" className="underline decoration-[color:var(--color-saffron)] not-italic">
          Translify for Japanese → English
        </Link>
        . Upload a Japanese EPUB or manga; ask about kanji, honorifics, and
        cultural references as you read.
      </Quote>
    </BlogShell>
  );
}
