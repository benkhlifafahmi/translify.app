import { api } from "./api";

export interface AdminUserSummary {
  id: string;
  email: string;
  display_name: string | null;
  username: string | null;
  is_anonymous: boolean;
  is_verified: boolean;
  is_superuser: boolean;
  created_at: string | null;
  plan: string;
  status: string;
  book_count: number;
}

export interface AdminUserList {
  users: AdminUserSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminBookRow {
  id: string;
  title: string;
  author: string | null;
  format: string;
  status: string;
  page_count: number | null;
  file_size_bytes: number;
  created_at: string;
}

export interface AdminSubscriptionInfo {
  plan: string;
  cycle: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  has_stripe_customer: boolean;
  stripe_customer_id: string | null;
}

export interface AdminUsageInfo {
  period_start: string | null;
  pages_uploaded: number;
  quizzes_generated: number;
}

export interface AdminUserStats {
  book_count: number;
  pages_total: number;
  storage_bytes: number;
  highlight_count: number;
  quiz_count: number;
  chat_count: number;
  translation_count: number;
}

export interface AdminUserDetail {
  id: string;
  email: string;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  preferred_language: string;
  is_anonymous: boolean;
  is_active: boolean;
  is_verified: boolean;
  is_superuser: boolean;
  family_safe_mode: boolean;
  created_at: string | null;
  subscription: AdminSubscriptionInfo;
  usage: AdminUsageInfo;
  stats: AdminUserStats;
  books: AdminBookRow[];
}

export interface AdminEmailResponse {
  sent: boolean;
  to: string;
  detail: string | null;
}

export async function listAdminUsers(params: {
  query?: string;
  limit?: number;
  offset?: number;
}): Promise<AdminUserList> {
  const q = new URLSearchParams();
  if (params.query) q.set("query", params.query);
  q.set("limit", String(params.limit ?? 50));
  q.set("offset", String(params.offset ?? 0));
  return api<AdminUserList>(`/admin/users?${q.toString()}`);
}

export async function getAdminUser(userId: string): Promise<AdminUserDetail> {
  return api<AdminUserDetail>(`/admin/users/${userId}`);
}

export async function sendAdminEmail(
  userId: string,
  payload: { subject: string; body: string },
): Promise<AdminEmailResponse> {
  return api<AdminEmailResponse>(`/admin/users/${userId}/email`, {
    method: "POST",
    body: payload,
  });
}

// ── small formatting helpers, shared by the admin UI ──

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
