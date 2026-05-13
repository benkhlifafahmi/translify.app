import { ApiError } from "./api";

export type QuotaErrorKind = "quota_exceeded" | "no_active_plan";

export interface QuotaError {
  error: QuotaErrorKind;
  message: string;
  plan: string;
  limit?: number;
  used?: number;
  status?: string;
}

export function parseQuotaError(err: unknown): QuotaError | null {
  if (!(err instanceof ApiError)) return null;
  if (err.status !== 402) return null;
  const body = err.body;
  if (!body || typeof body !== "object") return null;
  const detail = (body as { detail?: unknown }).detail;
  if (!detail || typeof detail !== "object") return null;
  const d = detail as Partial<QuotaError>;
  if (d.error !== "quota_exceeded" && d.error !== "no_active_plan") return null;
  return d as QuotaError;
}

export type UpgradeKind =
  | "pages"        // hit pages_per_month or max_pages_per_book
  | "quizzes"
  | "chat"
  | "translate"
  | "no_plan";

export function upgradeUrl(kind: UpgradeKind): string {
  return `/account?upgrade=${kind}`;
}

// ─── Email-gate 402s (anonymous-user gate) ───────────────────────────────────

export interface EmailRequiredError {
  error: "email_required";
  action: string;
  message: string;
}

/** Detect the structured 402 sent by `require_non_anonymous` on the backend.
 *  Distinct from `parseQuotaError` so callers can branch between "open the
 *  email modal" and "open the paywall modal." */
export function parseEmailRequired(err: unknown): EmailRequiredError | null {
  if (!(err instanceof ApiError)) return null;
  if (err.status !== 402) return null;
  const body = err.body;
  if (!body || typeof body !== "object") return null;
  const detail = (body as { detail?: unknown }).detail;
  if (!detail || typeof detail !== "object") return null;
  const d = detail as Partial<EmailRequiredError>;
  if (d.error !== "email_required") return null;
  return d as EmailRequiredError;
}
