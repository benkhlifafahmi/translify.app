"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import { register } from "@/lib/auth";
import { useI18n, LOCALES, type Locale } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";

type Persona = "student" | "curious" | "pro" | "family";

type PersonalityKey = "scholar" | "curious" | "pro" | "family";

interface Personality {
  key: PersonalityKey;
  recommendedPlan: "reader" | "scholar" | "family";
  monthly: number;
  yearly: number;
  tone: "saffron" | "sage" | "coral" | "plum";
  emoji: string;
}

const PERSONA_TO_PERSONALITY: Record<Persona, Personality> = {
  student: {
    key: "scholar",
    recommendedPlan: "scholar",
    monthly: 19,
    yearly: 15,
    tone: "saffron",
    emoji: "✦",
  },
  curious: {
    key: "curious",
    recommendedPlan: "reader",
    monthly: 9,
    yearly: 7,
    tone: "sage",
    emoji: "✿",
  },
  pro: {
    key: "pro",
    recommendedPlan: "scholar",
    monthly: 19,
    yearly: 15,
    tone: "plum",
    emoji: "◆",
  },
  family: {
    key: "family",
    recommendedPlan: "family",
    monthly: 29,
    yearly: 23,
    tone: "coral",
    emoji: "❀",
  },
};

const COUNTDOWN_SECS = 15 * 60; // 15-minute urgency timer

