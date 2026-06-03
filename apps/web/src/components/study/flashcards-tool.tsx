"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { type FlashcardDeck } from "@/lib/flashcards";

const INPUT =
  "w-full rounded-xl border-[1.5px] border-[color:var(--color-border)] bg-[#FFFCF3] px-3 py-2 text-sm focus:border-[color:var(--color-saffron)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-saffron)]/30";

export function FlashcardsTool({ bookId, deck }: { bookId: string; deck: FlashcardDeck }) {
  const [mode, setMode] = useState<"review" | "manage">("review");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setMsg(null);
    try {
      const n = await deck.generateFromHighlights(bookId);
      setMsg(
        n > 0
          ? `Added ${n} card${n === 1 ? "" : "s"} from your highlights.`
          : "No new highlights to turn into cards yet. Highlight as you read.",
      );
    } catch {
      setMsg("Couldn't load your highlights. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 p-5">
      <div>
        <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold leading-tight tracking-tight text-[color:var(--color-ink)]">
          Flashcards
        </h3>
        <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
          Test yourself, then let the spacing do the work.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="accent" size="sm" onClick={generate} disabled={busy}>
          {busy ? "Generating…" : "Generate from highlights"}
        </Button>
        <div className="ml-auto inline-flex overflow-hidden rounded-full border-[1.5px] border-[color:var(--color-border)] text-[0.82rem]">
          {(["review", "manage"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-3.5 py-1 font-medium transition-colors ${
                mode === m
                  ? "bg-[color:var(--color-ink)] text-[color:var(--color-paper)]"
                  : "text-[color:var(--color-ink-soft)] hover:bg-[color:var(--color-paper-3)]/60"
              }`}
            >
              {m === "review" ? `Review${deck.due.length ? ` · ${deck.due.length}` : ""}` : `All · ${deck.cards.length}`}
            </button>
          ))}
        </div>
      </div>
      {msg && <p className="text-[0.78rem] text-[color:var(--color-sage-deep)]">{msg}</p>}

      {mode === "review" ? <Review deck={deck} /> : <Manage deck={deck} />}
    </div>
  );
}

function EmptyHint() {
  return (
    <p className="rounded-2xl border-[1.5px] border-dashed border-[color:var(--color-border)] p-5 text-center text-sm text-[color:var(--color-ink-soft)]">
      No cards yet. Highlight passages while you read, then “Generate from
      highlights”, or add your own in the All tab.
    </p>
  );
}

function Review({ deck }: { deck: FlashcardDeck }) {
  const [revealed, setRevealed] = useState(false);
  const card = deck.due[0];

  if (deck.cards.length === 0) return <EmptyHint />;
  if (!card) {
    return (
      <p className="rounded-2xl border-[1.5px] border-dashed border-[color:var(--color-border)] p-5 text-center text-sm text-[color:var(--color-ink-soft)]">
        🎉 Nothing due right now. Switch to “All” to review ahead.
      </p>
    );
  }

  function grade(ok: boolean) {
    deck.grade(card.id, ok);
    setRevealed(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-ink-soft)]">
        {deck.due.length} to review
      </p>

      <div className="rounded-2xl border-[1.5px] border-[color:var(--color-border-strong)] bg-[#FFFCF3] p-5 shadow-[0_8px_22px_-12px_rgba(74,60,30,0.18)]">
        <span className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-ink-soft)]">
          Prompt
        </span>
        <p className="mt-1.5 text-[1.05rem] leading-relaxed text-[color:var(--color-ink)]">{card.front}</p>

        {revealed && (
          <>
            <hr className="my-4 border-[color:var(--color-border)]" />
            <span className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-sage-deep)]">
              Answer
            </span>
            <p className="mt-1.5 text-[1.05rem] leading-relaxed text-[color:var(--color-ink)]">{card.back}</p>
          </>
        )}
      </div>

      {revealed ? (
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => grade(false)}>
            Again
          </Button>
          <Button variant="sage" className="flex-1" onClick={() => grade(true)}>
            Got it
          </Button>
        </div>
      ) : (
        <Button variant="accent" onClick={() => setRevealed(true)}>
          Show answer
        </Button>
      )}
    </div>
  );
}

function Manage({ deck }: { deck: FlashcardDeck }) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-2xl border-[1.5px] border-[color:var(--color-border)] bg-[#FFFCF3] p-3">
        <input className={INPUT} placeholder="Front (prompt)" value={front} onChange={(e) => setFront(e.target.value)} />
        <input className={INPUT} placeholder="Back (answer)" value={back} onChange={(e) => setBack(e.target.value)} />
        <Button
          size="sm"
          variant="accent"
          disabled={!front.trim() || !back.trim()}
          onClick={() => {
            deck.addCard(front, back);
            setFront("");
            setBack("");
          }}
        >
          Add card
        </Button>
      </div>

      {deck.cards.length === 0 ? (
        <EmptyHint />
      ) : (
        <ul className="divide-y divide-[color:var(--color-border)]">
          {deck.cards.map((c) => (
            <Row key={c.id} card={c} deck={deck} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Row({ card, deck }: { card: FlashcardDeck["cards"][number]; deck: FlashcardDeck }) {
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState(card.front);
  const [b, setB] = useState(card.back);

  if (editing) {
    return (
      <li className="flex flex-col gap-2 py-3">
        <input className={INPUT} value={f} onChange={(e) => setF(e.target.value)} />
        <input className={INPUT} value={b} onChange={(e) => setB(e.target.value)} />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="accent"
            onClick={() => {
              deck.updateCard(card.id, { front: f, back: b });
              setEditing(false);
            }}
          >
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="group flex items-start gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[color:var(--color-ink)]">{card.front}</p>
        <p className="mt-0.5 line-clamp-2 text-[0.8rem] text-[color:var(--color-ink-soft)]">{card.back}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          setF(card.front);
          setB(card.back);
          setEditing(true);
        }}
        title="Edit"
        className="text-[color:var(--color-ink-soft)] opacity-0 transition-opacity hover:text-[color:var(--color-ink)] group-hover:opacity-100"
      >
        ✎
      </button>
      <button
        type="button"
        onClick={() => deck.removeCard(card.id)}
        title="Delete"
        className="text-[color:var(--color-ink-soft)] opacity-0 transition-opacity hover:text-[color:var(--color-destructive)] group-hover:opacity-100"
      >
        ✕
      </button>
    </li>
  );
}
