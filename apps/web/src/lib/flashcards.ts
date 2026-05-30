// Flashcards — client-side spaced repetition (Leitner), localStorage per book.
//
// Cards seed from the reader's highlights (text, notes, and any saved AI
// answers) and can be added/edited by hand. Active recall + spacing are the two
// most strongly evidenced study techniques, so this is the "actually remember
// it" core of the study workspace. Persistence is localStorage for now; the
// shapes are backend-ready for when a /flashcards endpoint exists.

import { useCallback, useEffect, useState } from "react";
import { listBookHighlights, type Highlight } from "@/lib/highlights";

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  /** Source highlight id, used to avoid re-importing the same highlight twice. */
  sourceId?: string;
  // --- Leitner scheduling ---
  box: number; // 0..5 — higher box = longer interval
  due: number; // epoch ms when next due
  reps: number;
  lapses: number;
  createdAt: number;
}

// Days until the next review for each Leitner box.
const BOX_DAYS = [0, 1, 2, 4, 8, 16];
const DAY_MS = 86_400_000;

const storeKey = (bookId: string) => `translify_flashcards_${bookId}`;

function load(bookId: string): Flashcard[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storeKey(bookId));
    return raw ? (JSON.parse(raw) as Flashcard[]) : [];
  } catch {
    return [];
  }
}

function persist(bookId: string, cards: Flashcard[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storeKey(bookId), JSON.stringify(cards));
  } catch {
    /* quota / private mode — non-fatal */
  }
}

function uid(): string {
  return `c_${Math.floor(performance.now() * 1000).toString(36)}_${(
    globalThis.crypto?.getRandomValues(new Uint32Array(1))[0] ?? 0
  ).toString(36)}`;
}

function clip(s: string, n = 600): string {
  const t = s.trim().replace(/\s+/g, " ");
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

function newCard(front: string, back: string, sourceId?: string): Flashcard {
  return {
    id: uid(),
    front,
    back,
    sourceId,
    box: 0,
    due: Date.now(),
    reps: 0,
    lapses: 0,
    createdAt: Date.now(),
  };
}

/** Turn a highlight into a card. Returns null if there's nothing useful. */
function cardFromHighlight(h: Highlight): Flashcard | null {
  const text = (h.text ?? "").trim();
  const note = (h.note ?? "").trim();
  const q = (h.ai_question ?? "").trim();
  const a = (h.ai_answer ?? "").trim();
  if (a) return newCard(q || "Explain this passage:", clip(a), h.id);
  if (note) return newCard(clip(note, 200), clip(text || note), h.id);
  if (text) return newCard(`Recall the key idea (p.${h.page})`, clip(text), h.id);
  return null;
}

export interface FlashcardDeck {
  cards: Flashcard[];
  /** Cards due for review right now. */
  due: Flashcard[];
  addCard: (front: string, back: string) => void;
  updateCard: (id: string, patch: Partial<Pick<Flashcard, "front" | "back">>) => void;
  removeCard: (id: string) => void;
  /** correct=true advances the Leitner box; false resets it. */
  grade: (id: string, correct: boolean) => void;
  /** Import any highlights not already turned into cards. Returns count added. */
  generateFromHighlights: (bookId: string) => Promise<number>;
}

export function useFlashcards(bookId: string): FlashcardDeck {
  const [cards, setCards] = useState<Flashcard[]>(() => load(bookId));
  // Fixed "now" for the session so the due list doesn't shift mid-review.
  const [now] = useState(() => Date.now());

  useEffect(() => {
    setCards(load(bookId));
  }, [bookId]);

  const mutate = useCallback(
    (fn: (c: Flashcard[]) => Flashcard[]) => {
      setCards((cur) => {
        const next = fn(cur);
        persist(bookId, next);
        return next;
      });
    },
    [bookId],
  );

  const addCard = useCallback(
    (front: string, back: string) => {
      const f = front.trim();
      const b = back.trim();
      if (!f || !b) return;
      mutate((c) => [...c, newCard(f, b)]);
    },
    [mutate],
  );

  const updateCard = useCallback(
    (id: string, patch: Partial<Pick<Flashcard, "front" | "back">>) =>
      mutate((c) => c.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    [mutate],
  );

  const removeCard = useCallback(
    (id: string) => mutate((c) => c.filter((x) => x.id !== id)),
    [mutate],
  );

  const grade = useCallback(
    (id: string, correct: boolean) =>
      mutate((c) =>
        c.map((x) => {
          if (x.id !== id) return x;
          const box = correct ? Math.min(BOX_DAYS.length - 1, x.box + 1) : 0;
          // A lapse comes back in ~1 minute; a pass waits out the box interval.
          const due = Date.now() + BOX_DAYS[box] * DAY_MS + (correct ? 0 : 60_000);
          return { ...x, box, due, reps: x.reps + 1, lapses: x.lapses + (correct ? 0 : 1) };
        }),
      ),
    [mutate],
  );

  const generateFromHighlights = useCallback(
    async (bid: string) => {
      const highlights = await listBookHighlights(bid);
      let added = 0;
      mutate((c) => {
        const have = new Set(c.map((x) => x.sourceId).filter(Boolean));
        const fresh: Flashcard[] = [];
        for (const h of highlights) {
          if (have.has(h.id)) continue;
          const card = cardFromHighlight(h);
          if (!card) continue;
          fresh.push(card);
          added++;
        }
        return [...c, ...fresh];
      });
      return added;
    },
    [mutate],
  );

  const due = cards.filter((c) => c.due <= now);

  return { cards, due, addCard, updateCard, removeCard, grade, generateFromHighlights };
}
