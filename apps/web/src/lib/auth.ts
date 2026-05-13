import { api, setToken } from "./api";

export interface User {
  id: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  display_name: string | null;
  preferred_language: string;
  family_safe_mode: boolean;
  active_profile_id: string | null;
}

export async function login(email: string, password: string): Promise<User> {
  const res = await api<{ access_token: string; token_type: string }>("/auth/jwt/login", {
    method: "POST",
    form: { username: email, password },
  });
  setToken(res.access_token);
  return await me();
}

export async function register(
  email: string,
  password: string,
  displayName?: string,
): Promise<User> {
  await api("/auth/register", {
    method: "POST",
    body: { email, password, display_name: displayName ?? null },
  });
  return await login(email, password);
}

export async function me(): Promise<User> {
  return await api<User>("/users/me");
}

export async function logout(): Promise<void> {
  try {
    await api("/auth/jwt/logout", { method: "POST" });
  } catch {
    // ignore — token cleared regardless
  }
  setToken(null);
}

export interface UpdateProfileInput {
  display_name?: string | null;
  preferred_language?: string;
  password?: string;
  email?: string;
  family_safe_mode?: boolean;
}

export async function updateProfile(input: UpdateProfileInput): Promise<User> {
  return await api<User>("/users/me", { method: "PATCH", body: input });
}

/** Sends a password-reset email. Always succeeds from the client's POV
 * (the API returns 202 even if the email isn't on file — anti-enumeration). */
export async function requestPasswordReset(email: string): Promise<void> {
  await api("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await api("/auth/reset-password", {
    method: "POST",
    body: { token, password },
  });
}

export async function verifyEmail(token: string): Promise<User> {
  return await api<User>("/auth/verify", {
    method: "POST",
    body: { token },
  });
}

export async function requestVerificationResend(email: string): Promise<void> {
  await api("/auth/request-verify-token", {
    method: "POST",
    body: { email },
  });
}

// ─── Google OAuth ──────────────────────────────────────────────────────────────

// ─── Silent-signup + magic-link ────────────────────────────────────────────────

export interface StartSessionResponse {
  user_id: string | null;
  is_new_user: boolean;
  requires_password: boolean;
  access_token: string | null;
  token_type: string;
  magic_link_sent: boolean;
}

/** Email-only sign-up. If the email is new, returns a JWT and the caller is
 * immediately logged in. If the email is taken, ``access_token`` is null and a
 * magic-link email has been sent — the caller should prompt the visitor to
 * check their inbox. */
export async function startSession(input: {
  email: string;
  topics?: string[];
  preferred_language?: string;
  referrer?: string;
}): Promise<StartSessionResponse> {
  const res = await api<StartSessionResponse>("/onboarding/start-session", {
    method: "POST",
    body: input,
  });
  if (res.access_token) setToken(res.access_token);
  return res;
}

/** Idempotent — server returns 202 whether or not the email is registered. */
export async function requestMagicLink(email: string): Promise<void> {
  await api("/auth/magic-link/request", {
    method: "POST",
    body: { email },
  });
}

export async function redeemMagicLink(token: string): Promise<User> {
  const res = await api<{ access_token: string; token_type: string; user_id: string }>(
    "/auth/magic-link/redeem",
    { method: "POST", body: { token } },
  );
  setToken(res.access_token);
  return await me();
}

/** Returns the Google authorization URL to redirect the user to. */
export async function getGoogleAuthUrl(callbackUrl: string): Promise<string> {
  const res = await api<{ authorization_url: string }>(
    `/auth/google/authorize?redirect_url=${encodeURIComponent(callbackUrl)}`,
  );
  return res.authorization_url;
}

/** Exchanges the Google OAuth code+state for a JWT. Called from the callback page. */
export async function loginWithGoogleCallback(
  code: string,
  state: string,
  callbackUrl: string,
): Promise<User> {
  const params = new URLSearchParams({ code, state, redirect_url: callbackUrl });
  const res = await api<{ access_token: string; token_type: string }>(
    `/auth/google/callback?${params.toString()}`,
  );
  setToken(res.access_token);
  return await me();
}

