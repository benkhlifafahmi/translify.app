import { api, setToken } from "./api";

export interface User {
  id: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  display_name: string | null;
  preferred_language: string;
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

