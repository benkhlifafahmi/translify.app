"use client";

import { useI18n } from "@/lib/i18n";

function Quote({
  rotate, tone, quote, name, role, highlight = false,
}: { rotate: string; tone: "paper" | "saffron"; quote: string; name: string; role: string; highlight?: boolean }) {
  const bg = tone === "saffron" ? "bg-gradient-to-br from-[#FFFBF0] to-[#FBE9C2]" : "bg-[color:var(--color-paper)]";
  return (
    <figure className={`relative ${rotate} rounded-[1.3rem] border border-[color:var(--color-border)] ${bg} p-7 shadow-[var(--shadow-paper)] transition-transform duration-300 hover:rotate-0 hover:-translate-y-1`}>
      <div aria-hidden className="absolute -top-4 left-6 font-[family-name:var(--font-display)] text-[3.5rem] leading-none text-[color:var(--color-saffron-deep)]/40">
        "
      </div>
      <blockquote className="relative font-[family-name:var(--font-display)] text-[1.05rem] italic leading-snug text-[color:var(--color-ink)]">
        {quote}
      </blockquote>
      {highlight && (
        <div className="mt-3 flex items-center gap-1 text-[0.85rem] text-[color:var(--color-saffron-deep)]">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i}>★</span>
          ))}
        </div>
      )}
      <figcaption className="mt-5 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--color-paper-3)] font-[family-name:var(--font-display)] text-sm font-semibold text-[color:var(--color-ink)]">
          {name.charAt(0)}
        </span>
        <div>
          <p className="text-[0.85rem] font-semibold text-[color:var(--color-ink)]">{name}</p>
          <p className="text-[0.72rem] text-[color:var(--color-ink-soft)]">{role}</p>
        </div>
      </figcaption>
    </figure>
  );
}

export function TestimonialsClient() {
  const { t, testimonials, locale } = useI18n();
  const tones: ("paper" | "saffron")[] = ["paper", "saffron", "paper"];
  const rotates = ["-rotate-[1.2deg]", "rotate-[1.4deg]", "-rotate-[0.6deg]"];

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 pb-24 lg:px-14">
      <div className="text-center">
        <span className="badge-pill bg-[color:var(--color-coral)]/15 text-[color:var(--color-coral-deep)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-coral)]" />
          {t("testimonials.badge")}
        </span>
        <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2rem,4vw,3rem)] font-semibold leading-tight tracking-tight">
          {t("testimonials.title")}
        </h2>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3" key={locale}>
        {testimonials.map((q, i) => (
          <Quote
            key={`${locale}-${i}`}
            rotate={rotates[i] ?? ""}
            tone={tones[i] ?? "paper"}
            quote={q.quote}
            name={q.name}
            role={q.role}
            highlight={q.highlight}
          />
        ))}
      </div>
    </section>
  );
}
