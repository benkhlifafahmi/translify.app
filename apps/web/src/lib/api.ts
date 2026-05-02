/**
 * API client. Stores JWT in localStorage; sends as Bearer header.
 *
 * For production-grade security we'll move to httpOnly cookies in Phase 7
 * when we wire Stripe; for now, localStorage keeps the API simple.
 */
/** No trailing slash; paths passed to api() start with `/` (e.g. prod: https://translify.app/api). */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TOKEN_KEY = "translify_jwt";

export class ApiError extends Error {
  constructor(public status: number, public body: unknown, message?: string) {
    super(message ?? `Request failed with ${status}`);
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Send body as application/x-www-form-urlencoded (FastAPI-Users login expects this). */
  form?: Record<string, string>;
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const headers = new Headers(opts.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let body: BodyInit | undefined;
  if (opts.form) {
    headers.set("Content-Type", "application/x-www-form-urlencoded");
    body = new URLSearchParams(opts.form).toString();
  } else if (opts.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers,
    body,
  });

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, data, extractErrorMessage(data) ?? res.statusText);
  }

  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractErrorMessage(data: unknown): string | undefined {
  if (typeof data === "object" && data !== null) {
    const d = data as { detail?: unknown };
    if (typeof d.detail === "string") return d.detail;
    if (Array.isArray(d.detail) && d.detail[0]?.msg) return d.detail[0].msg;
  }
  return undefined;
}
