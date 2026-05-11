// Reading-garden gamification — data layer.
//
// Wired to the backend at /gardens/*. The shapes here match the camelCased
// wire format produced by app/schemas/garden.py.

import { api } from "./api";

export type SpeciesId = "ficus" | "helianthus" | "lavandula" | "monstera";

export interface Species {
  id: SpeciesId;
  name: string;
  latin: string;
  blurb: string;
  unlocked: boolean;
}

export const SPECIES: Species[] = [
  { id: "ficus",      name: "Ficus litteraria", latin: "novel-fig",       blurb: "Rewards long, immersive sessions.", unlocked: true  },
  { id: "helianthus", name: "Helianthus",       latin: "poet's sunflower", blurb: "Loves daily streaks.",              unlocked: true  },
  { id: "lavandula",  name: "Lavandula",        latin: "essay-lavender",   blurb: "Thrives on careful note-taking.",   unlocked: true  },
  { id: "monstera",   name: "Monstera",         latin: "epic-leaf",        blurb: "Unlocks after your first finished book.", unlocked: false },
];

export type FarmerHat   = "straw" | "wool" | "scholar" | "none";
export type FarmerCoat  = "denim" | "linen" | "earth"  | "moss";
export type FarmerSkin  = "fair" | "tan" | "umber" | "sepia";
export type FarmerTool  = "watering-can" | "shears" | "lantern" | "book";

export interface Farmer {
  hat: FarmerHat;
  coat: FarmerCoat;
  skin: FarmerSkin;
  tool: FarmerTool;
  name: string;
}

/** 0 (seed) → 6 (full bloom). Stage IV = bud forming. */
export type GrowthStage = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type GardenHealth = "thriving" | "budding" | "wilting" | "dying";

export type EventKind = "read" | "quiz" | "water" | "skip" | "translate" | "tend";

export interface JournalEntry {
  id: string;
  at: string;          // ISO
  kind: EventKind;
  what: string;        // already formatted by the server; html subset (`<em>`)
  delta: string;       // e.g. "+ 6 leaves", "− 1 droplet"
  warn?: boolean;
}

export interface Garden {
  bookId: string;
  bookTitle: string;
  bookAuthor: string | null;
  startedAt: string;       // ISO
  species: SpeciesId;
  farmer: Farmer;

  stage: GrowthStage;
  growthPercent: number;
  pagesRead: number;
  pageCount: number;
  pagesReadDelta: number;
  quizzesAnswered: number;
  quizzesTotal: number;
  quizAccuracyPercent: number;

  vitality: number;
  vitalityCapacity: number;
  daysUntilThirst: number;
  weeklyTendingDueAt: string;

  streakDays: number;
  bestStreakDays: number;
  newLeaves: number;
  lastLeafAt: string | null;

  journal: JournalEntry[];
}

export interface GardenSummary {
  bookId: string;
  bookTitle: string;
  bookAuthor: string | null;
  species: SpeciesId;
  stage: GrowthStage;
  growthPercent: number;
  health: GardenHealth;
}

// --- Weekly tending -------------------------------------------------------

export interface TendingQuestion {
  id: string;
  prompt: string;
  choices: string[];
  /** Server strips these pre-submit; only present in mock fixtures. */
  correctIndex?: number;
  explanation?: string;
}

export interface TendingResult {
  score: number;
  total: number;
  passed: boolean;
  growthGained: number;
  vitalityRestored: number;
  newStage: GrowthStage;
  nextDueAt: string;
  perQuestion: {
    id: string;
    correct: boolean;
    givenIndex: number;
    /** Revealed only in the post-submit response. */
    correctIndex?: number;
    explanation?: string;
  }[];
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export async function getGarden(bookId: string): Promise<Garden> {
  return api<Garden>(`/gardens/${bookId}`);
}

export async function listGardens(): Promise<GardenSummary[]> {
  return api<GardenSummary[]>(`/gardens`);
}

export async function updateGarden(
  bookId: string,
  body: { species?: SpeciesId; farmer?: Farmer },
): Promise<Garden> {
  return api<Garden>(`/gardens/${bookId}`, {
    method: "PATCH",
    body,
  });
}

export async function recordEvent(
  bookId: string,
  kind: EventKind,
  payload: Record<string, unknown> = {},
): Promise<Garden> {
  return api<Garden>(`/gardens/${bookId}/events`, {
    method: "POST",
    body: { kind, payload },
  });
}

export async function getTendingQuestions(bookId: string): Promise<TendingQuestion[]> {
  return api<TendingQuestion[]>(`/gardens/${bookId}/tending`);
}

export async function submitTending(
  bookId: string,
  answers: { questionId: string; choiceIndex: number }[],
): Promise<TendingResult> {
  return api<TendingResult>(`/gardens/${bookId}/tending`, {
    method: "POST",
    body: { answers },
  });
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

/** "Day 14 of cultivation" */
export function daysSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(1, Math.floor(ms / 86_400_000));
}

/** Format an ISO date as "11 May · 09:14" */
export function formatJournalDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, "0");
  const month = d.toLocaleString("en", { month: "short" });
  const time = d.toTimeString().slice(0, 5);
  return `${day} ${month} · ${time}`;
}

/** Countdown formatted as HH:MM:SS, or "00:00:00" if past. */
export function countdown(iso: string, nowMs = Date.now()): string {
  const ms = new Date(iso).getTime() - nowMs;
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hh = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const mm = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const ss = (totalSeconds % 60).toString().padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
