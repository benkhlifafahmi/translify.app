import type { Dict, Testimonial, FaqItem } from "./types";

export const en: Dict = {
  // Nav
  "nav.how": "How it works",
  "nav.features": "Features",
  "nav.pricing": "Pricing",
  "nav.faq": "FAQ",
  "nav.login": "Log in",
  "nav.cta": "Get started",

  // Hero
  "hero.badge": "For curious readers, big & small",
  "hero.title.1": "Read any book,",
  "hero.title.2": "in your language",
  "hero.subtitle":
    "Drop in a PDF or EPUB and Translify keeps the layout exactly the same — just translated. Then chat with your book and quiz yourself, so you actually remember what you read.",
  "hero.cta.primary": "Start your 30-day trial",
  "hero.cta.secondary": "See plans",
  "hero.bullet.1": "Layout preserved, page by page",
  "hero.bullet.2": "14 languages, every script",
  "hero.bullet.3": "Money-back in 30 days, no questions",

  // Trust strip
  "trust.stat1.n": "42,000+",
  "trust.stat1.l": "books translated",
  "trust.stat2.n": "14",
  "trust.stat2.l": "languages, every script",
  "trust.stat3.n": "9.4 / 10",
  "trust.stat3.l": "reader satisfaction",
  "trust.stat4.n": "30 days",
  "trust.stat4.l": "money-back, always",

  // Live demo
  "demo.badge": "Watch it work · live demo",
  "demo.title.1": "A whole reading day, in",
  "demo.title.2": "twenty-six seconds",

  // How it works
  "how.badge": "Three steps, ten minutes",
  "how.title.1": "From PDF to",
  "how.title.2": "a book you understand",
  "how.subtitle":
    "No setup. No fiddling with translation tools. No copy-pasting paragraphs into another tab. Drop, wait a coffee's worth of time, read.",
  "how.step1.title": "Drop your book",
  "how.step1.body":
    "PDF or EPUB, up to 200 MB. We accept textbooks, novels, papers, kids' books — anything readable.",
  "how.step2.title": "Pick a language",
  "how.step2.body":
    "Choose from 14 languages. We rebuild every page in your target language, keeping the original layout intact.",
  "how.step3.title": "Read, chat, quiz",
  "how.step3.body":
    "Open the book, ask questions in plain language, and let surprise quizzes seal what you learned.",

  // Features
  "feat.badge": "What you actually get",
  "feat.title.1": "Every tool you need to",
  "feat.title.2": "finish",
  "feat.title.3": "the book.",
  "feat.translate.eyebrow": "Translation",
  "feat.translate.title": "Same book. Same shape. Your language.",
  "feat.translate.body":
    "Tables stay tables. Headings stay headings. We rebuild every page so it looks like the original publisher did it — including right-to-left scripts, CJK, Devanagari, and all 14 supported languages.",
  "feat.translate.h1": "Side-by-side reading mode",
  "feat.translate.h2": "Inline source-text peek on hover",
  "feat.translate.h3": "Export translated PDF with notes",
  "feat.chat.eyebrow": "Chat",
  "feat.chat.title": "Ask the book. Get cited answers.",
  "feat.chat.body":
    "Every reply links to the exact passage it came from — page number, highlighted excerpt, and a jump button. No hallucinations dressed up as answers.",
  "feat.chat.h1": "Plain-language Q&A in any of 14 languages",
  "feat.chat.h2": "Auto-summaries by chapter",
  "feat.chat.h3": "Highlight to ask: select a passage, ask a question",
  "feat.quiz.eyebrow": "Quizzes",
  "feat.quiz.title": "Wrong? Here's where to look.",
  "feat.quiz.body":
    "Surprise quizzes generated from what you actually read. Miss one and we'll send you to the page that explains it — not a vague hand-wave.",
  "feat.quiz.h1": "5, 8 or 12 questions per round",
  "feat.quiz.h2": "Multiple choice, with citation per answer",
  "feat.quiz.h3": "Tracks streaks, weak spots, and improvements",

  // For everyone
  "audience.badge": "One library, every reader",
  "audience.title.1": "Built for the way",
  "audience.title.2": "your house",
  "audience.title.3": "reads.",
  "audience.students.who": "Students",
  "audience.students.line":
    "Read the syllabus in your strongest language. Quiz before exams. Cite pages without lifting the cover.",
  "audience.students.tag1": "University",
  "audience.students.tag2": "High school",
  "audience.students.tag3": "Self-study",
  "audience.readers.who": "Lifelong readers",
  "audience.readers.line":
    "Finally finish that French novel. Skim a German paper. Read a Japanese manga in your own pace, your own tongue.",
  "audience.readers.tag1": "Hobbyists",
  "audience.readers.tag2": "Polyglots",
  "audience.readers.tag3": "Travel",
  "audience.children.who": "Children",
  "audience.children.line":
    "A friendlier mascot, a lower reading age, kid-safe chat, and parents who can see exactly what's being read.",
  "audience.children.tag1": "Ages 7+",
  "audience.children.tag2": "Family library",
  "audience.children.tag3": "Parent dashboard",

  // Languages strip
  "langs.badge": "14 languages, every script",
  "langs.title":
    "Latin, Cyrillic, Arabic, CJK, Devanagari — we handle the typography so the page still feels like a book.",
  "langs.body":
    "That includes proper right-to-left flow for Arabic and Hebrew, vertical script support for CJK where the source uses it, and embedded fonts so nothing renders as a row of question marks.",

  // Testimonials
  "testimonials.badge": "Loved by readers",
  "testimonials.title": "What readers are saying.",

  // Final CTA
  "cta.badge": "Ready when you are",
  "cta.title.1": "Stop wishing you'd read it.",
  "cta.title.2": "Read it.",
  "cta.body":
    "Pick a plan, drop your first book, and read the way you mean to. If 30 days in you don't love it, we refund you in full — no forms, no friction.",
  "cta.primary": "Start your 30-day trial",
  "cta.secondary": "Compare plans",
  "cta.note": "No free plan. No surprise charges. Cancel any time, refund within 30 days.",

  // Pricing
  "pricing.badge": "Honest pricing · cancel anytime",
  "pricing.title.1": "Pick a plan.",
  "pricing.title.2": "Read better in 30 days",
  "pricing.title.3": "— or get every cent back.",
  "pricing.preamble":
    "We don't offer a free tier because translating books well isn't free for us either — but we stand behind the result. If Translify doesn't change how you read in your first month, email us and we'll refund you. No forms, no friction.",
  "pricing.monthly": "Monthly",
  "pricing.yearly": "Yearly",
  "pricing.save": "Save 20%",
  "pricing.month": "/mo",
  "pricing.billed.monthly": "billed monthly",
  "pricing.billed.yearly.before": "billed €",
  "pricing.billed.yearly.after": " yearly",
  "pricing.best": "★ Most loved",
  "pricing.guarantee": "30-day money-back · cancel anytime",
  "pricing.refund.title": "Risk-free, full refund — full stop.",
  "pricing.refund.body":
    "You have a full month to try every feature, on every plan. If you decide it's not for you, reply to your welcome email and we'll refund you in full — usually the same day.",
  "pricing.refund.cta": "Try it for 30 days",
  "pricing.days": "days",

  // Plans
  "plan.reader.name": "Reader",
  "plan.reader.tagline": "For the curious — finish a few books a month in a new language.",
  "plan.reader.cta": "Start as a Reader",
  "plan.reader.f1": "Up to 10 books / month",
  "plan.reader.f2": "All 14 languages",
  "plan.reader.f3": "Side-by-side reading",
  "plan.reader.f4": "Chat with citations",
  "plan.reader.f5": "Quiz mode (10 q / book)",
  "plan.reader.f6": "PDF & EPUB",
  "plan.scholar.name": "Scholar",
  "plan.scholar.tagline": "For students and serious readers — your whole syllabus, translated.",
  "plan.scholar.cta": "Become a Scholar",
  "plan.scholar.f1": "Unlimited books",
  "plan.scholar.f2": "All 14 languages — priority queue",
  "plan.scholar.f3": "Unlimited quizzes & study packs",
  "plan.scholar.f4": "Export annotated translations (PDF)",
  "plan.scholar.f5": "Smart vocabulary lists",
  "plan.scholar.f6": "Email support · 1-day reply",
  "plan.family.name": "Family",
  "plan.family.tagline": "Share the shelf — one library, up to five readers, kids welcome.",
  "plan.family.cta": "Choose Family",
  "plan.family.f1": "Everything in Scholar",
  "plan.family.f2": "5 reader profiles",
  "plan.family.f3": "Kid-safe mode + reading-age controls",
  "plan.family.f4": "Shared family library",
  "plan.family.f5": "Parent progress dashboard",
  "plan.family.f6": "Priority support",

  // FAQ
  "faq.badge": "Questions, answered",
  "faq.title": "The honest answers.",
  "faq.note":
    "If something isn't covered here, write to us at hello@translify.app — a real human reads every email.",

  // Footer
  "footer.tagline":
    "A reading companion that translates whole books, answers your questions with citations, and quizzes you so it sticks.",
  "footer.col.product": "Product",
  "footer.col.company": "Company",
  "footer.col.help": "Help",
  "footer.link.how": "How it works",
  "footer.link.features": "Features",
  "footer.link.pricing": "Pricing",
  "footer.link.languages": "Languages",
  "footer.link.manifesto": "Manifesto",
  "footer.link.blog": "Blog",
  "footer.link.careers": "Careers",
  "footer.link.press": "Press kit",
  "footer.link.faq": "FAQ",
  "footer.link.refund": "Refund policy",
  "footer.link.contact": "Contact",
  "footer.link.status": "Status",
  "footer.bottom": "Made with patience for readers everywhere",
  "footer.privacy": "Privacy",
  "footer.terms": "Terms",
  "footer.cookies": "Cookies",

  // Auth
  "auth.login.eyebrow": "Welcome back",
  "auth.login.title": "Pick up where you left off.",
  "auth.login.subtitle":
    "Your books, your highlights, your half-finished chapters — they're all waiting.",
  "auth.login.email": "Email",
  "auth.login.password": "Password",
  "auth.login.submit": "Log in",
  "auth.login.submitting": "Just a moment…",
  "auth.login.new": "New here?",
  "auth.login.makeAccount": "Make an account",

  "auth.register.eyebrow": "Hello, reader",
  "auth.register.title": "Make your shelf.",
  "auth.register.subtitle":
    "A cosy, private space for the books you read, the questions you have, and the things you learn.",
  "auth.register.name": "What should we call you?",
  "auth.register.nameOptional": "Optional",
  "auth.register.email": "Email",
  "auth.register.password": "Password",
  "auth.register.passwordHint": "At least 8 characters",
  "auth.register.submit": "Make my shelf",
  "auth.register.submitting": "Setting up your shelf…",
  "auth.register.have": "Already have a shelf?",
  "auth.register.login": "Log in",

  "auth.shell.badge": "For students of every age",
  "auth.shell.quote.1": "“The book stayed the same.",
  "auth.shell.quote.2": "My understanding of it",
  "auth.shell.quote.3": "did not.”",
  "auth.shell.body":
    "Translate any PDF, chat with it, then quiz yourself. Made for classrooms, homework, and rainy Sunday afternoons.",
  "auth.shell.foot": "Read · Translate · Chat · Quiz",
};

