import type { Metadata } from "next";
import Link from "next/link";
import { BlogShell, H2, H3, Lead, Quote } from "../_shell";
import { findPost } from "../_posts";

const post = findPost("take-notes-from-video-lectures")!;
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
    q: "Why is taking notes from a video harder than from a textbook?",
    a: "A textbook lets you skim, re-read a sentence instantly, and see structure at a glance. A video is linear and time-bound: you can't skim it, re-reading means scrubbing back, and the structure is hidden in the speaker's pacing. So the textbook habit — copy as you go — fails on video, because copying forces you to pause constantly and you lose the thread.",
  },
  {
    q: "Should I pause the video to write notes?",
    a: "Sparingly. Pausing every twenty seconds destroys comprehension — you never hold enough of the argument in working memory to understand it. A better pattern is to watch a coherent chunk (a few minutes) at speed, then pause at a natural break and write from memory. Writing from memory is also retrieval practice, which beats transcription for retention.",
  },
  {
    q: "Is it better to type or handwrite lecture notes?",
    a: "Handwriting tends to win for retention because it's slower, which forces you to summarise rather than transcribe verbatim (the Mueller & Oppenheimer finding). But the real lever isn't the medium — it's whether you're processing or just copying. Typed notes that summarise beat handwritten notes that transcribe. Pick whichever keeps you summarising.",
  },
  {
    q: "Can AI take notes from a lecture for me?",
    a: "AI can produce a transcript and a summary, and it can answer questions about the lecture with timestamps. What it can't do is the learning — notes are valuable largely because making them forces you to process the material. Use AI to remove busywork (finding a section again, checking a definition, generating practice questions) but keep the act of summarising and self-testing yours.",
  },
  {
    q: "What note system works best for video lectures?",
    a: "A question-led variant of the Cornell method works well: as you watch, jot timestamps and cue questions rather than full sentences; after watching, answer those questions from memory in your own words; later, cover the answers and use the questions to self-test. It front-loads structure (the questions) and builds in review (the self-test) without requiring you to transcribe.",
  },
];

