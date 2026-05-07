import { api } from "./api";

export type Plan = "free" | "reader" | "scholar" | "family";
export type Cycle = "monthly" | "yearly";
export type SubscriptionStatus =
  | "inactive"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid";

export interface Quota {
  pages_per_month: number;
  max_pages_per_book: number;
  quizzes_per_book: number;
  profiles: number;
  chat_with_citations: boolean;
  annotated_export: boolean;
  priority_queue: boolean;
  family_safe_mode: boolean;
  literary_translation: boolean;
}

export interface Usage {
  period_start: string | null;
  pages_uploaded: number;
  quizzes_generated: number;
}

export interface Subscription {
  plan: Plan;
  cycle: Cycle | null;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  has_stripe_customer: boolean;
  quota: Quota;
  usage: Usage;
}

export async function getSubscription(): Promise<Subscription> {
  return api<Subscription>("/billing/me");
}

export async function startCheckout(opts: {
  plan: Exclude<Plan, "free">;
  cycle: Cycle;
  applyFirstMonthDiscount?: boolean;
}): Promise<{ url: string }> {
  return api<{ url: string }>("/billing/checkout", {
    method: "POST",
    body: {
      plan: opts.plan,
      cycle: opts.cycle,
      apply_first_month_discount: opts.applyFirstMonthDiscount ?? false,
    },
  });
}

export async function startPortal(): Promise<{ url: string }> {
  return api<{ url: string }>("/billing/portal", { method: "POST" });
}

const PLAN_NAME: Record<Plan, string> = {
  free: "Free",
  reader: "Reader",
  scholar: "Scholar",
  family: "Family",
};

export function planName(p: Plan): string {
  return PLAN_NAME[p];
}

export function isUnlimited(n: number): boolean {
  return n >= 1_000_000;
}
