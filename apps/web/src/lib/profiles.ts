import { api } from "./api";

export type ProfileKind = "adult" | "child";

export interface Profile {
  id: string;
  name: string;
  avatar_seed: string;
  kind: ProfileKind;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProfileInput {
  name: string;
  kind?: ProfileKind;
  avatar_seed?: string;
}

export interface UpdateProfileInput {
  name?: string;
  kind?: ProfileKind;
  avatar_seed?: string;
}

export async function listProfiles(): Promise<Profile[]> {
  return await api<Profile[]>("/profiles");
}

export async function createProfile(input: CreateProfileInput): Promise<Profile> {
  return await api<Profile>("/profiles", { method: "POST", body: input });
}

export async function updateProfileRequest(
  id: string,
  input: UpdateProfileInput,
): Promise<Profile> {
  return await api<Profile>(`/profiles/${id}`, { method: "PATCH", body: input });
}

export async function deleteProfile(id: string): Promise<void> {
  await api(`/profiles/${id}`, { method: "DELETE" });
}

export async function activateProfile(id: string): Promise<Profile> {
  return await api<Profile>(`/profiles/${id}/activate`, { method: "POST" });
}

/** Fixed palette of avatar seeds the UI can pick from. Stored as a seed
 *  (not the emoji) so the visual mapping can change without a backend touch. */
export const AVATAR_PALETTE = [
  { seed: "lumi", emoji: "🦉" },
  { seed: "fox", emoji: "🦊" },
  { seed: "bear", emoji: "🐻" },
  { seed: "panda", emoji: "🐼" },
  { seed: "cat", emoji: "🐱" },
  { seed: "rabbit", emoji: "🐰" },
  { seed: "dragon", emoji: "🐉" },
  { seed: "unicorn", emoji: "🦄" },
] as const;

export function avatarEmoji(seed: string): string {
  return (
    AVATAR_PALETTE.find((p) => p.seed === seed)?.emoji ??
    AVATAR_PALETTE[0].emoji
  );
}
