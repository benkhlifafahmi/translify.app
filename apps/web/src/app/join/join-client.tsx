"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { register, getGoogleAuthUrl } from "@/lib/auth";
import { trackLead } from "@/lib/onboarding";
import { Lumi, type LumiState } from "@/components/lumi/lumi";
import { TranslifyIcon } from "@/components/translify-mark";

// ─── Steps & state ────────────────────────────────────────────────────────────
type Step = "email" | "topics" | "shelf" | "experience" | "signup";

const STEP_ORDER: Step[] = ["email", "topics", "shelf", "experience", "signup"];

type TopicId =
  | "fiction" | "self-help" | "history" | "science"
  | "philosophy" | "business" | "art" | "tech";

const TOPICS: { id: TopicId; icon: string; label: string; tone: Tone }[] = [
  { id: "fiction",     icon: "📖", label: "Fiction",       tone: "saffron" },
  { id: "self-help",   icon: "✨", label: "Self-help",     tone: "sage"    },
  { id: "philosophy",  icon: "🌿", label: "Philosophy",    tone: "sage"    },
  { id: "history",     icon: "🏛️", label: "History",       tone: "plum"    },
  { id: "science",     icon: "🔬", label: "Science",       tone: "coral"   },
  { id: "business",    icon: "💼", label: "Business",      tone: "plum"    },
  { id: "art",         icon: "🎨", label: "Art & Poetry",  tone: "coral"   },
  { id: "tech",        icon: "💻", label: "Tech",          tone: "saffron" },
];

type Tone = "saffron" | "sage" | "plum" | "coral";

const TONE_MAP: Record<Tone, { ring: string; bg: string; iconBg: string; iconColor: string; deep: string }> = {
  saffron: { ring: "#D09040", bg: "linear-gradient(135deg,#FFFBF0,#FBE9C2)", iconBg: "rgba(224,164,80,0.18)", iconColor: "var(--color-saffron-deep)", deep: "var(--color-saffron-deep)" },
  sage:    { ring: "#5A8C5A", bg: "linear-gradient(135deg,#F4F8EC,#DDEAD2)", iconBg: "rgba(123,161,124,0.18)", iconColor: "var(--color-sage-deep)",    deep: "var(--color-sage-deep)"    },
  plum:    { ring: "#6B5B95", bg: "linear-gradient(135deg,#F4EEF7,#E0D2EA)", iconBg: "rgba(107,91,149,0.18)",  iconColor: "var(--color-plum)",         deep: "var(--color-plum)"          },
  coral:   { ring: "#C0604A", bg: "linear-gradient(135deg,#FFF1EE,#F6CCC4)", iconBg: "rgba(226,120,108,0.18)", iconColor: "var(--color-coral-deep)",   deep: "var(--color-coral-deep)"    },
};

// ─── Sample books ─────────────────────────────────────────────────────────────
interface SampleBook {
  id: string;
  topics: TopicId[];
  title: string;
  author: string;
  cover: { bg: string; emoji: string };
  origLang: string;
  origExcerpt: string;
  enExcerpt: string;
  chatPrompts: string[];
  cannedChat: { q: string; a: string }[];
  quiz: { q: string; choices: string[]; correct: number; explain: string }[];
}

