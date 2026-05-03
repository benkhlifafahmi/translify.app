"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

type Cycle = "monthly" | "yearly";

interface Plan {
  id: string;
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  best?: boolean;
  tone: "paper" | "saffron" | "sage";
  features: string[];
  cta: string;
}

const PLANS: Plan[] = [
  {
    id: "reader",
    name: "Reader",
    tagline: "For the curious — finish a few books a month in a new language.",
    monthly: 9,
    yearly: 7,
    tone: "paper",
    features: [
      "Up to 10 books / month",
      "All 14 languages",
      "Side-by-side reading",
      "Chat with citations",
      "Quiz mode (10 q / book)",
      "PDF & EPUB",
    ],
    cta: "Start as a Reader",
  },
  {
    id: "scholar",
    name: "Scholar",
    tagline: "For students and serious readers — your whole syllabus, translated.",
    monthly: 19,
    yearly: 15,
    best: true,
    tone: "saffron",
    features: [
      "Unlimited books",
      "All 14 languages — priority queue",
      "Unlimited quizzes & study packs",
      "Export annotated translations (PDF)",
      "Smart vocabulary lists",
      "Email support · 1-day reply",
    ],
    cta: "Become a Scholar",
  },
  {
    id: "family",
    name: "Family",
    tagline: "Share the shelf — one library, up to five readers, kids welcome.",
    monthly: 29,
    yearly: 23,
    tone: "sage",
    features: [
      "Everything in Scholar",
      "5 reader profiles",
      "Kid-safe mode + reading-age controls",
      "Shared family library",
      "Parent progress dashboard",
      "Priority support",
    ],
    cta: "Choose Family",
  },
];

