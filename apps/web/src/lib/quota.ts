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