const SAMPLE_BOOKS: SampleBook[] = [
  {
    id: "little-prince",
    topics: ["fiction", "philosophy"],
    title: "Le Petit Prince",
    author: "Antoine de Saint-Exupéry",
    cover: { bg: "linear-gradient(135deg,#6B5B95,#3D2D5C)", emoji: "🌹" },
    origLang: "French",
    origExcerpt: "Voici mon secret. Il est très simple : on ne voit bien qu'avec le cœur. L'essentiel est invisible pour les yeux.",
    enExcerpt: "Here is my secret. It is very simple: one sees clearly only with the heart. What is essential is invisible to the eye.",
    chatPrompts: [
      "What's the main lesson of the book?",
      "Why is the rose so important to the Prince?",
      "Quiz me on chapter 1",
    ],
    cannedChat: [
      {
        q: "What's the main lesson of the book?",
        a: "At its heart, *The Little Prince* is about learning to **see**. The narrator argues that adults forget how — they get lost in numbers, status, and routine. The Prince's tour of the asteroids satirises grown-up obsessions: a King who rules nothing, a Businessman counting stars he doesn't own, a Geographer who never leaves his desk.\n\nThe famous takeaway: **what is essential is invisible to the eye.** Meaning lives in time spent and in the responsibility we accept for what we love — symbolised by the rose he tamed back on his planet.",
      },
    ],
    quiz: [
      { q: "What does the fox teach the Little Prince?", choices: ["Speed matters most", "Taming creates responsibility", "Numbers prove value", "Stars own themselves"], correct: 1, explain: "The fox says: 'You become responsible, forever, for what you have tamed.'" },
      { q: "Why does the Prince consider his rose unique?", choices: ["She is rare", "He cared for her, watered her, listened", "She is the most beautiful", "She talks to him"], correct: 1, explain: "Although there are thousands of roses, his is unique because of the time he gave her." },
      { q: "What is the book's most famous line about?", choices: ["Money", "Speed", "Seeing with the heart", "Counting stars"], correct: 2, explain: "'What is essential is invisible to the eye' — a meditation on what truly matters." },
    ],
  },
  {
    id: "meditations",
    topics: ["philosophy", "self-help"],
    title: "Meditations",
    author: "Marcus Aurelius",
    cover: { bg: "linear-gradient(135deg,#E2786C,#9B3B2D)", emoji: "🏛️" },
    origLang: "Greek",
    origExcerpt: "Ἕωθεν προλέγειν ἑαυτῷ· συντεύξομαι περιέργῳ, ἀχαρίστῳ, ὑβριστῇ…",
    enExcerpt: "Begin each day by telling yourself: today I shall meet the meddling, the ungrateful, the arrogant, the deceitful, the envious, the unsociable. They are this way because they cannot tell good from evil.",
    chatPrompts: [
      "Summarise Stoic philosophy in 3 lines",
      "How do I apply this on a hard day?",
      "Quiz me on the core ideas",
    ],
    cannedChat: [
      {
        q: "Summarise Stoic philosophy in 3 lines",
        a: "1. **What you control vs. what you don't** — your judgements and reactions are yours; everything else (weather, other people, outcomes) is not.\n\n2. **Virtue is the only true good** — wisdom, justice, courage, self-discipline. External things are 'indifferents' that help or hinder but never define a life.\n\n3. **Live according to nature** — both human (we are rational and social) and cosmic (everything changes). Accept what comes, contribute what you can, let go.",
      },
    ],
    quiz: [
      { q: "Where did Marcus Aurelius write most of this?", choices: ["A palace in Rome", "Military camps on the frontier", "A library in Athens", "A monastery"], correct: 1, explain: "Much of it was written during campaigns against Germanic tribes." },
      { q: "What is the Stoic 'dichotomy of control'?", choices: ["Mind vs. body", "What you control vs. what you don't", "Past vs. future", "Self vs. society"], correct: 1, explain: "The foundation of Stoic practice — focus only on what's yours to choose." },
      { q: "Why do Stoics meet difficult people calmly?", choices: ["They suppress emotion", "They believe others act from ignorance, not malice", "They avoid all conflict", "They feel nothing"], correct: 1, explain: "As Marcus writes, they 'cannot distinguish good from evil' — so respond with patience, not anger." },
    ],
  },
  {
    id: "art-of-war",
    topics: ["business", "history"],
    title: "孫子兵法",
    author: "Sun Tzu — The Art of War",
    cover: { bg: "linear-gradient(135deg,#4A3C1E,#1F1808)", emoji: "⚔️" },
    origLang: "Classical Chinese",
    origExcerpt: "兵者，國之大事，死生之地，存亡之道，不可不察也。",
    enExcerpt: "War is of vital importance to the State — a matter of life and death, a road to safety or to ruin. It must be studied with the utmost care.",
    chatPrompts: [
      "How does this apply to modern business?",
      "Explain 'know yourself and the enemy'",
      "What does Sun Tzu say about avoiding battle?",
    ],
    cannedChat: [
      {
        q: "How does this apply to modern business?",
        a: "Operators read Sun Tzu as a manual for **competitive strategy under uncertainty**:\n\n- **Win before you fight.** The highest skill is winning without battle. In business: position so well (pricing, distribution, brand) that competitors don't even challenge you on key terrain.\n- **Know yourself and the enemy.** Internally — honest read of team, cash, capabilities. Externally — deep understanding of competitors and customers. Without it, you'll lose half the time.\n- **All warfare is based on deception.** Don't telegraph your moves. Keep optionality. Surprise wins.",
      },
    ],
    quiz: [
      { q: "What is Sun Tzu's highest form of victory?", choices: ["Annihilating the enemy", "Winning without fighting", "Capturing the capital", "A long siege"], correct: 1, explain: "'To subdue the enemy without fighting is the acme of skill.'" },
      { q: "Why is knowing yourself important?", choices: ["For confidence", "To know both self and enemy is to win every battle", "To improve morally", "To avoid arrogance"], correct: 1, explain: "Knowing both wins certainly; knowing one means winning half the time." },
      { q: "How does Sun Tzu view information?", choices: ["A luxury", "Decisive — spies and scouts are essential", "Unreliable", "Less important than courage"], correct: 1, explain: "He devotes an entire chapter to spies: 'foreknowledge cannot be elicited from spirits.'" },
    ],
  },
  {
    id: "origin",
    topics: ["science", "history"],
    title: "On the Origin of Species",
    author: "Charles Darwin",
    cover: { bg: "linear-gradient(135deg,#7BA17C,#3F5C40)", emoji: "🐢" },
    origLang: "English",
    origExcerpt: "It is interesting to contemplate a tangled bank, clothed with many plants of many kinds, with birds singing on the bushes…",
    enExcerpt: "It is interesting to contemplate a tangled bank, clothed with many plants of many kinds, with birds singing on the bushes, insects flitting about, worms crawling through the damp earth — and to reflect that these forms, so different yet so dependent on one another, have all been produced by laws acting around us.",
    chatPrompts: [
      "What is natural selection — simply?",
      "Why was this book so controversial?",
      "Quiz me on the main ideas",
    ],
    cannedChat: [
      {
        q: "What is natural selection — simply?",
        a: "**Natural selection** is the slow, blind editor of life. It rests on three observations:\n\n1. Individuals in any population **vary** — beak shapes, fur length, immune responses.\n2. Some of that variation is **heritable** — children resemble parents.\n3. More offspring are born than can survive, so traits that help survival and reproduction **become more common** generation by generation.\n\nDarwin's leap was that this simple loop, run for millions of years, is enough to produce every form of life we see — no designer required.",
      },
    ],
    quiz: [
      { q: "What did Darwin call his proposed mechanism?", choices: ["Inheritance of acquired traits", "Natural selection", "Spontaneous generation", "Random drift"], correct: 1, explain: "He distinguished it sharply from Lamarck's 'inheritance of acquired characteristics.'" },
      { q: "Which voyage shaped his thinking?", choices: ["HMS Beagle", "HMS Bounty", "HMS Endeavour", "HMS Victory"], correct: 0, explain: "His five-year voyage on the Beagle gave him the Galápagos data behind the theory." },
      { q: "Why did the book provoke controversy?", choices: ["It was poorly argued", "It implied humans descended from earlier species", "It denied the existence of fossils", "It claimed Earth was young"], correct: 1, explain: "The implication for human origins (made explicit later in *The Descent of Man*) was the flashpoint." },
    ],
  },
  {
    id: "tao",
    topics: ["philosophy", "self-help", "art"],
    title: "道德經",
    author: "Lao Tzu — Tao Te Ching",
    cover: { bg: "linear-gradient(135deg,#94C48A,#3D6B44)", emoji: "☯️" },
    origLang: "Classical Chinese",
    origExcerpt: "道可道，非常道。名可名，非常名。",
    enExcerpt: "The Tao that can be spoken is not the eternal Tao. The name that can be named is not the eternal name.",
    chatPrompts: [
      "What does 'wu wei' actually mean?",
      "How is this different from Confucianism?",
      "Quiz me on the core ideas",
    ],
    cannedChat: [
      {
        q: "What does 'wu wei' actually mean?",
        a: "**Wu wei** (無為) is often translated 'non-action,' but a better gloss is **effortless action** — moving with the grain of a situation instead of against it.\n\nThink of how water finds its way around a rock without fighting it, or how a skilled cook's knife slips between joints rather than cleaving through bone. The point isn't passivity; it's that forced effort against the Tao creates friction, while aligned action achieves more with less.\n\nFor leaders, Lao Tzu's prescription is famous: *govern a great state as you would cook a small fish* — don't keep poking at it.",
      },
    ],
    quiz: [
      { q: "What is 'wu wei' best translated as?", choices: ["Stillness", "Effortless action / non-forcing", "Silence", "Hiding"], correct: 1, explain: "Not doing nothing — doing without strain or coercion." },
      { q: "Why does Lao Tzu warn against naming the Tao?", choices: ["It's secret", "Naming reduces what is infinite to a label", "It's sacred", "The name is forbidden"], correct: 1, explain: "Language slices reality into pieces; the Tao is the whole." },
      { q: "Lao Tzu's image for ideal leadership is…", choices: ["A roaring tiger", "A small fish gently cooked", "An eagle", "A river"], correct: 1, explain: "Govern lightly — too much fiddling breaks the fish (and the state)." },
    ],
  },
  {
    id: "sonnets",
    topics: ["art", "fiction"],
    title: "Shakespeare's Sonnets",
    author: "William Shakespeare",
    cover: { bg: "linear-gradient(135deg,#E0A450,#8E5C18)", emoji: "🪶" },
    origLang: "Early Modern English",
    origExcerpt: "Shall I compare thee to a summer's day? Thou art more lovely and more temperate…",
    enExcerpt: "Shall I compare you to a summer's day? You are more lovely and more even-tempered — rough winds shake May's buds, and summer is always too brief.",
    chatPrompts: [
      "Explain the structure of a sonnet",
      "What makes Sonnet 18 famous?",
      "Quiz me on Shakespearean form",
    ],
    cannedChat: [
      {
        q: "Explain the structure of a sonnet",
        a: "A **Shakespearean sonnet** is a 14-line poem in iambic pentameter, organised as three quatrains and a closing couplet — rhymed **ABAB CDCD EFEF GG**.\n\nThe form is an argument in miniature: each quatrain advances a thought, then the couplet delivers a turn (the *volta*) — a punchline, reversal, or summary. Sonnet 18 follows this exactly: three quatrains praising the beloved by comparison to summer, then a closing couplet promising that the poem itself will outlive the season.",
      },
    ],
    quiz: [
      { q: "How many lines is a Shakespearean sonnet?", choices: ["12", "14", "16", "20"], correct: 1, explain: "Always 14, in iambic pentameter." },
      { q: "What is the volta?", choices: ["The opening line", "The turn — usually at line 9 or in the couplet", "The rhyme scheme", "An Italian sonnet only"], correct: 1, explain: "In Shakespearean form, the turn often lands in the final couplet." },
      { q: "What does the closing couplet of Sonnet 18 promise?", choices: ["Eternal love", "That the poem will preserve the beloved forever", "Reunion in spring", "Forgiveness"], correct: 1, explain: "'So long as men can breathe or eyes can see, / So long lives this, and this gives life to thee.'" },
    ],
  },
  {
    id: "thinking-fast",
    topics: ["self-help", "tech", "business"],
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    cover: { bg: "linear-gradient(135deg,#3D2D5C,#1A1230)", emoji: "🧠" },
    origLang: "English",
    origExcerpt: "System 1 operates automatically and quickly, with little or no effort and no sense of voluntary control…",
    enExcerpt: "System 1 operates automatically and quickly, with little or no effort and no sense of voluntary control. System 2 allocates attention to the effortful mental activities that demand it, including complex computations.",
    chatPrompts: [
      "What's the difference between System 1 and System 2?",
      "Give me an example of an anchoring effect",
      "Quiz me on cognitive biases",
    ],
    cannedChat: [
      {
        q: "What's the difference between System 1 and System 2?",
        a: "**System 1** is fast, automatic, and intuitive. It reads facial expressions, completes the phrase 'bread and ___,' and notices when a sentence is grammatically off. It runs constantly, costs almost no effort, and is the source of most of our impressions and feelings.\n\n**System 2** is slow, effortful, and analytical. It multiplies 17 × 24, checks the validity of an argument, and resists temptations. It's where we feel like we 'think' — but Kahneman's punchline is that System 2 is **lazy**: it usually accepts System 1's answers without checking them. Most of life's errors live in that handoff.",
      },
    ],
    quiz: [
      { q: "Which system is fast and intuitive?", choices: ["System 1", "System 2", "Both", "Neither"], correct: 0, explain: "System 1 — fast, automatic, almost effortless." },
      { q: "What is anchoring?", choices: ["A memory trick", "Letting an irrelevant number bias a later judgement", "A decision rule", "A meditation practice"], correct: 1, explain: "Even random numbers shown to you can shift estimates that follow." },
      { q: "What does Kahneman say about System 2?", choices: ["It's always vigilant", "It is lazy and often accepts System 1's answers", "It overrides System 1 by default", "It only runs during sleep"], correct: 1, explain: "Most cognitive bias arises because System 2 doesn't bother to check." },
    ],
  },
];