export function Pricing() {
  const [cycle, setCycle] = useState<Cycle>("yearly");
  const { t } = useI18n();

  return (
    <section id="pricing" className="relative z-10 mx-auto max-w-6xl px-8 pb-24 pt-12 lg:px-14 lg:pt-20">
      <div className="text-center">
        <span className="badge-pill bg-[color:var(--color-saffron)]/15 text-[color:var(--color-saffron-deep)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-saffron)]" />
          {t("pricing.badge")}
        </span>
        <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2rem,4vw,3rem)] font-semibold leading-tight tracking-tight">
          {t("pricing.title.1")} <span className="italic text-[color:var(--color-saffron-deep)]">{t("pricing.title.2")}</span>
          <br />{t("pricing.title.3")}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-[1.05rem] leading-relaxed text-[color:var(--color-ink-soft)]">
          We don&apos;t offer a free tier because translating books well isn&apos;t free for us either —
          but we stand behind the result. If Translify doesn&apos;t change how you read in your first month,
          email us and we&apos;ll refund you. No forms, no friction.
        </p>
      </div>

      {/* Cycle toggle */}
      <div className="mt-9 flex items-center justify-center">
        <div
          role="tablist"
          aria-label="Billing cycle"
          className="relative inline-flex items-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-1 shadow-[0_1px_0_rgba(74,60,30,0.05)]"
        >
          <button
            role="tab"
            aria-selected={cycle === "monthly"}
            onClick={() => setCycle("monthly")}
            className={`relative z-10 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              cycle === "monthly" ? "text-[color:var(--color-paper)]" : "text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]"
            }`}
          >
            {t("pricing.monthly")}
          </button>
          <button
            role="tab"
            aria-selected={cycle === "yearly"}
            onClick={() => setCycle("yearly")}
            className={`relative z-10 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              cycle === "yearly" ? "text-[color:var(--color-paper)]" : "text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]"
            }`}
          >
            {t("pricing.yearly")}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold ${
                cycle === "yearly"
                  ? "bg-[color:var(--color-saffron)] text-[color:var(--color-accent-foreground)]"
                  : "bg-[color:var(--color-sage)]/20 text-[color:var(--color-sage-deep)]"
              }`}
            >
              {t("pricing.save")}
            </span>
          </button>
          <span
            aria-hidden
            className="absolute inset-y-1 w-[calc(50%-2px)] rounded-full bg-[color:var(--color-ink)] shadow-[0_2px_0_rgba(20,16,8,0.45)] transition-transform duration-300"
            style={{ transform: cycle === "monthly" ? "translateX(2px)" : "translateX(calc(100% - 2px))" }}
          />
        </div>
      </div>

      {/* Plan grid */}
      <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:gap-7">
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} cycle={cycle} />
        ))}
      </div>

      {/* Money-back banner */}
      <div className="mt-12 overflow-hidden rounded-[1.4rem] border border-[color:var(--color-border-strong)] bg-gradient-to-br from-[#FFFCF3] to-[#F5E9CD] p-8 shadow-[var(--shadow-paper-lg)]">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-[3px] border-[color:var(--color-saffron-deep)] bg-[color:var(--color-paper)] font-[family-name:var(--font-display)] text-[color:var(--color-saffron-deep)] shadow-[inset_0_0_0_3px_rgba(224,164,88,0.25)]">
            <div className="text-center leading-none">
              <div className="text-[1.6rem] font-semibold">30</div>
              <div className="text-[0.55rem] uppercase tracking-[0.2em] text-[color:var(--color-ink-soft)]">days</div>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
              Risk-free, full refund — full stop.
            </h3>
            <p className="mt-2 max-w-2xl text-[0.95rem] leading-relaxed text-[color:var(--color-ink-soft)]">
              You have a full month to try every feature, on every plan. If you decide it&apos;s not for you,
              reply to your welcome email and we&apos;ll refund you in full — usually the same day.
            </p>
          </div>
          <Link
            href="/onboarding"
            className="group inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-[color:var(--color-ink)] px-6 font-semibold text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4)] transition-transform hover:-translate-y-[1px]"
          >
            Try it for 30 days
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

function PlanCard({ plan, cycle }: { plan: Plan; cycle: Cycle }) {
  const price = cycle === "monthly" ? plan.monthly : plan.yearly;
  const tones: Record<Plan["tone"], { card: string; ring: string; chip: string; chipText: string }> = {
    paper: {
      card: "bg-[color:var(--color-paper)]",
      ring: "border-[color:var(--color-border)]",
      chip: "bg-[color:var(--color-paper-3)]",
      chipText: "text-[color:var(--color-ink-soft)]",
    },
    saffron: {
      card: "bg-gradient-to-br from-[#FFFBF0] to-[#FBE9C2]",
      ring: "border-[color:var(--color-saffron-deep)]",
      chip: "bg-[color:var(--color-saffron)]",
      chipText: "text-[color:var(--color-accent-foreground)]",
    },
    sage: {
      card: "bg-gradient-to-br from-[#F4F8EC] to-[#DDEAD2]",
      ring: "border-[color:var(--color-sage-deep)]/60",
      chip: "bg-[color:var(--color-sage)]/20",
      chipText: "text-[color:var(--color-sage-deep)]",
    },
  };
  const t = tones[plan.tone];

  return (
    <div
      className={`relative flex flex-col rounded-[1.3rem] border-[1.5px] ${t.ring} ${t.card} p-7 shadow-[var(--shadow-paper)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-paper-lg)] ${
        plan.best ? "lg:-translate-y-3 lg:scale-[1.02]" : ""
      }`}
    >
      {plan.best && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 -rotate-[3deg]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-coral)] px-3.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-white shadow-[0_8px_18px_-6px_rgba(197,89,77,0.55)]">
            ★ Most loved
          </span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <span className={`badge-pill ${t.chip} ${t.chipText}`}>{plan.name}</span>
      </div>
      <p className="mt-3 min-h-[3rem] text-[0.92rem] leading-relaxed text-[color:var(--color-ink-soft)]">
        {plan.tagline}
      </p>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="font-[family-name:var(--font-display)] text-[3.4rem] font-semibold leading-none tracking-tight">
          €{price}
        </span>
        <span className="text-sm text-[color:var(--color-ink-soft)]">/mo</span>
      </div>
      <p className="mt-1 text-xs text-[color:var(--color-ink-soft)]">
        {cycle === "yearly" ? `billed €${price * 12} yearly` : "billed monthly"}
      </p>

      <ul className="mt-6 space-y-2.5 text-[0.92rem] text-[color:var(--color-ink)]">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[color:var(--color-sage)]/20 text-[color:var(--color-sage-deep)]">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-7 flex-1" />

      <Link
        href="/register"
        className={`mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-full font-semibold transition-transform hover:-translate-y-[1px] ${
          plan.best
            ? "bg-[color:var(--color-ink)] text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4),0_10px_22px_-8px_rgba(20,16,8,0.4)]"
            : "border-[1.5px] border-[color:var(--color-ink)] bg-[color:var(--color-paper)] text-[color:var(--color-ink)]"
        }`}
      >
        {plan.cta}
      </Link>
      <p className="mt-3 text-center text-[0.7rem] text-[color:var(--color-ink-soft)]">
        30-day money-back · cancel anytime
      </p>
    </div>
  );
}
