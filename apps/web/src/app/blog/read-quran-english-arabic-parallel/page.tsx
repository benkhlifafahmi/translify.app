import type { Metadata } from "next";
import Link from "next/link";
import { BlogShell, H2, H3, Lead, Quote } from "../_shell";
import { findPost } from "../_posts";

const post = findPost("read-quran-english-arabic-parallel")!;
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
    q: "Which English translation of the Quran is most accurate?",
    a: "Accuracy depends on what you mean. For literal word-for-word fidelity, Saheeh International is the closest. For literary English that preserves the rhythm of the Arabic, M.A.S. Abdel Haleem (Oxford) is the most widely recommended. For traditional Sunni interpretive grounding, Yusuf Ali's translation with notes remains influential. The Clear Quran by Mustafa Khattab is the most accessible to first-time readers. There is no single 'best'; the standard recommendation is to read at least two.",
  },
  {
    q: "Is reading the Quran in translation the same as reading the Quran?",
    a: "Theologically, no. Islamic scholarship holds that the Arabic Quran is the revealed text and any translation is an interpretation (tarjamat al-ma'ani — translation of the meanings). This isn't theological gatekeeping; it reflects the fact that Quranic Arabic is highly compressed and any English version must expand and interpret to be readable. For most non-Arabic-speaking readers, English translation with the Arabic accessible is the practical approach.",
  },
  {
    q: "Do I need to know Arabic to read the Quran with the Arabic alongside?",
    a: "No. Most non-Arabic-speaking Muslims read this way and most religious-studies students start this way. The Arabic doesn't need to be read aloud or understood word-for-word; it's accessible for verse-level comparison and to consult specific words when the English translation reads ambiguously. AI assistance covers the word-by-word work that previously required a dictionary.",
  },
  {
    q: "What's tafsir and do I need it to understand the Quran?",
    a: "Tafsir is classical Quranic exegesis — scholarly commentary on the meaning, context, and theological implications of each verse. The standard English-accessible tafsirs are Ibn Kathir (Sunni), Maududi's Tafhim al-Quran, and the contemporary Study Quran (HarperOne). For first-time readers, the translator's footnotes in Abdel Haleem or the Clear Quran are sufficient. For deeper study, tafsir is essential — many verses make limited sense without their historical context (asbab al-nuzul).",
  },
  {
    q: "Why are some English translations so different from each other?",
    a: "Three reasons: theological interpretation (Sunni, Shia, Ahmadi translators read certain verses differently), translator's English register (formal King James-style vs. modern accessible English), and treatment of ambiguous Arabic vocabulary. Where a verse's meaning is contested in classical scholarship, the contestation shows up in English differences. Reading two translations side-by-side surfaces these contested verses directly.",
  },
  {
    q: "Can AI help me understand the Quran verse by verse?",
    a: "AI is good at three specific things: providing the literal word-by-word translation of an Arabic verse, summarizing what classical tafsirs say about a given verse (drawing on the major Sunni commentaries), and explaining the historical context (asbab al-nuzul) where it's well-documented. AI is less reliable for contested theological interpretation — for that, read traditional tafsirs directly.",
  },
  {
    q: "Where do I get a clean Arabic-English parallel Quran EPUB?",
    a: "Tanzil.net hosts the canonical Arabic text plus most major translations as downloadable plaintext or EPUB. King Fahd Quran Complex publishes free Arabic and parallel editions. Quran.com has all the major translations and is the standard online reference. Translify accepts any of these and aligns Arabic and English by verse.",
  },
];

