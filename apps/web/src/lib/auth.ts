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

