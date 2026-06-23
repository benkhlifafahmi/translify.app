import type { Metadata } from "next";
import Link from "next/link";
import { BlogShell, H2, Lead, Quote } from "../_shell";
import { findPost } from "../_posts";

const post = findPost("chat-with-youtube-video-ai")!;
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
    q: "Can I really chat with a YouTube video?",
    a: "You chat with the video's transcript. A tool pulls the caption track, splits it into passages, and finds the passages most relevant to your question to answer from. So you're asking questions about what was said in the video, and getting answers drawn from the actual words — not from the title or the model's general knowledge.",
  },
  {
    q: "What does a 'timestamped citation' mean?",
    a: "When the AI answers, it tells you which moment of the video the answer came from — e.g. 12:34 — and links it, so you can jump straight there and hear it in context. It's the difference between 'trust me' and 'here's exactly where she says it.' For studying, that verifiability is the whole point.",
  },
  {
    q: "Why not just use a summary?",
    a: "A summary answers a question you didn't ask: 'what is this video broadly about?' When you're studying, you have specific questions — what did that term mean, how did that step follow from the previous one, what were the three causes he listed. A summary flattens exactly the detail you needed. Q&A answers the question you actually have.",
  },
  {
    q: "Does it hallucinate?",
    a: "Grounded Q&A is far less prone to invention than asking a chatbot from memory, because the answer is constructed from retrieved transcript passages rather than the model's parameters. It's not immune — captions can be wrong, and a model can still misread a passage — but the timestamped citation gives you a one-click way to verify, which a memory-based answer never does.",
  },
  {
    q: "What should I ask to study effectively?",
    a: "Ask to clarify ('what did she mean by X here?'), to connect ('how does this relate to what he said earlier about Y?'), to test yourself ('quiz me on the second half'), and to locate ('where does the proof use continuity?'). Avoid asking only for summaries — the value is in the specific, the same way a good study session is built on questions, not re-reading.",
  },
];

export default function Page() {
  return (
    <BlogShell post={post} faqs={faqs}>
      <Lead>
        &ldquo;Chat with a video&rdquo; tools are everywhere now, and most of
        them do the same disappointing thing: paste a link, get a summary, ask
        a question, get a vague paragraph you can't verify. The version that's
        actually useful for studying does something narrower and far more
        valuable — it answers your specific question from what was said in the
        video, and shows you the exact timestamp it came from.
      </Lead>

      <H2>Summary vs. answer</H2>

      <p>
        A summary answers one question: <em>what is this video about?</em> It's
        useful exactly once, before you watch. The moment you're studying, your
        questions get specific — <em>what did that term mean in this context?
        Why does step three follow from step two? What were the three examples
        she gave?</em> A summary deletes precisely the detail those questions
        need. That's not a flaw in the summary; it's what a summary is for.
      </p>

      <p>
        Studying runs on questions, not overviews. So the tool that helps you
        study is the one that takes your question and returns the relevant
        passage — not a compression of the whole thing.
      </p>

      <H2>How grounded video chat actually works</H2>

      <p>
        The mechanism is the same retrieval-augmented generation (RAG) that
        powers chatting with a PDF, applied to a transcript:
      </p>

      <ul className="!my-4 list-disc space-y-2 pl-6">
        <li>
          The tool pulls the video's caption track — a timestamped transcript
          of everything said.
        </li>
        <li>
          It splits the transcript into short passages, each tagged with the
          moment it occurred.
        </li>
        <li>
          When you ask a question, it finds the passages most relevant to that
          question and gives them to the model as the source material.
        </li>
        <li>
          The model answers from those passages and cites the timestamp, so
          the answer is both grounded and checkable.
        </li>
      </ul>

      <p>
        Because the answer is built from retrieved passages rather than the
        model's general memory, it stays anchored to what the video actually
        said. This is the same approach we use for{" "}
        <Link href="/blog/translate-academic-paper-foreign-language-ai" className="underline decoration-[color:var(--color-saffron)]">
          reading academic papers
        </Link>{" "}
        and books: answers that point back to a source you can open.
      </p>

      <H2>Why the citation is the whole point</H2>

      <p>
        Anyone can generate a confident paragraph. The question that matters
        when you're learning is: <em>is this right, and where does it come
        from?</em> A timestamped citation answers both. You click it, you land
        at 12:34, you hear the speaker say it. If the answer was a slight
        misread, you catch it in five seconds. If it was right, you've just
        re-heard it in context — which is itself good for retention.
      </p>

      <Quote>
        An answer you can't verify is a rumour with good grammar. A citation
        turns it into something you can actually trust — or correct.
      </Quote>

      <p>
        This is also the honest answer to the hallucination worry. Grounded
        Q&amp;A invents far less than a chatbot answering from memory, but the
        real safeguard is that you can check it in one click. A memory-based
        answer gives you nothing to check against.
      </p>

      <H2>What to ask</H2>

      <p>
        The quality of your study session is mostly the quality of your
        questions. Four types do most of the work:
      </p>

      <ul className="!my-4 list-disc space-y-2 pl-6">
        <li>
          <strong>Clarify.</strong> <em>What did she mean by
          &ldquo;eventual consistency&rdquo; here?</em> Better than a glossary
          because the answer uses the video's own framing.
        </li>
        <li>
          <strong>Connect.</strong> <em>How does this relate to the caching
          point from earlier?</em> Forces the material into a structure rather
          than a list of facts.
        </li>
        <li>
          <strong>Test.</strong> <em>Ask me three questions about the second
          half.</em> Retrieval practice, on demand.
        </li>
        <li>
          <strong>Locate.</strong> <em>Where does he derive the formula?</em>
          {" "}Replaces scrubbing the timeline — you get sent to the moment.
        </li>
      </ul>

      <H2>Honest limits</H2>

      <p>
        It only knows what was said. Captions don't capture what's on screen,
        so a question about a diagram the speaker didn't describe out loud
        won't get a good answer. Auto-generated captions can mangle names and
        jargon, and answers inherit those errors — which is, again, why the
        click-to-verify timestamp matters. And it isn't a substitute for
        watching: it's a faster way to find, check, and test, not a way to
        skip the understanding.
      </p>

      <p>
        For the full studying workflow this fits into — import, watch, quiz —
        see{" "}
        <Link href="/blog/study-from-youtube-videos-ai" className="underline decoration-[color:var(--color-saffron)]">
          how to study from YouTube videos with AI
        </Link>
        .
      </p>

      <Quote>
        Translify lets you{" "}
        <Link href="/join" className="underline decoration-[color:var(--color-saffron)] not-italic">
          chat with any captioned YouTube video and get answers that cite the
          timestamp
        </Link>
        , then quiz yourself on what you watched. Free 14-day trial.
      </Quote>
    </BlogShell>
  );
}