export const enTestimonials: Testimonial[] = [
  {
    quote:
      "I read Tolstoy in his own pace, in my own language. The chat told me what I missed and pointed me back to the page. I finished the book.",
    name: "Léa M.",
    role: "Literature student, Paris",
  },
  {
    quote:
      "My ten-year-old reads bedtime stories in Spanish now and quizzes me on them in the morning. He is winning.",
    name: "Daniel K.",
    role: "Father of two",
    highlight: true,
  },
  {
    quote:
      "I had a 600-page Mandarin textbook I'd been avoiding for a year. Translify made it readable in an afternoon — and the citations are spot-on.",
    name: "Mira T.",
    role: "PhD candidate, EPFL",
  },
];

export const enFaq: FaqItem[] = [
  {
    q: "Is there a free plan?",
    a: "No, and we think it'd be dishonest to pretend otherwise — running translation models well costs us real money. What we offer instead is a 30-day money-back guarantee. Try every feature on any plan, and if you're not reading better in a month, we refund you in full.",
  },
  {
    q: "How does the 30-day refund actually work?",
    a: "Reply to your welcome email any time in your first 30 days saying you'd like a refund — we don't ask why, we don't make you fill in a form, and the refund usually clears within a day. You can keep using your account until your billing period ends.",
  },
  {
    q: "Which file types and languages does it support?",
    a: "PDF and EPUB up to 200 MB per book. We translate to English, French, Spanish, German, Italian, Portuguese, Dutch, Arabic, Chinese (Simplified & Traditional), Japanese, Korean, Russian, Hindi, and Turkish — with proper script rendering for right-to-left and CJK.",
  },
  {
    q: "Does the translation keep the book's layout?",
    a: "Yes — we rebuild each page with the same shape: paragraphs in the same place, images where they were, headings in the same hierarchy. It looks like the original publisher made it. We also keep a side-by-side mode so you can switch back to the source any time.",
  },
  {
    q: "How accurate are the citations in chat?",
    a: "Every answer in chat links back to the exact passage in the source PDF, with the page number and a highlighted excerpt. If we can't find a faithful citation, we tell you instead of guessing — that's the rule.",
  },
  {
    q: "Is it safe for kids?",
    a: "The Family plan includes a kid-safe mode with reading-age controls, a dialled-down chat tone, and a parent dashboard that shows what your kids are reading and how they're doing on quizzes. Children's profiles can't see books they aren't assigned.",
  },
  {
    q: "Can I cancel any time?",
    a: "Yes. One click in your account settings. You keep access through the period you've already paid for, and we never auto-charge you the day after.",
  },
  {
    q: "Do you train AI on my books?",
    a: "No. Your uploads are private to your account, encrypted at rest, and never used to train models — ours or anyone else's. You can delete a book and all its derivatives at any time.",
  },
];