// ─── Audio cues ───────────────────────────────────────────────────────────────
function playTone(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.12) {
  if (typeof window === "undefined") return;
  try {
    type WinAC = { webkitAudioContext?: typeof AudioContext };
    const AC = window.AudioContext ?? (window as unknown as WinAC).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.connect(vol); vol.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    vol.gain.setValueAtTime(gain, ctx.currentTime);
    vol.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
    osc.onended = () => ctx.close();
  } catch { /* autoplay or unsupported */ }
}
const SFX = {
  tap:     () => playTone(880, 0.06, "sine", 0.10),
  select:  () => { playTone(523, 0.09); setTimeout(() => playTone(659, 0.10), 70); },
  advance: () => { playTone(523, 0.08); setTimeout(() => playTone(659, 0.08), 90); setTimeout(() => playTone(784, 0.15), 180); },
  correct: () => [659, 880].forEach((f, i) => setTimeout(() => playTone(f, 0.13, "sine", 0.13), i * 90)),
  wrong:   () => playTone(220, 0.18, "sawtooth", 0.07),
  success: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.18, "sine", 0.14), i * 95)),
  error:   () => playTone(200, 0.2, "sawtooth", 0.08),
};

// ─── Root component ───────────────────────────────────────────────────────────
export function JoinClient() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [topics, setTopics] = useState<TopicId[]>([]);
  const [chosenBook, setChosenBook] = useState<SampleBook | null>(null);
  const [experienceDone, setExperienceDone] = useState(false);

  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const stepIdx = STEP_ORDER.indexOf(step);
  const TOTAL = STEP_ORDER.length;

  const goNext = (next: Step) => { SFX.advance(); setStep(next); };
  const goBack = (prev: Step) => { SFX.tap(); setStep(prev); };

  // Persist email across reload — helps if user closes app between steps.
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("join.email");
      if (cached && !email) setEmail(cached);
    } catch { /* ignore */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (email) sessionStorage.setItem("join.email", email);
    } catch { /* ignore */ }
  }, [email]);

  // Capture referrer once on mount — needed so trackLead carries attribution
  // through every step without recomputing.
  const referrerRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (typeof document !== "undefined") {
      referrerRef.current = document.referrer || undefined;
    }
  }, []);

  // ─── Step handlers ─────────────────────────────────────────────────────────
  const handleEmail = () => {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!ok) { setErr("Enter a valid email — we'll send your library link there."); SFX.error(); return; }
    setErr(null);
    // Capture the lead the moment we have a valid email — the rest of the
    // funnel is gravy. If they bounce now we still have an address to follow
    // up on.
    trackLead({ email, step: "email", referrer: referrerRef.current });
    goNext("topics");
  };

  const handleTopicsContinue = () => {
    if (topics.length === 0) { SFX.error(); return; }
    trackLead({ email, step: "topics", topics });
    goNext("shelf");
  };

  const handleBookChoose = (b: SampleBook) => {
    SFX.select();
    setChosenBook(b);
    trackLead({ email, step: "shelf", topics, chosen_book_id: b.id });
    goNext("experience");
  };

  const handleExperienceDone = () => {
    setExperienceDone(true);
    SFX.success();
    trackLead({ email, step: "experience", topics, chosen_book_id: chosenBook?.id ?? null });
    setTimeout(() => goNext("signup"), 800);
  };

  const handleFinish = async () => {
    if (!pw || pw.length < 8) { setErr("Pick a password — 8 characters or more."); SFX.error(); return; }
    setErr(null); setBusy(true);
    // Mark that we reached the signup form (separate from "completed" — they
    // might still fail at the register call and we want to know they got here).
    trackLead({ email, step: "signup", topics, chosen_book_id: chosenBook?.id ?? null });
    try {
      await register(email, pw, name || undefined);
      // Final mark — the lead is now a real customer. The backend will stamp
      // completed_at and (eventually) link user_id.
      trackLead({ email, step: "completed", topics, chosen_book_id: chosenBook?.id ?? null });
      SFX.success(); setCelebrate(true);
      setTimeout(() => router.push("/library?welcome=1"), 1800);
    } catch (e) {
      SFX.error();
      setErr(e instanceof ApiError ? e.message : "Couldn't create your shelf. Try again?");
    } finally { setBusy(false); }
  };

  // Recommended books — surface 4-6 across selected topics, then top up.
  const shelf = useMemo(() => {
    const selected = SAMPLE_BOOKS.filter((b) => b.topics.some((t) => topics.includes(t)));
    const rest = SAMPLE_BOOKS.filter((b) => !selected.includes(b));
    return [...selected, ...rest].slice(0, 5);
  }, [topics]);

  return (
    <div
      className="relative min-h-[100dvh] overflow-x-hidden"
      style={{
        background: "var(--color-paper)",
        backgroundImage: "radial-gradient(circle, rgba(74,60,30,0.06) 1.4px, transparent 1.4px)",
        backgroundSize: "26px 26px",
      }}
    >
      {celebrate && <Confetti />}

      {/* Top bar — minimal, mobile-thumb friendly */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 backdrop-blur-md" style={{ background: "rgba(252,248,238,0.85)", borderBottom: "1px solid rgba(74,60,30,0.06)" }}>
        {step !== "email" ? (
          <button
            type="button"
            onClick={() => {
              const prev = STEP_ORDER[Math.max(0, stepIdx - 1)];
              goBack(prev);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-90"
            style={{ background: "white", border: "1.5px solid var(--color-border)", boxShadow: "0 2px 0 rgba(74,60,30,0.08)" }}
            aria-label="Back"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        ) : (
          <Link href="/" className="flex items-center gap-2" style={{ color: "var(--color-ink)" }}>
            <TranslifyIcon size={26} />
            <span className="font-[family-name:var(--font-display)] text-[1rem] font-semibold tracking-tight">Translify</span>
          </Link>
        )}

        {/* Step pill */}
        <div className="flex items-center gap-1.5">
          {STEP_ORDER.map((s, i) => (
            <span
              key={s}
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: i === stepIdx ? 22 : 6,
                background: i <= stepIdx ? "var(--color-saffron-deep)" : "rgba(74,60,30,0.15)",
              }}
            />
          ))}
        </div>

        {step === "email" ? (
          <Link
            href="/login"
            className="text-[0.82rem] font-semibold"
            style={{ color: "var(--color-ink-soft)" }}
          >
            Sign in
          </Link>
        ) : (
          <span className="w-9" /> /* spacer */
        )}
      </header>

      <main className="relative z-10 mx-auto w-full max-w-md px-4 pb-32 pt-4 sm:max-w-lg sm:pt-8">
        <div key={step} className="ob-enter-forward">
          {step === "email" && (
            <StepEmail
              email={email} setEmail={setEmail}
              onContinue={handleEmail} err={err}
            />
          )}
          {step === "topics" && (
            <StepTopics
              topics={topics} setTopics={setTopics}
              onContinue={handleTopicsContinue}
            />
          )}
          {step === "shelf" && (
            <StepShelf books={shelf} onChoose={handleBookChoose} />
          )}
          {step === "experience" && chosenBook && (
            <StepExperience
              book={chosenBook}
              onDone={handleExperienceDone}
            />
          )}
          {step === "signup" && (
            <StepFinish
              email={email}
              name={name} setName={setName}
              pw={pw} setPw={setPw}
              busy={busy} err={err}
              celebrate={celebrate}
              onFinish={handleFinish}
              experienceDone={experienceDone}
              chosenBook={chosenBook}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Step 1 — Email only ──────────────────────────────────────────────────────
function StepEmail({
  email, setEmail, onContinue, err,
}: {
  email: string;
  setEmail: (v: string) => void;
  onContinue: () => void;
  err: string | null;
}) {
  return (
    <div className="flex flex-col">
      <div className="mb-6 flex justify-center">
        <Lumi state="waving" size={108} animate />
      </div>

      <div className="text-center">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--color-saffron-deep)" }}>
          Welcome
        </p>
        <h1
          className="mt-2 font-[family-name:var(--font-display)] font-semibold leading-[1.04] tracking-tight"
          style={{ fontSize: "clamp(2rem,7vw,2.6rem)", color: "var(--color-ink)" }}
        >
          Read any book.
          <br />
          <span style={{ color: "var(--color-saffron-deep)" }}>In your language.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-[26ch] text-[0.95rem] leading-relaxed" style={{ color: "var(--color-ink-soft)" }}>
          Try Translify for free — no card, no commitment. Just start with your email.
        </p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); onContinue(); }}
        className="mt-7 flex flex-col gap-3"
      >
        <GameField
          icon="📧"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
          autoFocus
        />
        {err && (
          <div className="rounded-xl px-3 py-2 text-[0.84rem] font-medium" style={{ background: "rgba(220,38,38,0.07)", color: "#B91C1C", border: "1.5px solid rgba(220,38,38,0.22)" }}>
            {err}
          </div>
        )}

        <BigButton type="submit" disabled={!email}>
          Continue →
        </BigButton>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
        <span className="text-[0.7rem] font-semibold uppercase tracking-wider" style={{ color: "var(--color-ink-soft)" }}>or</span>
        <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
      </div>

      <GoogleButton />

      <p className="mt-6 text-center text-[0.78rem]" style={{ color: "var(--color-ink-soft)" }}>
        By continuing you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-4">Terms</Link> &{" "}
        <Link href="/privacy" className="underline underline-offset-4">Privacy</Link>.
      </p>
    </div>
  );
}