export default function OnboardingPage() {
  const router = useRouter();
  const { t, dir } = useI18n();

  const [step, setStep] = useState(0);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [targetLang, setTargetLang] = useState<Locale>("en");
  const [booksPerMonth, setBooksPerMonth] = useState(4);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const personality = persona ? PERSONA_TO_PERSONALITY[persona] : null;

  const canNext = useMemo(() => {
    if (step === 0) return persona !== null;
    if (step === 1) return targetLang !== null;
    if (step === 2) return booksPerMonth > 0;
    return true;
  }, [step, persona, targetLang, booksPerMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, password, name || undefined);
      router.push("/library");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <PaperBackdrop />

      {/* Top bar */}
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 pb-2 pt-6 lg:px-10 lg:pt-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-[color:var(--color-ink)]"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color:var(--color-ink)] text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          </span>
          Translify
        </Link>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            href="/login"
            className="hidden text-sm font-semibold text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)] sm:inline"
          >
            {t("ob.skip")}
          </Link>
        </div>
      </header>

      {/* Progress dots */}
      <div className="relative z-10 mx-auto mt-6 flex max-w-5xl items-center justify-center gap-2 px-6 lg:px-10">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i < step
                ? "w-6 bg-[color:var(--color-saffron-deep)]"
                : i === step
                  ? "w-12 bg-[color:var(--color-ink)]"
                  : "w-6 bg-[color:var(--color-paper-3)]"
            }`}
          />
        ))}
      </div>

      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-20 pt-10 lg:px-10 lg:pt-14">
        <div key={step} className="animate-pop-in">
          {step === 0 && (
            <Step1 persona={persona} setPersona={setPersona} />
          )}
          {step === 1 && (
            <Step2 targetLang={targetLang} setTargetLang={setTargetLang} />
          )}
          {step === 2 && (
            <Step3 books={booksPerMonth} setBooks={setBooksPerMonth} />
          )}
          {step === 3 && personality && (
            <Step4
              personality={personality}
              targetLang={targetLang}
              books={booksPerMonth}
            />
          )}
          {step === 4 && personality && (
            <Step5
              personality={personality}
              name={name}
              setName={setName}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              error={error}
              submitting={submitting}
              onSubmit={handleSubmit}
            />
          )}
        </div>

        {/* Footer nav */}
        {step < 4 && (
          <div className="mt-12 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-[color:var(--color-ink-soft)] transition-colors hover:text-[color:var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <span className={dir === "rtl" ? "rotate-180" : ""}>←</span>
              {t("ob.back")}
            </button>
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(4, s + 1))}
              disabled={!canNext}
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-[color:var(--color-ink)] px-7 font-semibold text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4),0_10px_22px_-8px_rgba(20,16,8,0.4)] transition-all hover:-translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
              {step === 3 ? t("ob.finish") : t("ob.next")}
              <span className="transition-transform group-hover:translate-x-1">
                <span className={dir === "rtl" ? "rotate-180 inline-block" : "inline-block"}>→</span>
              </span>
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

/* ───────────────────── STEP 1: Persona ───────────────────── */

function Step1({
  persona,
  setPersona,
}: {
  persona: Persona | null;
  setPersona: (p: Persona) => void;
}) {
  const { t } = useI18n();

  const options: { id: Persona; emoji: string; tone: "saffron" | "sage" | "plum" | "coral" }[] = [
    { id: "student", emoji: "✦", tone: "saffron" },
    { id: "curious", emoji: "✿", tone: "sage" },
    { id: "pro", emoji: "◆", tone: "plum" },
    { id: "family", emoji: "❀", tone: "coral" },
  ];

  const toneStyles = {
    saffron: {
      ring: "ring-[color:var(--color-saffron-deep)]",
      bg: "bg-gradient-to-br from-[#FFFBF0] to-[#FBE9C2]",
      icon: "bg-[color:var(--color-saffron)]/20 text-[color:var(--color-saffron-deep)]",
    },
    sage: {
      ring: "ring-[color:var(--color-sage-deep)]",
      bg: "bg-gradient-to-br from-[#F4F8EC] to-[#DDEAD2]",
      icon: "bg-[color:var(--color-sage)]/20 text-[color:var(--color-sage-deep)]",
    },
    plum: {
      ring: "ring-[color:var(--color-plum)]",
      bg: "bg-gradient-to-br from-[#F4EEF7] to-[#E0D2EA]",
      icon: "bg-[color:var(--color-plum)]/20 text-[color:var(--color-plum)]",
    },
    coral: {
      ring: "ring-[color:var(--color-coral-deep)]",
      bg: "bg-gradient-to-br from-[#FFF1EE] to-[#F6CCC4]",
      icon: "bg-[color:var(--color-coral)]/20 text-[color:var(--color-coral-deep)]",
    },
  };

  return (
    <div className="stagger">
      <StepHeader eyebrow={t("ob.s1.eyebrow")} title={t("ob.s1.title")} subtitle={t("ob.s1.subtitle")} />

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {options.map((opt) => {
          const selected = persona === opt.id;
          const styles = toneStyles[opt.tone];
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPersona(opt.id)}
              className={`group relative flex items-start gap-5 rounded-[1.4rem] border border-[color:var(--color-border)] p-6 text-start transition-all duration-300 ${
                selected
                  ? `ring-[2.5px] ${styles.ring} ${styles.bg} shadow-[var(--shadow-paper-lg)] scale-[1.02]`
                  : "bg-[color:var(--color-paper)] shadow-[var(--shadow-paper)] hover:-translate-y-1 hover:shadow-[var(--shadow-paper-lg)]"
              }`}
            >
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${styles.icon} font-[family-name:var(--font-display)] text-2xl`}>
                {opt.emoji}
              </span>
              <div className="flex-1">
                <h3 className="font-[family-name:var(--font-display)] text-[1.3rem] font-semibold leading-tight tracking-tight text-[color:var(--color-ink)]">
                  {t(`ob.s1.opt.${opt.id}`)}
                </h3>
                <p className="mt-1 text-[0.92rem] leading-snug text-[color:var(--color-ink-soft)]">
                  {t(`ob.s1.opt.${opt.id}.body`)}
                </p>
              </div>
              {selected && (
                <span className="absolute end-4 top-4 grid h-7 w-7 place-items-center rounded-full bg-[color:var(--color-ink)] text-[color:var(--color-paper)] animate-pop-in">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────── STEP 2: Language picker ───────────────────── */

function Step2({
  targetLang,
  setTargetLang,
}: {
  targetLang: Locale;
  setTargetLang: (l: Locale) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="stagger">
      <StepHeader eyebrow={t("ob.s2.eyebrow")} title={t("ob.s2.title")} subtitle={t("ob.s2.subtitle")} />

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {LOCALES.map((l) => {
          const selected = targetLang === l.code;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => setTargetLang(l.code)}
              dir={l.dir}
              className={`group flex items-center justify-between gap-3 rounded-2xl border-[1.5px] px-5 py-4 transition-all duration-300 ${
                selected
                  ? "border-[color:var(--color-saffron-deep)] bg-gradient-to-br from-[#FFFBF0] to-[#FBE9C2] shadow-[var(--shadow-paper-lg)]"
                  : "border-[color:var(--color-border)] bg-[color:var(--color-paper)] hover:-translate-y-[2px] hover:border-[color:var(--color-border-strong)]"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl leading-none">{l.flag}</span>
                <span className="text-start">
                  <span className="block font-[family-name:var(--font-display)] text-[1.05rem] font-semibold tracking-tight text-[color:var(--color-ink)]">
                    {l.label}
                  </span>
                  {l.dir === "rtl" && (
                    <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[color:var(--color-ink-soft)]">
                      Right-to-left
                    </span>
                  )}
                </span>
              </span>
              {selected && (
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[color:var(--color-ink)] text-[color:var(--color-paper)]">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-paper-2)]/40 px-5 py-3 text-center text-[0.85rem] text-[color:var(--color-ink-soft)]">
        + 8 more languages — Italiano, Português, Nederlands, 中文, 한국어, Русский, हिन्दी, Türkçe
      </div>
    </div>
  );
}

/* ───────────────────── STEP 3: Books slider ───────────────────── */

function Step3({
  books,
  setBooks,
}: {
  books: number;
  setBooks: (n: number) => void;
}) {
  const { t } = useI18n();

  // Beautiful pip scale — visualizes their volume in books
  const max = 20;
  const pct = (books / max) * 100;

  return (
    <div className="stagger">
      <StepHeader eyebrow={t("ob.s3.eyebrow")} title={t("ob.s3.title")} subtitle={t("ob.s3.subtitle")} />

      <div className="mt-12 rounded-[1.6rem] border border-[color:var(--color-border)] bg-gradient-to-br from-[#FFFCF3] to-[#F5E9CD] p-8 shadow-[var(--shadow-paper-lg)]">
        {/* Big number */}
        <div className="text-center">
          <div className="font-[family-name:var(--font-display)] text-[clamp(4rem,12vw,7rem)] font-semibold leading-none tracking-tight text-[color:var(--color-ink)]">
            {books}
            {books === max && <span className="text-[color:var(--color-saffron-deep)]">+</span>}
          </div>
          <p className="mt-2 text-sm uppercase tracking-[0.22em] text-[color:var(--color-ink-soft)]">
            {t("ob.s3.unit.books")}
          </p>
        </div>

        {/* Visual book stack — grows with value */}
        <div className="mt-8 flex h-16 items-end justify-center gap-1 overflow-hidden">
          {Array.from({ length: max }).map((_, i) => {
            const filled = i < books;
            const colors = ["#E0A458", "#7BA17C", "#E2786C", "#6B5B95"];
            const color = colors[i % colors.length];
            return (
              <span
                key={i}
                className="rounded-t-md transition-all duration-500"
                style={{
                  width: "clamp(8px, 1.6vw, 14px)",
                  height: filled ? `${30 + Math.random() * 40}px` : "8px",
                  background: filled ? color : "rgba(74, 60, 30, 0.08)",
                  opacity: filled ? 0.9 : 1,
                  transitionDelay: `${i * 30}ms`,
                }}
              />
            );
          })}
        </div>

        {/* Slider */}
        <div className="mt-8 px-2">
          <div className="relative">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-[color:var(--color-paper-3)]" />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full bg-gradient-to-r from-[color:var(--color-saffron)] via-[color:var(--color-coral)] to-[color:var(--color-plum)] transition-all"
              style={{ width: `${pct}%` }}
            />
            <input
              type="range"
              min={1}
              max={max}
              value={books}
              onChange={(e) => setBooks(Number(e.target.value))}
              className="ob-slider relative h-6 w-full cursor-pointer appearance-none bg-transparent"
              aria-label="Books per month"
            />
          </div>

          <div className="mt-3 flex justify-between text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-ink-soft)]">
            <span>1</span>
            <span>5</span>
            <span>10</span>
            <span>15</span>
            <span>20+</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .ob-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--color-ink);
          border: 3px solid var(--color-paper);
          box-shadow: 0 4px 14px rgba(20, 16, 8, 0.35), 0 1px 0 rgba(20, 16, 8, 0.5);
          cursor: grab;
          transition: transform 0.2s;
        }
        .ob-slider::-webkit-slider-thumb:active {
          transform: scale(1.15);
          cursor: grabbing;
        }
        .ob-slider::-moz-range-thumb {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--color-ink);
          border: 3px solid var(--color-paper);
          box-shadow: 0 4px 14px rgba(20, 16, 8, 0.35), 0 1px 0 rgba(20, 16, 8, 0.5);
          cursor: grab;
        }
      `}</style>
    </div>
  );
}

/* ───────────────────── STEP 4: The reveal ───────────────────── */

function Step4({
  personality,
  targetLang,
  books,
}: {
  personality: Personality;
  targetLang: Locale;
  books: number;
}) {
  const { t, locale } = useI18n();
  const [secs, setSecs] = useState(COUNTDOWN_SECS);

  useEffect(() => {
    const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const mins = Math.floor(secs / 60);
  const ss = String(secs % 60).padStart(2, "0");
  const mm = String(mins).padStart(2, "0");

  const langInfo = LOCALES.find((l) => l.code === targetLang);

  // Pricing math — 40% off first month creates urgency
  const baseMonthly = personality.monthly;
  const discounted = Math.round(baseMonthly * 0.6);
  const annualSaving = (personality.monthly - personality.yearly) * 12;

  const toneStyles = {
    saffron: {
      bg: "bg-gradient-to-br from-[#FFFBF0] via-[#F8E1B0] to-[#F0CC85]",
      ring: "border-[color:var(--color-saffron-deep)]",
      chip: "bg-[color:var(--color-saffron-deep)] text-white",
      accent: "text-[color:var(--color-saffron-deep)]",
    },
    sage: {
      bg: "bg-gradient-to-br from-[#F4F8EC] via-[#CCDDC0] to-[#A9C5A8]",
      ring: "border-[color:var(--color-sage-deep)]",
      chip: "bg-[color:var(--color-sage-deep)] text-white",
      accent: "text-[color:var(--color-sage-deep)]",
    },
    coral: {
      bg: "bg-gradient-to-br from-[#FFF1EE] via-[#F4BBB1] to-[#E59C8F]",
      ring: "border-[color:var(--color-coral-deep)]",
      chip: "bg-[color:var(--color-coral-deep)] text-white",
      accent: "text-[color:var(--color-coral-deep)]",
    },
    plum: {
      bg: "bg-gradient-to-br from-[#F4EEF7] via-[#D2BFE0] to-[#B5A0CC]",
      ring: "border-[color:var(--color-plum)]",
      chip: "bg-[color:var(--color-plum)] text-white",
      accent: "text-[color:var(--color-plum)]",
    },
  }[personality.tone];

  return (
    <div className="stagger">
      <StepHeader eyebrow={t("ob.s4.eyebrow")} title="" subtitle="" />

      <div className="mt-2 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,3.6rem)] font-semibold leading-[1.05] tracking-tight">
          {t("ob.s4.title.pre")}{" "}
          <em className={`${toneStyles.accent}`}>
            {t(`personality.${personality.key}.name`)}
          </em>
          {t("ob.s4.title.post")}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[1rem] leading-relaxed text-[color:var(--color-ink-soft)]">
          {t(`personality.${personality.key}.body`)}
        </p>
      </div>

      {/* Recommendation card with discount + countdown */}
      <div className={`relative mx-auto mt-12 max-w-2xl overflow-hidden rounded-[1.8rem] border-[2px] ${toneStyles.ring} ${toneStyles.bg} p-8 shadow-[var(--shadow-paper-lg)] lg:p-10`}>
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-16 h-56 w-56 rounded-full bg-white/40 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-white/30 blur-3xl" />

        {/* Tape */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 -rotate-[2deg]">
          <span className={`inline-flex items-center gap-1.5 rounded-full ${toneStyles.chip} px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.2em] shadow-[0_8px_18px_-6px_rgba(20,16,8,0.4)]`}>
            ★ {t("ob.s4.recommended")}
          </span>
        </div>

        <div className="relative grid gap-7 sm:grid-cols-[auto_1fr] sm:gap-8">
          {/* Personality glyph */}
          <div className="flex justify-center sm:justify-start">
            <div className={`grid h-24 w-24 place-items-center rounded-3xl bg-white/60 backdrop-blur ${toneStyles.accent} font-[family-name:var(--font-display)] text-[3rem] shadow-[0_8px_22px_-8px_rgba(20,16,8,0.25)]`}>
              {personality.emoji}
            </div>
          </div>

          <div>
            {/* Plan name */}
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[color:var(--color-ink-soft)]">
              Plan recommendation
            </p>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-[2rem] font-semibold leading-tight tracking-tight text-[color:var(--color-ink)]">
              {personality.recommendedPlan === "reader" && "Reader"}
              {personality.recommendedPlan === "scholar" && "Scholar"}
              {personality.recommendedPlan === "family" && "Family"}
            </h3>

            {/* Price */}
            <div className="mt-5 flex items-end gap-3">
              <span className="font-[family-name:var(--font-display)] text-[3.6rem] font-semibold leading-none tracking-tight text-[color:var(--color-ink)]">
                €{discounted}
              </span>
              <div className="pb-2">
                <span className="block text-sm text-[color:var(--color-ink-soft)] line-through">€{baseMonthly}</span>
                <span className="block text-xs text-[color:var(--color-ink-soft)]">first month</span>
              </div>
              <span className={`mb-1 ms-auto inline-flex h-9 items-center gap-1 rounded-full ${toneStyles.chip} px-3 text-sm font-bold shadow-[0_4px_10px_-2px_rgba(20,16,8,0.3)]`}>
                –40%
              </span>
            </div>
            <p className="mt-1 text-[0.85rem] text-[color:var(--color-ink-soft)]">
              then €{baseMonthly}/mo · cancel anytime · 30-day money-back
            </p>

            {/* Match reasons */}
            <ul className="mt-6 space-y-2 text-[0.92rem] text-[color:var(--color-ink)]">
              <MatchRow icon="🎯">
                Matched to your <strong>{books === 20 ? "20+" : books}</strong> books / month
              </MatchRow>
              <MatchRow icon={langInfo?.flag ?? "🌐"}>
                Reading in <strong>{langInfo?.label ?? "your language"}</strong> — full script support
              </MatchRow>
              <MatchRow icon="∞">
                {personality.recommendedPlan === "reader"
                  ? "Up to 10 books / month, all 14 languages"
                  : personality.recommendedPlan === "family"
                    ? "5 reader profiles, kid-safe chat, parent dashboard"
                    : "Unlimited books, priority queue, smart vocabulary"}
              </MatchRow>
              <MatchRow icon="✓">
                Quizzes &amp; chat with citations — yours from day one
              </MatchRow>
            </ul>
          </div>
        </div>

        {/* Countdown */}
        <div className="relative mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[color:var(--color-ink)]/15 bg-white/55 p-4 backdrop-blur sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--color-ink)] text-[color:var(--color-paper)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
              </svg>
            </span>
            <div>
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[color:var(--color-ink-soft)]">
                {t("ob.s4.timer")}
              </p>
              <p className="font-[family-name:var(--font-display)] text-[1.4rem] font-semibold leading-tight tracking-tight tabular-nums text-[color:var(--color-ink)]">
                {mm}:{ss}
              </p>
            </div>
          </div>
          <p className="text-end text-[0.78rem] leading-snug text-[color:var(--color-ink-soft)] sm:max-w-xs">
            Lock in <strong className="text-[color:var(--color-ink)]">40% off</strong> your first month — applied at checkout.
          </p>
        </div>
      </div>

      {/* Social proof strip */}
      <SocialProof tone={personality.tone} />
    </div>
  );
}

function MatchRow({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="grid h-5 w-5 shrink-0 place-items-center text-[0.95rem]">{icon}</span>
      <span className="leading-snug">{children}</span>
    </li>
  );
}

function SocialProof({ tone }: { tone: Personality["tone"] }) {
  const quotes = {
    saffron: { name: "Léa M.", quote: "I read Tolstoy in his pace — in mine. The Scholar plan paid itself back in one semester." },
    sage: { name: "Adèle R.", quote: "Twelve novels, three languages, six months. I haven't read this much since I was a kid." },
    coral: { name: "Daniel K.", quote: "Bedtime stories in Spanish. Quizzes in English at breakfast. He's winning, and so am I." },
    plum: { name: "Mira T.", quote: "600-page papers in Mandarin, summarised and citable. The Scholar plan is my unfair advantage." },
  }[tone];

  return (
    <div className="mx-auto mt-10 max-w-2xl rounded-[1.4rem] border border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-6 shadow-[var(--shadow-paper)]">
      <div className="flex items-start gap-4">
        <span aria-hidden className="font-[family-name:var(--font-display)] text-[3rem] leading-[0.5] text-[color:var(--color-saffron-deep)]/45">
          “
        </span>
        <div className="flex-1">
          <p className="font-[family-name:var(--font-display)] text-[1rem] italic leading-snug text-[color:var(--color-ink)]">
            {quotes.quote}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--color-paper-3)] font-[family-name:var(--font-display)] text-[0.8rem] font-semibold text-[color:var(--color-ink)]">
              {quotes.name.charAt(0)}
            </span>
            <span className="text-[0.78rem] font-semibold text-[color:var(--color-ink-soft)]">
              {quotes.name} · also a {tone === "coral" ? "family reader" : tone === "sage" ? "polyglot explorer" : tone === "plum" ? "sharp mind" : "scholar"}
            </span>
            <span className="ml-auto text-sm tracking-wider text-[color:var(--color-saffron-deep)]">
              ★★★★★
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────── STEP 5: Account creation ───────────────────── */

function Step5({
  personality,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  error,
  submitting,
  onSubmit,
}: {
  personality: Personality;
  name: string;
  setName: (s: string) => void;
  email: string;
  setEmail: (s: string) => void;
  password: string;
  setPassword: (s: string) => void;
  error: string | null;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const { t } = useI18n();

  const planName =
    personality.recommendedPlan === "reader"
      ? "Reader"
      : personality.recommendedPlan === "scholar"
        ? "Scholar"
        : "Family";
  const discounted = Math.round(personality.monthly * 0.6);

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
      {/* Form column */}
      <div className="stagger">
        <StepHeader eyebrow={t("ob.s5.eyebrow")} title={t("ob.s5.title")} subtitle={t("ob.s5.subtitle")} />

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
          <Field label={t("ob.s5.name")}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("ob.s5.optional")}
              className="ob-input"
            />
          </Field>
          <Field label={t("ob.s5.email")}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="ob-input"
            />
          </Field>
          <Field label={t("ob.s5.password")}>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className="ob-input"
            />
          </Field>

          {error && (
            <div className="rounded-xl border border-[color:var(--color-destructive)]/30 bg-[color:var(--color-destructive)]/10 px-4 py-3 text-sm text-[color:var(--color-destructive)]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="group mt-2 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[color:var(--color-ink)] px-7 font-[family-name:var(--font-display)] text-[1.05rem] font-semibold text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4),0_14px_28px_-10px_rgba(20,16,8,0.45)] transition-all hover:-translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          >
            {submitting ? "Setting up your shelf…" : t("ob.s5.start")}
          </button>

          <p className="text-center text-[0.78rem] text-[color:var(--color-ink-soft)]">
            By starting your trial you agree to our terms · <Link href="/login" className="font-semibold text-[color:var(--color-ink)] underline decoration-[color:var(--color-saffron)] decoration-2 underline-offset-4">Have an account? Log in</Link>
          </p>
        </form>

        <style jsx>{`
          .ob-input {
            display: block;
            width: 100%;
            border-radius: 14px;
            border: 1.5px solid var(--color-border);
            background: var(--color-paper);
            padding: 0.85rem 1rem;
            font-size: 0.95rem;
            color: var(--color-ink);
            transition: all 0.2s;
          }
          .ob-input:focus {
            outline: none;
            border-color: var(--color-saffron-deep);
            box-shadow: 0 0 0 4px rgba(224, 164, 88, 0.18);
          }
        `}</style>
      </div>

      {/* Order summary column */}
      <aside className="lg:sticky lg:top-8">
        <div className="card-paper-lifted overflow-hidden p-7">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[color:var(--color-ink-soft)]">
            Your order
          </p>
          <h3 className="mt-2 font-[family-name:var(--font-display)] text-[1.6rem] font-semibold leading-tight tracking-tight">
            Translify {planName}
          </h3>

          <div className="mt-5 space-y-3 border-t border-dashed border-[color:var(--color-border)] pt-5 text-[0.92rem]">
            <Row label={`${planName} · monthly`} value={`€${personality.monthly}`} />
            <Row label="First-month discount" value="−40%" highlight />
            <Row label="Free trial" value="30 days" />
            <div className="border-t border-[color:var(--color-border)] pt-3" />
            <Row
              label={<span className="font-[family-name:var(--font-display)] text-[1rem] font-semibold">Today</span>}
              value={
                <span className="font-[family-name:var(--font-display)] text-[1.4rem] font-semibold">
                  €0
                </span>
              }
            />
            <p className="text-[0.78rem] leading-snug text-[color:var(--color-ink-soft)]">
              You won&apos;t be charged today. After your 30-day trial, you&apos;ll pay
              {" "}<strong className="text-[color:var(--color-ink)]">€{discounted}</strong> for month one,
              then €{personality.monthly}/mo. Cancel any time, full refund within 30 days.
            </p>
          </div>

          {/* Trust badges */}
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[color:var(--color-border)] pt-5">
            <Trust icon="↺" label="Cancel anytime" />
            <Trust icon="€" label="Refund ≤30d" />
            <Trust icon="🔒" label="Secure checkout" />
          </div>
        </div>

        <p className="mt-4 text-center text-[0.78rem] text-[color:var(--color-ink-soft)]">
          Join 42,000+ readers who finished the book.
        </p>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-ink-soft)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function Row({
  label,
  value,
  highlight = false,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[color:var(--color-ink-soft)]">{label}</span>
      <span className={highlight ? "font-bold text-[color:var(--color-coral-deep)]" : "font-semibold text-[color:var(--color-ink)]"}>
        {value}
      </span>
    </div>
  );
}

function Trust({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color:var(--color-paper-2)] font-[family-name:var(--font-display)] text-[1.1rem] text-[color:var(--color-saffron-deep)]">
        {icon}
      </span>
      <span className="text-[0.7rem] font-semibold leading-tight text-[color:var(--color-ink-soft)]">{label}</span>
    </div>
  );
}

/* ───────────────────── Shared ───────────────────── */

function StepHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center">
      <p className="text-[0.78rem] font-bold uppercase tracking-[0.22em] text-[color:var(--color-saffron-deep)]">
        {eyebrow}
      </p>
      {title && (
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,3.4rem)] font-semibold leading-[1.05] tracking-tight">
          {title}
        </h1>
      )}
      {subtitle && (
        <p className="mx-auto mt-4 max-w-xl text-[1rem] leading-relaxed text-[color:var(--color-ink-soft)]">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function PaperBackdrop() {
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-24 h-96 w-96 rounded-full bg-[color:var(--color-saffron)]/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-32 top-40 h-[28rem] w-[28rem] rounded-full bg-[color:var(--color-sage)]/12 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[color:var(--color-coral)]/10 blur-3xl" />
    </>
  );
}
