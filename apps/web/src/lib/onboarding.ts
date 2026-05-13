/**
 * Onboarding lead tracking — fire-and-forget calls from the /join flow so we
 * can re-engage visitors who drop off mid-funnel.
 *
 * The endpoint is public (no JWT required); we still go through the shared
 * api() helper so any auth header that *does* exist (e.g. an old session)
 * doesn't get in the way.
 */
import { api } from "./api";

export type OnboardingStep =
  | "email"
  | "topics"
  | "shelf"
  | "experience"
  | "signup"
  | "completed";

export interface LeadUpsert {
  email: string;
  step: OnboardingStep;
  topics?: string[];
  chosen_book_id?: string | null;
  preferred_language?: string;
  referrer?: string;
}

/** Fire-and-forget — never throws. Failures here must not block the UX. */
export function trackLead(input: LeadUpsert): void {
  // Strip nulls so we don't accidentally overwrite stored values with null.
  const body: Record<string, unknown> = {
    email: input.email.trim().toLowerCase(),
    step: input.step,
  };
  if (input.topics !== undefined) body.topics = input.topics;
  if (input.chosen_book_id) body.chosen_book_id = input.chosen_book_id;
  if (input.preferred_language) body.preferred_language = input.preferred_language;
  if (input.referrer) body.referrer = input.referrer;

  // No await — we don't want to slow the funnel down. Swallow errors silently;
  // a missed lead-tracking call is much less bad than a stuck step transition.
  api("/onboarding/lead", { method: "POST", body }).catch(() => {
    /* ignored */
  });
}
