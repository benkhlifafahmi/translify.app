// Reading-session tracker — feeds the garden gamification.
//
// We don't fire one event per page turn (too chatty, and rapid clicks
// shouldn't count as reading). Instead, we track the *furthest page reached*
// during the session and flush a "read" event when:
//   - the unflushed delta crosses FLUSH_PAGES_THRESHOLD, or
//   - the tab goes hidden / the page unmounts.
//
// Each flush posts {kind: "read", payload: {pages, minutes}} to the garden
// API. The backend decides growth/vitality from there.

import { useCallback, useEffect, useRef } from "react";
import { recordEvent } from "./garden";

const FLUSH_PAGES_THRESHOLD = 10;
const MIN_SESSION_MS = 8_000; // shorter sessions are probably bounces

interface SessionState {
  startedAt: number;
  furthestPage: number;
  // Pages already flushed — anything reached above this counts toward the
  // next flush.
  flushedThrough: number;
  // A run is "in flight" — coalesce concurrent flushes.
  flushing: boolean;
}

export function useReadingTracker(bookId: string | null | undefined) {
  const stateRef = useRef<SessionState | null>(null);

  // Lazy init the session on the first page-reached call so we don't count
  // the milliseconds spent on the loading shell.
  const ensureSession = useCallback(() => {
    if (stateRef.current) return stateRef.current;
    const s: SessionState = {
      startedAt: Date.now(),
      furthestPage: 0,
      flushedThrough: 0,
      flushing: false,
    };
    stateRef.current = s;
    return s;
  }, []);

  const flush = useCallback(async () => {
    const s = stateRef.current;
    if (!s || !bookId) return;
    const pages = s.furthestPage - s.flushedThrough;
    const minutes = Math.round((Date.now() - s.startedAt) / 60_000);
    if (pages <= 0) return;
    if (Date.now() - s.startedAt < MIN_SESSION_MS && minutes === 0) return;
    if (s.flushing) return;
    s.flushing = true;
    const flushingTo = s.furthestPage;
    try {
      await recordEvent(bookId, "read", { pages, minutes });
      s.flushedThrough = flushingTo;
      // Reset session timer so subsequent flushes report fresh minutes.
      s.startedAt = Date.now();
    } catch {
      // Network failures shouldn't kill the reading experience — we drop
      // this flush on the floor and the next one will catch up.
    } finally {
      s.flushing = false;
    }
  }, [bookId]);

  const markReached = useCallback(
    (page: number) => {
      if (!bookId || page <= 0) return;
      const s = ensureSession();
      if (page <= s.furthestPage) return;
      s.furthestPage = page;
      if (s.furthestPage - s.flushedThrough >= FLUSH_PAGES_THRESHOLD) {
        void flush();
      }
    },
    [bookId, ensureSession, flush],
  );

  // Flush on tab hide and on unmount — the unmount fires when navigating
  // away from the reader, which is the most common end-of-session signal.
  useEffect(() => {
    if (!bookId) return;
    const onVis = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      void flush();
    };
  }, [bookId, flush]);

  return { markReached, flush };
}