export default function Page() {
  return (
    <BlogShell post={post} faqs={faqs}>
      <Lead>
        Most people take notes from a video the way they take notes from a
        book: try to write down what's said as it goes. It doesn't work.
        Pausing every twenty seconds to scribble breaks the thread, you fall
        behind, and the notes you end up with are a half-transcript you'll
        never re-read. Here's a system built for how video actually behaves —
        linear, time-bound, un-skimmable — and where AI genuinely helps versus
        where it quietly does your learning for you.
      </Lead>

      <H2>Why the textbook habit fails on video</H2>

      <p>
        A book is random-access: you skim, jump back a paragraph, see the
        shape of a chapter at a glance. A video is sequential and paced by
        someone else. Three consequences follow:
      </p>

      <ul className="!my-4 list-disc space-y-2 pl-6">
        <li>
          <strong>You can't skim.</strong> There's no way to glance at the
          next two minutes; you have to spend them.
        </li>
        <li>
          <strong>Re-reading is expensive.</strong> Catching a sentence you
          missed means scrubbing back and re-watching — high enough friction
          that most people just don't.
        </li>
        <li>
          <strong>Pausing has a comprehension cost.</strong> Stop to
          transcribe and you drop the argument you were holding in working
          memory. The notes get more complete and your understanding gets
          worse.
        </li>
      </ul>

      <H2>The system: watch-first, capture-light, review-heavy</H2>

      <p>
        The fix is to move the writing off the critical path. Watch for
        understanding; capture just enough to find your way back; do the real
        note-making and testing afterward.
      </p>

      <H3>Pass 1 — watch in chunks, capture cues not transcripts</H3>

      <p>
        Watch a coherent chunk — a few minutes, up to a natural break — at a
        comfortable speed. Don't transcribe. Jot only <em>cues</em>: a
        timestamp plus a few words, or better, a <em>question</em> the chunk
        raised or answered. &ldquo;14:20 — why does indexing speed up reads
        but slow writes?&rdquo; A page of good cues is worth more than ten
        pages of transcript, and it costs almost no attention to produce.
      </p>

      <H3>Pass 2 — answer from memory</H3>

      <p>
        At the break, write the actual notes: answer your cue questions in
        your own words, from memory, before re-checking. This is the step that
        does the work. Writing from memory is retrieval practice — you're not
        copying the lecture, you're reconstructing it, which is what builds
        durable memory. Where memory fails, <em>that's</em> your gap, and now
        you know exactly where to look.
      </p>

      <H3>Pass 3 — self-test later</H3>

      <p>
        Days later, cover the answers and use the cue questions to quiz
        yourself. Spaced retrieval is the single most reliable study technique
        in the research literature; a question-led note format gives it to you
        for free, because your notes are already a set of questions.
      </p>

      <Quote>
        Notes you transcribe, you forget. Notes you reconstruct, you keep. The
        goal of note-taking isn't a record of the lecture — it's the
        processing that making the record forces.
      </Quote>

      <H2>Where AI helps — and where it shouldn't</H2>

      <p>
        AI is genuinely useful for the friction around notes, and genuinely
        counterproductive if you let it do the processing for you.
      </p>

      <p>
        <strong>Let it handle retrieval and busywork.</strong> Re-finding a
        section, checking a definition you half-caught, confirming the order
        of steps — a tool that answers from the transcript and links the
        timestamp removes the scrubbing tax. (See{" "}
        <Link href="/blog/chat-with-youtube-video-ai" className="underline decoration-[color:var(--color-saffron)]">
          how to chat with a YouTube video
        </Link>
        .) Generating practice questions is also fair game — testing yourself
        is the goal, and AI is good at producing the prompts.
      </p>

      <p>
        <strong>Keep the summarising and self-testing yours.</strong> If AI
        writes the summary and you read it, you've outsourced exactly the part
        that creates learning. Use the machine to find and to quiz; do the
        reconstructing yourself.
      </p>

      <H2>Common mistakes</H2>

      <p>
        <strong>Transcribing verbatim.</strong> The most common and the most
        seductive — it feels productive and produces nothing. If your notes
        could have been generated by speech-to-text, they did nothing for you.
      </p>

      <p>
        <strong>Highlighting everything.</strong> The video equivalent is
        bookmarking every other minute. If most of it is marked important,
        none of it is.
      </p>

      <p>
        <strong>Never reviewing.</strong> Notes you make once and never reopen
        are a transcript with extra steps. The value is in pass 3.
      </p>

      <p>
        <strong>One giant pause-and-scrub session.</strong> Watching thirty
        seconds, pausing, writing, scrubbing back, repeat — it triples the
        time and halves the understanding. Watch in chunks; write at the
        breaks.
      </p>

      <H2>Putting it together</H2>

      <p>
        For a 40-minute lecture: watch in four ~10-minute chunks at 1.25x,
        cue-questions only (about 5 minutes of total writing). At each break,
        answer the cues from memory (another ~10 minutes across the lecture).
        Generate a short quiz and take it. Re-quiz from your cue questions
        three days later. Total active time is comparable to watching once and
        re-watching to find what you missed — but you end with structured
        notes and a tested memory instead of a vague sense of familiarity.
      </p>

      <p>
        For the end-to-end version of this with a video open beside the study
        tools, see{" "}
        <Link href="/blog/study-from-youtube-videos-ai" className="underline decoration-[color:var(--color-saffron)]">
          how to study from YouTube videos with AI
        </Link>
        .
      </p>

      <Quote>
        Translify gives you{" "}
        <Link href="/join" className="underline decoration-[color:var(--color-saffron)] not-italic">
          a video player beside transcript-grounded chat and auto-generated
          quizzes
        </Link>
        {" "}— so capture stays light and review stays easy. Free 14-day trial.
      </Quote>
    </BlogShell>
  );
}
