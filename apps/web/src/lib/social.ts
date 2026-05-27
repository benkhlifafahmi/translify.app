/**
 * Social API client. Wraps the /social/* endpoints with typed helpers.
 *
 * Shape mirrors the backend pydantic schemas in
 * apps/api/app/schemas/social.py. Polymorphic Post payloads are typed
 * per-kind via a discriminated union; create helpers ship one builder per
 * post type so consumers can't conflate shapes.
 */
import { api } from "./api";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PostType =
  | "word"
  | "sentence"
  | "passage"
  | "milestone"
  | "list"
  | "reflection";

export type PostVisibility = "public" | "followers" | "private";

export type MilestoneKind =
  | "first_book_finished"
  | "book_finished"
  | "streak_7"
  | "streak_30"
  | "streak_100"
  | "words_100"
  | "words_500"
  | "words_1000"
  | "quiz_perfect"
  | "garden_bloom";

export interface WordPayload {
  source_word: string;
  target_word: string;
  part_of_speech?: string | null;
  pronunciation?: string | null;
  example?: string | null;
}
export interface SentencePayload {
  source_text: string;
  target_text: string;
}
export interface PassagePayload {
  source_text: string;
  target_text: string;
  source_page?: number | null;
}
export interface MilestonePayload {
  kind: MilestoneKind;
  label: string;
  value?: number | null;
  icon?: string | null;
}
export interface ListPayload {
  title: string;
  description?: string | null;
  book_ids: string[];
}
export interface ReflectionPayload {
  text: string;
}

export type PostPayload =
  | WordPayload
  | SentencePayload
  | PassagePayload
  | MilestonePayload
  | ListPayload
  | ReflectionPayload;

export interface PostAuthor {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface Post {
  id: string;
  type: PostType;
  payload: PostPayload;
  book_id: string | null;
  highlight_id: string | null;
  source_lang: string | null;
  target_lang: string | null;
  note: string | null;
  visibility: PostVisibility;
  share_slug: string;
  created_at: string;
  author: PostAuthor | null;
  book_title: string | null;
  book_author: string | null;
}

export interface PublicProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  profile_public: boolean;
  created_at: string;
  post_count: number;
  follower_count: number;
  following_count: number;
  is_following: boolean;
}

export interface FollowStatus {
  is_following: boolean;
  follower_count: number;
  following_count: number;
}