export default function Page() {
  return (
    <BlogShell post={post} faqs={faqs}>
      <Lead>
        The Quran in Arabic is a text whose form is part of its meaning. The
        rhythm of the verses, the sound patterns, the precise word choices —
        all of it is theologically and literarily load-bearing in the original.
        English translation flattens most of this and has to. For
        non-Arabic-speaking readers, the practical approach is the English
        translation with the Arabic accessible for the verses that carry the
        weight. This is a reference guide to that setup.
      </Lead>

      <H2>Why English translations of the Quran differ so much</H2>

      <p>
        Classical Quranic Arabic is unusually compressed. A single verse can
        encode multiple grammatical readings, multiple lexical readings, and a
        theological argument that depends on which reading you choose.
        Translators must pick, and the picks differ.
      </p>

      <p>
        Three forces drive translation divergence:
      </p>

      <H3>Theological tradition</H3>

      <p>
        Sunni, Shia, Ahmadi, and modernist translators read certain key verses
        differently. The verses about prophethood, succession, intercession,
        and divine attributes carry the most variation. Saheeh International,
        Yusuf Ali, Pickthall, and Khattab are Sunni-aligned; Ahmed Ali leans
        modernist; the Ahmadiyya translations follow Ahmadi interpretation.
        None of this is hidden — most translations declare their interpretive
        tradition in the introduction.
      </p>

      <H3>English register</H3>

      <p>
        Older translations (Pickthall 1930, Yusuf Ali 1934) use a King
        James-style archaic English (&ldquo;thee, thou, ye&rdquo;) to signal
        the text's gravity. Modern translations (Abdel Haleem 2004, Khattab
        2015) use contemporary English. The trade-off is reverence vs.
        readability; both have defenders.
      </p>

      <H3>Treatment of ambiguous vocabulary</H3>

      <p>
        Some Arabic words have multiple meanings, and classical tafsirs
        disagree on which the Quran intends. The translator either picks one
        and footnotes the others, picks one silently, or picks several and
        produces a longer English verse. The differences here are often
        substantial.
      </p>

      <H2>Recommended translations</H2>

      <H3>For first-time readers</H3>

      <p>
        <strong>The Clear Quran (Mustafa Khattab, 2015)</strong>: the most
        accessible modern translation. Contemporary English, brief footnotes
        on context, Sunni interpretive grounding. Used in many North American
        mosques as the standard English reference. The natural starting point
        for English-speaking readers approaching the Quran for the first time.
      </p>

      <p>
        <strong>The Quran: A New Translation (M.A.S. Abdel Haleem, 2004,
        Oxford)</strong>: a literary translation that preserves more of the
        Arabic rhythm than most. Widely recommended for academic and general
        readers. Briefer footnotes than Khattab; cleaner English.
      </p>

      <H3>For close study</H3>

      <p>
        <strong>Saheeh International (1997)</strong>: the most literal modern
        translation. Less literary than Abdel Haleem, more faithful to the
        Arabic grammar. The standard reference when you want to know what
        the Arabic literally says.
      </p>

      <p>
        <strong>The Study Quran (HarperOne, 2015)</strong>: the modern
        scholarly reference. Translation by Seyyed Hossein Nasr et al., with
        substantial commentary drawing on classical Sunni and Shia tafsir.
        Expensive and physically heavy; the most comprehensive single-volume
        English Quran available.
      </p>

      <H3>For comparison reading</H3>

      <p>
        <strong>Yusuf Ali (1934, revised 1989)</strong>: the historically
        dominant English Quran. Archaic English, extensive footnotes drawing
        on classical tafsir. Useful as a second translation for the footnote
        density; less useful as the primary read because the English dates.
      </p>

      <p>
        <strong>Marmaduke Pickthall (1930)</strong>: the first widely-used
        English Quran by a Muslim translator. Archaic English. Useful for
        comparison and historical interest; superseded by modern translations
        for everyday use.
      </p>

      <H2>Setup for parallel Arabic-English reading</H2>

      <p>
        The standard setup is the English translation in the main reading
        position with the Arabic verse accessible — either side-by-side or on
        demand. Both work. Most printed parallel editions use a two-column
        layout; digital tools (Translify, Quran.com) typically show the Arabic
        above each English verse.
      </p>

      <p>
        Read the English at your normal pace. Mark the verses where you want
        to check the Arabic. The most common reasons to check:
      </p>

      <ul className="!my-4 list-disc space-y-2 pl-6">
        <li>
          A verse where the English feels theologically loaded — to see whether
          the loading is the original or the translator.
        </li>
        <li>
          A verse referenced in a hadith, sermon, or other Islamic text — to
          see exactly which words are being cited.
        </li>
        <li>
          A verse you've encountered in multiple translations and want to
          reconcile.
        </li>
      </ul>

      <p>
        At each mark, useful questions: what does the Arabic verse literally
        say, word by word? What's the historical context (asbab al-nuzul)?
        What do the major classical tafsirs say about this verse? A
        highlight-and-ask interface handles all three quickly.
      </p>

      <H2>Where AI assistance helps and where it doesn't</H2>

      <p>
        AI is good at the linguistic and historical layers: word-by-word
        translation of the Arabic, summary of classical tafsir on a verse,
        the documented asbab al-nuzul. These are well-recorded in classical
        scholarship and AI surfaces them reliably.
      </p>

      <p>
        AI is less reliable for contested interpretive questions —
        theological debates between schools, verses with no settled reading,
        edge cases in Islamic jurisprudence. For those, read traditional
        tafsirs directly (Ibn Kathir, Maududi, Razi) or consult a scholar.
        AI can summarize what the major tafsirs say; it shouldn't be the
        terminal authority.
      </p>

      <p>
        AI is also bad at recitation. The Quran is meant to be heard; tools
        like Quran.com include recitations by major qaris (Mishary Rashid
        Alafasy, Abdul Basit, Saad Al-Ghamdi). Listen to a few. The text
        you're reading was meant to sound like that.
      </p>

      <H2>A reading sequence for beginners</H2>

      <p>
        The Quran is not arranged chronologically. The longer suras come
        first; the earliest revealed material is mostly at the end. For
        first-time readers, a roughly chronological sequence works better than
        front-to-back:
      </p>

      <ul className="!my-4 list-disc space-y-2 pl-6">
        <li>
          <strong>Start</strong>: Surat al-Fatiha (1), the opening prayer.
          Short and central.
        </li>
        <li>
          <strong>Early Meccan suras</strong>: 96, 74, 73, 53, 81, 82, 84. Short,
          poetic, focused on the divine and the afterlife. The oldest material.
        </li>
        <li>
          <strong>Middle Meccan</strong>: 19, 20, 26, 27. Narrative — prophets,
          Moses, Jesus, Joseph.
        </li>
        <li>
          <strong>Medinan suras</strong>: 2 (al-Baqarah, the long one), 3, 4, 5.
          Legal and communal material from after the Hijra.
        </li>
      </ul>

      <p>
        Most introductory editions and study guides offer some variation of
        this sequence. Reading the Quran front-to-back is also fine, but
        readers who do so often bog down in al-Baqarah (the second sura, also
        the longest) before encountering the more accessible later material.
      </p>

      <H2>What's worth learning Arabic for</H2>

      <p>
        Classical Arabic to a level where you can read the Quran with
        understanding takes years. Most serious students start with modern
        standard Arabic for two years, then transition to classical Arabic
        grammar and Quranic vocabulary for another two or three.
      </p>

      <p>
        For most non-Arabic-speaking readers, this is more time than the
        purpose justifies. AI-assisted reading of English translations with
        the Arabic accessible captures most of the value at a fraction of
        the investment. For specialists — students of Islamic law, theology,
        or classical literature — the language investment is essential.
      </p>

      <Quote>
        Try this on{" "}
        <Link href="/read/arabic/in/english" className="underline decoration-[color:var(--color-saffron)] not-italic">
          Translify for Arabic → English
        </Link>
        . Upload an Arabic Quran plus your preferred English translation; ask
        verse by verse.
      </Quote>
    </BlogShell>
  );
}