// ─── Step 2 — Pick topics ─────────────────────────────────────────────────────
function StepTopics({
  topics, setTopics, onContinue,
}: {
  topics: TopicId[];
  setTopics: (fn: (prev: TopicId[]) => TopicId[]) => void;
  onContinue: () => void;
}) {
  const toggle = (id: TopicId) => {
    SFX.tap();
    setTopics((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  };

  return (
    <div>
      <div className="text-center">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--color-sage-deep)" }}>
          Step 2 of 5
        </p>
        <h2
          className="mt-2 font-[family-name:var(--font-display)] font-semibold leading-[1.05] tracking-tight"
          style={{ fontSize: "clamp(1.7rem,5.5vw,2.2rem)", color: "var(--color-ink)" }}
        >
          What do you love reading?
        </h2>
        <p className="mx-auto mt-2 max-w-[28ch] text-[0.92rem]" style={{ color: "var(--color-ink-soft)" }}>
          Pick one or more — we&apos;ll start your shelf with those.
        </p>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3">
        {TOPICS.map((t, i) => {
          const selected = topics.includes(t.id);
          const tone = TONE_MAP[t.tone];
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              className="group relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 px-3 py-5 text-center transition-all duration-200 active:scale-[0.97] animate-float-in"
              style={{
                animationDelay: `${i * 0.04}s`,
                borderColor: selected ? tone.ring : "var(--color-border-strong)",
                background: selected ? tone.bg : "white",
                boxShadow: selected ? `0 5px 0 ${tone.ring}40` : "0 3px 0 rgba(74,60,30,0.08)",
                transform: selected ? "translateY(-2px)" : "translateY(0)",
              }}
            >
              <span className="text-[1.7rem] leading-none">{t.icon}</span>
              <span className="font-[family-name:var(--font-display)] text-[0.9rem] font-semibold" style={{ color: "var(--color-ink)" }}>
                {t.label}
              </span>
              {selected && (
                <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full text-white animate-pop-in" style={{ background: tone.deep }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <FixedFooter>
        <BigButton onClick={onContinue} disabled={topics.length === 0}>
          {topics.length === 0 ? "Pick at least one" : `Continue (${topics.length}) →`}
        </BigButton>
      </FixedFooter>
    </div>
  );
}

// ─── Step 3 — Sample shelf ────────────────────────────────────────────────────
function StepShelf({
  books, onChoose,
}: {
  books: SampleBook[];
  onChoose: (b: SampleBook) => void;
}) {
  return (
    <div>
      <div className="text-center">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--color-plum)" }}>
          Your starter shelf
        </p>
        <h2
          className="mt-2 font-[family-name:var(--font-display)] font-semibold leading-[1.05] tracking-tight"
          style={{ fontSize: "clamp(1.7rem,5.5vw,2.2rem)", color: "var(--color-ink)" }}
        >
          Open one to try the magic
        </h2>
        <p className="mx-auto mt-2 max-w-[30ch] text-[0.92rem]" style={{ color: "var(--color-ink-soft)" }}>
          Read a passage, chat with the book, take a tiny quiz. No account needed yet.
        </p>
      </div>

      <ul className="mt-7 flex flex-col gap-3">
        {books.map((b, i) => (
          <li key={b.id}>
            <button
              type="button"
              onClick={() => onChoose(b)}
              className="group flex w-full items-center gap-4 rounded-2xl border-2 p-3.5 text-start transition-all active:scale-[0.99] animate-float-in"
              style={{
                animationDelay: `${i * 0.06}s`,
                borderColor: "var(--color-border-strong)",
                background: "white",
                boxShadow: "0 4px 0 rgba(74,60,30,0.10)",
              }}
            >
              {/* Mini cover */}
              <div
                className="relative grid h-20 w-14 shrink-0 place-items-center overflow-hidden rounded-md"
                style={{ background: b.cover.bg, boxShadow: "2px 3px 0 rgba(74,60,30,0.18)" }}
              >
                <span className="text-[1.8rem]">{b.cover.emoji}</span>
                <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: "rgba(0,0,0,0.25)" }} />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-[family-name:var(--font-display)] text-[1rem] font-semibold leading-tight" style={{ color: "var(--color-ink)" }}>
                  {b.title}
                </h3>
                <p className="mt-0.5 truncate text-[0.82rem]" style={{ color: "var(--color-ink-soft)" }}>{b.author}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {b.topics.slice(0, 2).map((tid) => {
                    const t = TOPICS.find((x) => x.id === tid)!;
                    return (
                      <span key={tid} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.66rem] font-semibold"
                            style={{ background: TONE_MAP[t.tone].iconBg, color: TONE_MAP[t.tone].iconColor }}>
                        {t.icon} {t.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition-transform group-active:translate-x-0.5"
                style={{ background: "var(--color-saffron-deep)", color: "white", boxShadow: "0 3px 0 rgba(152,96,24,0.50)" }}
                aria-hidden
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-center text-[0.78rem]" style={{ color: "var(--color-ink-soft)" }}>
        You&apos;ll bring your own books after signup — PDFs, EPUBs, anything.
      </p>
    </div>
  );
}

// ─── Step 4 — Try the magic ───────────────────────────────────────────────────
type ExpTab = "read" | "chat" | "quiz";

function StepExperience({
  book, onDone,
}: {
  book: SampleBook;
  onDone: () => void;
}) {
  const [tab, setTab] = useState<ExpTab>("read");
  const [translated, setTranslated] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "lumi"; text: string }[]>([]);
  const [chatTyping, setChatTyping] = useState(false);

  const [qi, setQi] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);

  // Track which milestones the user has hit — gate the "Save my progress" CTA
  const [hits, setHits] = useState({ read: false, chat: false, quiz: false });
  const allHit = hits.read && hits.chat && hits.quiz;

  useEffect(() => { if (translated) setHits((h) => ({ ...h, read: true })); }, [translated]);
  useEffect(() => { if (chatMessages.length > 0) setHits((h) => ({ ...h, chat: true })); }, [chatMessages.length]);

  const askPrompt = (prompt: string) => {
    SFX.tap();
    setChatMessages((prev) => [...prev, { role: "user", text: prompt }]);
    setChatTyping(true);
    // Find a canned reply — fallback to the first canned answer.
    const canned = book.cannedChat.find((c) => c.q.toLowerCase() === prompt.toLowerCase()) ?? book.cannedChat[0];
    setTimeout(() => {
      setChatTyping(false);
      setChatMessages((prev) => [...prev, { role: "lumi", text: canned.a }]);
    }, 900);
  };

  const submitAnswer = (choice: number) => {
    if (revealed) return;
    SFX.tap();
    setSelected(choice);
    setRevealed(true);
    const correct = book.quiz[qi].correct;
    if (choice === correct) { SFX.correct(); setScore((s) => s + 1); }
    else SFX.wrong();
  };

  const nextQuiz = () => {
    if (qi < book.quiz.length - 1) {
      setQi((i) => i + 1); setSelected(null); setRevealed(false);
    } else {
      setHits((h) => ({ ...h, quiz: true }));
      SFX.success();
    }
  };

  const quizDone = qi === book.quiz.length - 1 && revealed;

  return (
    <div>
      {/* Book hero — compact card with cover and meta */}
      <div className="mb-4 flex items-stretch gap-3 rounded-2xl border-2 p-3" style={{ borderColor: "var(--color-border)", background: "white", boxShadow: "0 4px 0 rgba(74,60,30,0.08)" }}>
        <div
          className="relative grid h-24 w-16 shrink-0 place-items-center overflow-hidden rounded-md"
          style={{ background: book.cover.bg, boxShadow: "2px 3px 0 rgba(74,60,30,0.18)" }}
        >
          <span className="text-[2rem]">{book.cover.emoji}</span>
          <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: "rgba(0,0,0,0.25)" }} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <p className="text-[0.66rem] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--color-saffron-deep)" }}>
            Trying a sample
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-[1.05rem] font-semibold leading-tight" style={{ color: "var(--color-ink)" }}>
            {book.title}
          </h2>
          <p className="text-[0.78rem]" style={{ color: "var(--color-ink-soft)" }}>{book.author}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-3 grid grid-cols-3 gap-1.5 rounded-full p-1.5" style={{ background: "rgba(74,60,30,0.08)" }}>
        {(["read", "chat", "quiz"] as const).map((t) => {
          const active = tab === t;
          const label = t === "read" ? "📖 Read" : t === "chat" ? "💬 Chat" : "🎯 Quiz";
          const done = hits[t];
          return (
            <button
              key={t}
              type="button"
              onClick={() => { SFX.tap(); setTab(t); }}
              className="relative flex items-center justify-center gap-1 rounded-full py-2 font-[family-name:var(--font-display)] text-[0.82rem] font-semibold transition-all"
              style={{
                background: active ? "white" : "transparent",
                color: active ? "var(--color-ink)" : "var(--color-ink-soft)",
                boxShadow: active ? "0 2px 0 rgba(74,60,30,0.12)" : "none",
              }}
            >
              {label}
              {done && (
                <span className="grid h-3.5 w-3.5 place-items-center rounded-full text-white" style={{ background: "var(--color-sage-deep)" }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab panels */}
      <div className="rounded-2xl border-2 p-4" style={{ borderColor: "var(--color-border-strong)", background: "white", boxShadow: "0 4px 0 rgba(74,60,30,0.10)" }}>
        {tab === "read" && (
          <div>
            <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--color-ink-soft)" }}>
              Original ({book.origLang})
            </p>
            <p className="rounded-xl border p-3 text-[0.94rem] leading-relaxed" style={{ borderColor: "var(--color-border)", background: "var(--color-paper)", color: "var(--color-ink)" }}>
              {book.origExcerpt}
            </p>

            {!translated ? (
              <button
                type="button"
                onClick={() => { SFX.advance(); setTranslated(true); }}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-[family-name:var(--font-display)] text-[0.94rem] font-bold text-white transition-all active:translate-y-1"
                style={{ background: "linear-gradient(to bottom,#EDB86A,#D09040)", boxShadow: "0 4px 0 rgba(152,96,24,0.55)" }}
              >
                <span className="text-[1.05rem]">✨</span> Translate for me
              </button>
            ) : (
              <div className="animate-float-in">
                <div className="mt-4 flex items-center gap-2">
                  <span className="h-px flex-1" style={{ background: "var(--color-saffron)" }} />
                  <span className="text-[0.7rem] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--color-saffron-deep)" }}>
                    In your language
                  </span>
                  <span className="h-px flex-1" style={{ background: "var(--color-saffron)" }} />
                </div>
                <p className="mt-3 rounded-xl border-2 p-3 text-[0.96rem] leading-relaxed" style={{ borderColor: "var(--color-saffron)", background: "rgba(224,164,80,0.06)", color: "var(--color-ink)" }}>
                  {book.enExcerpt}
                </p>
                <p className="mt-3 text-center text-[0.78rem]" style={{ color: "var(--color-ink-soft)" }}>
                  Same passage, same layout — Translify keeps every book&apos;s shape intact.
                </p>
              </div>
            )}
          </div>
        )}

        {tab === "chat" && (
          <div>
            {chatMessages.length === 0 && !chatTyping ? (
              <div>
                <div className="mb-3 flex items-start gap-2">
                  <Lumi state="happy" size={42} animate />
                  <div className="rounded-2xl rounded-bl-md border-2 p-3 text-[0.88rem]" style={{ borderColor: "var(--color-border)", background: "var(--color-paper)", color: "var(--color-ink)" }}>
                    Ask the book anything. Try one of these to start —
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {book.chatPrompts.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => askPrompt(p)}
                      className="rounded-xl border-2 px-3.5 py-2.5 text-start text-[0.88rem] transition-all active:scale-[0.99]"
                      style={{ borderColor: "var(--color-border-strong)", background: "white", color: "var(--color-ink)", boxShadow: "0 3px 0 rgba(74,60,30,0.08)" }}
                    >
                      <span className="me-2 opacity-60">›</span>{p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {chatMessages.map((m, i) => (
                  <ChatBubble key={i} msg={m} />
                ))}
                {chatTyping && (
                  <div className="flex items-start gap-2 animate-float-in">
                    <Lumi state="thinking" size={36} animate />
                    <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border-2 px-3 py-2.5" style={{ borderColor: "var(--color-border)", background: "var(--color-paper)" }}>
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-ink-soft)", animation: `dot-pulse 1.1s ease-in-out ${i * 0.18}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}
                <style>{`@keyframes dot-pulse{0%,80%,100%{opacity:.3;transform:scale(.7)}40%{opacity:1;transform:scale(1)}}`}</style>
                {chatMessages.length > 0 && !chatTyping && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {book.chatPrompts.filter((p) => !chatMessages.some((m) => m.text === p)).map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => askPrompt(p)}
                        className="rounded-full border px-3 py-1 text-[0.78rem] transition-all active:scale-95"
                        style={{ borderColor: "var(--color-border)", background: "white", color: "var(--color-ink-soft)" }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "quiz" && (
          <div>
            {!hits.quiz ? (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--color-coral-deep)" }}>
                    Question {qi + 1} / {book.quiz.length}
                  </p>
                  <div className="flex items-center gap-1">
                    {book.quiz.map((_, i) => (
                      <span key={i} className="h-1.5 w-5 rounded-full" style={{ background: i <= qi ? "var(--color-coral-deep)" : "rgba(74,60,30,0.15)" }} />
                    ))}
                  </div>
                </div>

                <h3 className="font-[family-name:var(--font-display)] text-[1.1rem] font-semibold leading-snug" style={{ color: "var(--color-ink)" }}>
                  {book.quiz[qi].q}
                </h3>

                <div className="mt-4 flex flex-col gap-2">
                  {book.quiz[qi].choices.map((c, i) => {
                    const isPicked = selected === i;
                    const isCorrect = book.quiz[qi].correct === i;
                    const bg = !revealed
                      ? "white"
                      : isCorrect ? "rgba(123,161,124,0.18)" : isPicked ? "rgba(226,120,108,0.16)" : "white";
                    const border = !revealed
                      ? "var(--color-border-strong)"
                      : isCorrect ? "var(--color-sage-deep)" : isPicked ? "var(--color-coral-deep)" : "var(--color-border)";
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={revealed}
                        onClick={() => submitAnswer(i)}
                        className="flex items-center justify-between gap-3 rounded-xl border-2 px-3.5 py-3 text-start transition-all active:scale-[0.99] disabled:cursor-default"
                        style={{ borderColor: border, background: bg, boxShadow: revealed ? "none" : "0 3px 0 rgba(74,60,30,0.08)", color: "var(--color-ink)" }}
                      >
                        <span className="text-[0.92rem]">{c}</span>
                        {revealed && isCorrect && (
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-white" style={{ background: "var(--color-sage-deep)" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                          </span>
                        )}
                        {revealed && isPicked && !isCorrect && (
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-white" style={{ background: "var(--color-coral-deep)" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {revealed && (
                  <div className="mt-4 animate-float-in rounded-xl border-2 p-3 text-[0.86rem]" style={{ borderColor: selected === book.quiz[qi].correct ? "var(--color-sage-deep)" : "var(--color-saffron-deep)", background: selected === book.quiz[qi].correct ? "rgba(123,161,124,0.08)" : "rgba(224,164,80,0.08)", color: "var(--color-ink)" }}>
                    <span className="me-1 font-bold" style={{ color: selected === book.quiz[qi].correct ? "var(--color-sage-deep)" : "var(--color-saffron-deep)" }}>
                      {selected === book.quiz[qi].correct ? "Nice!" : "Close —"}
                    </span>
                    {book.quiz[qi].explain}
                  </div>
                )}

                {revealed && (
                  <button
                    type="button"
                    onClick={nextQuiz}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-[family-name:var(--font-display)] text-[0.95rem] font-bold text-white transition-all active:translate-y-1"
                    style={{ background: "linear-gradient(to bottom,#EDB86A,#D09040)", boxShadow: "0 4px 0 rgba(152,96,24,0.55)" }}
                  >
                    {qi < book.quiz.length - 1 ? "Next question →" : "See my score →"}
                  </button>
                )}
              </>
            ) : (
              <div className="text-center animate-float-in">
                <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full text-3xl animate-pop-in" style={{ background: "rgba(224,164,80,0.15)" }}>
                  🎉
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-[1.3rem] font-semibold" style={{ color: "var(--color-ink)" }}>
                  {score} / {book.quiz.length} right
                </h3>
                <p className="mt-1.5 text-[0.88rem]" style={{ color: "var(--color-ink-soft)" }}>
                  {score === book.quiz.length ? "Perfect run." : score >= book.quiz.length - 1 ? "Almost perfect." : "Not bad for a sneak peek."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hint about remaining tabs */}
      {!allHit && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl px-4 py-3" style={{ background: "rgba(224,164,80,0.07)", border: "1.5px solid rgba(224,164,80,0.2)" }}>
          <span className="text-[1.1rem]">💡</span>
          <p className="text-[0.84rem]" style={{ color: "var(--color-ink-soft)" }}>
            {(["read", "chat", "quiz"] as const).filter((t) => !hits[t]).length === 1
              ? "One more tab to try — then save your shelf."
              : "Try each tab to see what Translify does — then we'll save your shelf."}
          </p>
        </div>
      )}

      <FixedFooter>
        <BigButton onClick={onDone} disabled={!allHit}>
          {allHit ? "Save my shelf →" : "Try every tab to continue"}
        </BigButton>
      </FixedFooter>
    </div>
  );
}

function ChatBubble({ msg }: { msg: { role: "user" | "lumi"; text: string } }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end animate-float-in">
        <div className="max-w-[80%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-[0.9rem] leading-relaxed" style={{ background: "var(--color-saffron-deep)", color: "white", boxShadow: "0 3px 0 rgba(152,96,24,0.45)" }}>
          {msg.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 animate-float-in">
      <Lumi state="happy" size={38} animate />
      <div className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-bl-md border-2 px-3.5 py-2.5 text-[0.9rem] leading-relaxed" style={{ borderColor: "var(--color-border)", background: "var(--color-paper)", color: "var(--color-ink)" }}>
        {/* Lightweight markdown — render **bold** and *italic* */}
        <MiniMarkdown text={msg.text} />
      </div>
    </div>
  );
}

function MiniMarkdown({ text }: { text: string }) {
  // Tiny, safe replacement of **bold** and *italic*. No HTML injection.
  const parts: React.ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0; let m: RegExpExecArray | null; let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<strong key={key++} style={{ color: "var(--color-ink)" }}>{m[1]}</strong>);
    else if (m[2]) parts.push(<em key={key++}>{m[2]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

// ─── Step 5 — Finish account ──────────────────────────────────────────────────
function StepFinish({
  email, name, setName, pw, setPw, busy, err, celebrate, onFinish, experienceDone, chosenBook,
}: {
  email: string;
  name: string; setName: (s: string) => void;
  pw: string; setPw: (s: string) => void;
  busy: boolean; err: string | null;
  celebrate: boolean;
  onFinish: () => void;
  experienceDone: boolean;
  chosenBook: SampleBook | null;
}) {
  const ready = pw.length >= 8 && !busy;

  if (celebrate) {
    return (
      <div className="mt-10 text-center">
        <div className="mx-auto mb-4 grid h-24 w-24 animate-pop-in place-items-center rounded-full text-5xl" style={{ background: "rgba(224,164,80,0.16)" }}>
          🎉
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-[1.8rem] font-semibold" style={{ color: "var(--color-ink)" }}>
          Your shelf is ready!
        </h2>
        <p className="mt-2 text-[0.95rem]" style={{ color: "var(--color-ink-soft)" }}>
          Taking you to your library…
        </p>
        <div className="mt-6 flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--color-saffron)", animation: `dot-bounce 0.9s ease-in-out ${i * 0.22}s infinite` }} />
          ))}
        </div>
        <style>{`@keyframes dot-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-10px)}}`}</style>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center">
        <div className="mx-auto mb-4 flex justify-center">
          <Lumi state={experienceDone ? "celebrating" : "happy"} size={92} animate />
        </div>
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--color-saffron-deep)" }}>
          Last step
        </p>
        <h2
          className="mt-2 font-[family-name:var(--font-display)] font-semibold leading-[1.05] tracking-tight"
          style={{ fontSize: "clamp(1.6rem,5.2vw,2.1rem)", color: "var(--color-ink)" }}
        >
          Save your shelf
        </h2>
        <p className="mx-auto mt-2 max-w-[30ch] text-[0.92rem]" style={{ color: "var(--color-ink-soft)" }}>
          {chosenBook
            ? `We'll keep ${chosenBook.title} bookmarked, plus everything you upload from here on.`
            : "Your reading progress, books, chats and quizzes — saved to your account."}
        </p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); onFinish(); }}
        className="mt-6 flex flex-col gap-3"
      >
        <div className="flex items-center gap-3 rounded-2xl border-2 px-4 py-3" style={{ borderColor: "var(--color-border)", background: "rgba(123,161,124,0.07)" }}>
          <span className="text-[1.1rem]">📧</span>
          <span className="flex-1 text-[0.92rem] font-medium" style={{ color: "var(--color-ink)" }}>{email}</span>
          <span className="grid h-5 w-5 place-items-center rounded-full text-[0.6rem] font-bold text-white" style={{ background: "var(--color-sage-deep)" }}>✓</span>
        </div>

        <GameField icon="👤" type="text"     placeholder="Your name (optional)"     value={name} onChange={setName} autoComplete="name" />
        <GameField icon="🔒" type="password" placeholder="Choose a password (8+)"   value={pw}   onChange={setPw}   autoComplete="new-password" required minLength={8} autoFocus />

        {err && (
          <div className="rounded-xl px-3 py-2 text-[0.84rem] font-medium" style={{ background: "rgba(220,38,38,0.07)", color: "#B91C1C", border: "1.5px solid rgba(220,38,38,0.22)" }}>
            {err}
          </div>
        )}

        <BigButton type="submit" disabled={!ready}>
          {busy ? "Creating your shelf…" : "Save my shelf →"}
        </BigButton>

        <p className="text-center text-[0.74rem]" style={{ color: "var(--color-ink-soft)" }}>
          Free 30-day trial · No credit card · Cancel anytime
        </p>
      </form>
    </div>
  );
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────
function GameField({
  icon, type, placeholder, value, onChange, autoComplete, required, minLength, autoFocus,
}: {
  icon: string; type: string; placeholder: string; value: string;
  onChange: (v: string) => void;
  autoComplete?: string; required?: boolean; minLength?: number; autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 transition-all duration-150"
      style={{
        border: focused ? "2px solid var(--color-saffron-deep)" : "2px solid var(--color-border-strong)",
        boxShadow: focused ? "0 0 0 4px rgba(224,164,80,0.14),0 4px 0 rgba(74,60,30,0.07)" : "0 3px 0 rgba(74,60,30,0.08)",
        background: focused ? "var(--color-paper)" : "white",
      }}
    >
      <span className="shrink-0 text-[1.2rem] leading-none">{icon}</span>
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete} required={required} minLength={minLength}
        autoFocus={autoFocus}
        className="flex-1 bg-transparent py-3.5 text-[1rem] outline-none"
        style={{ color: "var(--color-ink)", caretColor: "var(--color-saffron-deep)" }}
      />
      {value && (
        <span className="animate-pop-in grid h-5 w-5 shrink-0 place-items-center rounded-full text-[0.58rem] font-bold text-white" style={{ background: "var(--color-sage-deep)" }}>✓</span>
      )}
    </div>
  );
}

function BigButton({
  children, onClick, disabled, type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const [pressed, setPressed] = useState(false);
  const live = !disabled;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      className="h-14 w-full rounded-2xl font-[family-name:var(--font-display)] text-[1.05rem] font-bold transition-[transform,box-shadow] duration-75 disabled:cursor-not-allowed"
      style={{
        background: live ? "linear-gradient(to bottom,#EDB86A,#D09040)" : "rgba(74,60,30,0.10)",
        color: live ? "white" : "rgba(74,60,30,0.35)",
        boxShadow: pressed || !live ? "none" : "0 6px 0 rgba(152,96,24,0.50)",
        transform: pressed && live ? "translateY(6px)" : "translateY(0)",
      }}
    >
      {children}
    </button>
  );
}

function FixedFooter({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Spacer so content above doesn't sit under the fixed bar */}
      <div className="h-24" />
      <div
        className="fixed inset-x-0 bottom-0 z-20 px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3 backdrop-blur-md"
        style={{ background: "rgba(252,248,238,0.92)", borderTop: "1px solid rgba(74,60,30,0.08)" }}
      >
        <div className="mx-auto w-full max-w-md sm:max-w-lg">
          {children}
        </div>
      </div>
    </>
  );
}

function GoogleButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const url = await getGoogleAuthUrl("https://translify.app/auth/google/callback");
      window.location.href = url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border-2 font-[family-name:var(--font-display)] text-[0.98rem] font-semibold transition-all active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        borderColor: "var(--color-border-strong)",
        background: "white",
        color: "var(--color-ink)",
        boxShadow: loading ? "none" : "0 4px 0 rgba(74,60,30,0.10)",
      }}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <GoogleLogo />
      )}
      {loading ? "Redirecting…" : "Continue with Google"}
    </button>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.25-.164-1.84H9v3.48h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.706 17.64 9.2z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
const CONFETTI = Array.from({ length: 48 }, (_, i) => ({
  id: i,
  col: ["#E0A450","#7BA17C","#E2786C","#6B5B95","#F8D47A","#94C48A","#F4A6A0","#B5A0CC"][i % 8],
  left: (i * 2.0833) % 100,
  delay: (i * 0.032) % 1.4,
  size: 6 + (i % 5),
  rot: (i * 41) % 360,
  dur: 1.5 + (i % 4) * 0.28,
}));

function Confetti() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {CONFETTI.map((p) => (
        <div key={p.id} className="absolute" style={{ left: `${p.left}%`, top: "-12px", width: p.size, height: Math.round(p.size * 0.55), background: p.col, borderRadius: 2, transform: `rotate(${p.rot}deg)`, animationName: "confetti-fall", animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`, animationTimingFunction: "ease-in", animationFillMode: "both" }} />
      ))}
      <style>{`@keyframes confetti-fall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(105vh) rotate(740deg);opacity:0}}`}</style>
    </div>
  );
}