export interface UserSearchResult {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

// ─── Common create-post fields ───────────────────────────────────────────────

interface CreateCommon {
  book_id?: string | null;
  highlight_id?: string | null;
  source_lang?: string | null;
  target_lang?: string | null;
  note?: string | null;
  visibility?: PostVisibility;
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export function claimUsername(username: string): Promise<PublicProfile> {
  return api<PublicProfile>("/social/profile/username", {
    method: "POST",
    body: { username },
  });
}

export function patchProfile(patch: {
  bio?: string | null;
  avatar_url?: string | null;
  profile_public?: boolean;
}): Promise<PublicProfile> {
  return api<PublicProfile>("/social/profile", { method: "PATCH", body: patch });
}

export function getPublicProfile(username: string): Promise<PublicProfile> {
  return api<PublicProfile>(`/social/users/${encodeURIComponent(username)}`);
}

// ─── Posts ───────────────────────────────────────────────────────────────────

export function createWordPost(
  payload: WordPayload,
  extras: CreateCommon = {},
): Promise<Post> {
  return api<Post>("/social/posts", {
    method: "POST",
    body: { type: "word", payload, ...extras },
  });
}

export function createSentencePost(
  payload: SentencePayload,
  extras: CreateCommon = {},
): Promise<Post> {
  return api<Post>("/social/posts", {
    method: "POST",
    body: { type: "sentence", payload, ...extras },
  });
}

export function createPassagePost(
  payload: PassagePayload,
  extras: CreateCommon = {},
): Promise<Post> {
  return api<Post>("/social/posts", {
    method: "POST",
    body: { type: "passage", payload, ...extras },
  });
}

export function createMilestonePost(
  payload: MilestonePayload,
  extras: Pick<CreateCommon, "book_id" | "note" | "visibility"> = {},
): Promise<Post> {
  return api<Post>("/social/posts", {
    method: "POST",
    body: { type: "milestone", payload, ...extras },
  });
}

export function createListPost(
  payload: ListPayload,
  extras: Pick<CreateCommon, "note" | "visibility"> = {},
): Promise<Post> {
  return api<Post>("/social/posts", {
    method: "POST",
    body: { type: "list", payload, ...extras },
  });
}

export function createReflectionPost(
  payload: ReflectionPayload,
  extras: Pick<CreateCommon, "book_id" | "note" | "visibility"> = {},
): Promise<Post> {
  return api<Post>("/social/posts", {
    method: "POST",
    body: { type: "reflection", payload, ...extras },
  });
}

export function getPost(slug: string): Promise<Post> {
  return api<Post>(`/social/posts/${encodeURIComponent(slug)}`);
}

export function deletePost(id: string): Promise<void> {
  return api<void>(`/social/posts/${id}`, { method: "DELETE" });
}

export function listUserPosts(
  username: string,
  opts: { type?: PostType; cursor?: string; limit?: number } = {},
): Promise<Post[]> {
  const q = new URLSearchParams();
  if (opts.type) q.set("type", opts.type);
  if (opts.cursor) q.set("cursor", opts.cursor);
  if (opts.limit) q.set("limit", String(opts.limit));
  const qs = q.toString();
  return api<Post[]>(
    `/social/users/${encodeURIComponent(username)}/posts${qs ? `?${qs}` : ""}`,
  );
}

export function getFeed(opts: { cursor?: string; limit?: number } = {}): Promise<Post[]> {
  const q = new URLSearchParams();
  if (opts.cursor) q.set("cursor", opts.cursor);
  if (opts.limit) q.set("limit", String(opts.limit));
  const qs = q.toString();
  return api<Post[]>(`/social/feed${qs ? `?${qs}` : ""}`);
}

export function getDiscover(
  opts: { cursor?: string; limit?: number; type?: PostType } = {},
): Promise<Post[]> {
  const q = new URLSearchParams();
  if (opts.cursor) q.set("cursor", opts.cursor);
  if (opts.limit) q.set("limit", String(opts.limit));
  if (opts.type) q.set("type", opts.type);
  const qs = q.toString();
  return api<Post[]>(`/social/discover${qs ? `?${qs}` : ""}`);
}

// ─── Follow ──────────────────────────────────────────────────────────────────

export function followUser(userId: string): Promise<FollowStatus> {
  return api<FollowStatus>(`/social/follow/${userId}`, { method: "POST" });
}

export function unfollowUser(userId: string): Promise<FollowStatus> {
  return api<FollowStatus>(`/social/follow/${userId}`, { method: "DELETE" });
}

// ─── Search ──────────────────────────────────────────────────────────────────

export function searchUsers(
  q: string,
  limit = 10,
): Promise<UserSearchResult[]> {
  const params = new URLSearchParams({ q, limit: String(limit) });
  return api<UserSearchResult[]>(`/social/search?${params.toString()}`);
}

// ─── Milestones ──────────────────────────────────────────────────────────────

export interface Milestone {
  id: string;
  kind: MilestoneKind;
  context: Record<string, unknown>;
  shared_post_id: string | null;
  created_at: string;
}

export function listPendingMilestones(): Promise<Milestone[]> {
  return api<Milestone[]>("/social/milestones/pending");
}

export function shareMilestone(
  id: string,
  body: { note?: string | null; visibility?: PostVisibility } = {},
): Promise<Post> {
  return api<Post>(`/social/milestones/${id}/share`, { method: "POST", body });
}

export function dismissMilestone(id: string): Promise<void> {
  return api<void>(`/social/milestones/${id}/dismiss`, { method: "POST" });
}
