const FAQ_ITEMS = [
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

export function FAQ() {
  return (
    <section id="faq" className="relative z-10 mx-auto max-w-4xl px-8 pb-24 pt-12 lg:px-14">
      <div className="text-center">
        <span className="badge-pill bg-[color:var(--color-sage)]/15 text-[color:var(--color-sage-deep)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-sage)]" />
          Questions, answered
        </span>
        <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2rem,4vw,3rem)] font-semibold leading-tight tracking-tight">
          The honest answers.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[1rem] leading-relaxed text-[color:var(--color-ink-soft)]">
          If something isn&apos;t covered here, write to us at hello@translify.app — a real human reads every email.
        </p>
      </div>

      <div className="mt-10 space-y-3">
        {FAQ_ITEMS.map((item, i) => (
          <details
            key={item.q}
            className="group card-paper open:shadow-[var(--shadow-paper-lg)] transition-shadow"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5">
              <span className="flex items-start gap-3">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[color:var(--color-paper-3)] font-[family-name:var(--font-display)] text-xs font-semibold text-[color:var(--color-ink-soft)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-[family-name:var(--font-display)] text-[1.1rem] font-semibold leading-snug text-[color:var(--color-ink)]">
                  {item.q}
                </span>
              </span>
              <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)] text-[color:var(--color-ink-soft)] transition-transform group-open:rotate-45">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
            </summary>
            <div className="px-5 pb-5 pl-[3.75rem] text-[0.95rem] leading-relaxed text-[color:var(--color-ink-soft)]">
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
