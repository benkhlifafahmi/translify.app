// Mind maps — AI-generated from the book, editable, localStorage per book.
//
// Generation goes through the existing book-chat endpoint (which is book-aware),
// asking for a nested outline that we parse into a tree. "Dual coding" — pairing
// words with a visual structure — helps a learner see how the pieces of a topic
// connect, which is exactly what's wanted when a chapter feels tangled.
// Persistence is localStorage for now; shapes are backend-ready.

import { useCallback, useEffect, useState } from "react";
import { createBookChat, deleteChat, listMessages, sendMessage } from "@/lib/chats";

export interface MindNode {
  id: string;
  label: string;
  children: MindNode[];
  collapsed?: boolean;
}

export interface MindMap {
  id: string;
  title: string;
  root: MindNode;
  createdAt: number;
  updatedAt: number;
}

const storeKey = (bookId: string) => `translify_mindmaps_${bookId}`;

function uid(): string {
  return `m_${Math.floor(performance.now() * 1000).toString(36)}_${(
    globalThis.crypto?.getRandomValues(new Uint32Array(1))[0] ?? 0
  ).toString(36)}`;
}

export function newNodeId(): string {
  return uid();
}

function load(bookId: string): MindMap[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storeKey(bookId));
    return raw ? (JSON.parse(raw) as MindMap[]) : [];
  } catch {
    return [];
  }
}

function persist(bookId: string, maps: MindMap[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storeKey(bookId), JSON.stringify(maps));
  } catch {
    /* non-fatal */
  }
}

// ---------------------------------------------------------------------------
// Outline parsing
// ---------------------------------------------------------------------------

/**
 * Parse a nested markdown bullet list into top-level nodes. Depth is taken from
 * indentation; comparisons are relative, so any indent width (2/4/tab) nests
 * correctly. Non-bullet lines (prose, code fences) are ignored.
 */
export function parseOutline(md: string): MindNode[] {
  const lines = md
    .split("\n")
    .map((l) => l.replace(/\t/g, "  "))
    .filter((l) => /\S/.test(l));

  const rows: { depth: number; label: string }[] = [];
  for (const line of lines) {
    const m = line.match(/^(\s*)(?:[-*+•]|\d+\.)\s+(.*)$/);
    if (!m) continue;
    const label = m[2].replace(/\*\*/g, "").replace(/`/g, "").replace(/^#+\s*/, "").trim();
    if (!label) continue;
    rows.push({ depth: m[1].length, label });
  }

  const roots: MindNode[] = [];
  const stack: { depth: number; node: MindNode }[] = [];
  for (const r of rows) {
    const node: MindNode = { id: uid(), label: r.label, children: [] };
    while (stack.length && stack[stack.length - 1].depth >= r.depth) stack.pop();
    if (stack.length === 0) roots.push(node);
    else stack[stack.length - 1].node.children.push(node);
    stack.push({ depth: r.depth, node });
  }
  return roots;
}

// ---------------------------------------------------------------------------
// AI generation (via the book chat)
// ---------------------------------------------------------------------------

/** Generate a mind map for a topic, grounded in the book, via the chat AI. */
export async function generateMindMap(
  bookId: string,
  topic: string,
  translationId: string | null,
): Promise<MindNode> {
  const chat = await createBookChat(bookId);
  try {
    const prompt =
      `Create a study mind map for the topic "${topic}" based on this book.\n` +
      `Respond with ONLY a nested markdown bullet list using "-" and 2-space indentation. ` +
      `Maximum 3 levels deep. Keep each node label short (2-6 words). ` +
      `The first top-level bullet is the single central concept; everything else nests beneath it. ` +
      `No introduction, no closing remarks, no code fences.`;
    await sendMessage(chat.id, prompt, translationId);
    const msgs = await listMessages(chat.id);
    const reply = [...msgs].reverse().find((m) => m.role === "assistant")?.content ?? "";
    const roots = parseOutline(reply);
    if (roots.length === 0) {
      return { id: uid(), label: topic, children: [] };
    }
    if (roots.length === 1) return roots[0];
    return { id: uid(), label: topic, children: roots };
  } finally {
    // Best-effort cleanup so generation doesn't clutter the chat list.
    void deleteChat(chat.id).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Immutable tree edits (by node id)
// ---------------------------------------------------------------------------

export function mapNode(root: MindNode, id: string, fn: (n: MindNode) => MindNode): MindNode {
  if (root.id === id) return fn(root);
  return { ...root, children: root.children.map((c) => mapNode(c, id, fn)) };
}

export function removeNode(root: MindNode, id: string): MindNode {
  return {
    ...root,
    children: root.children.filter((c) => c.id !== id).map((c) => removeNode(c, id)),
  };
}

export function addChild(root: MindNode, parentId: string, label = "New idea"): MindNode {
  return mapNode(root, parentId, (n) => ({
    ...n,
    collapsed: false,
    children: [...n.children, { id: uid(), label, children: [] }],
  }));
}

export function countNodes(n: MindNode): number {
  return 1 + n.children.reduce((sum, c) => sum + countNodes(c), 0);
}

// ---------------------------------------------------------------------------
// Storage hook
// ---------------------------------------------------------------------------

export function makeMap(title: string, root: MindNode): MindMap {
  return { id: uid(), title, root, createdAt: Date.now(), updatedAt: Date.now() };
}

export interface MindMapStore {
  maps: MindMap[];
  saveMap: (map: MindMap) => void;
  deleteMap: (id: string) => void;
}

export function useMindMaps(bookId: string): MindMapStore {
  const [maps, setMaps] = useState<MindMap[]>(() => load(bookId));

  useEffect(() => {
    setMaps(load(bookId));
  }, [bookId]);

  const commit = useCallback(
    (fn: (m: MindMap[]) => MindMap[]) => {
      setMaps((cur) => {
        const next = fn(cur);
        persist(bookId, next);
        return next;
      });
    },
    [bookId],
  );

  const saveMap = useCallback(
    (map: MindMap) =>
      commit((m) => {
        const i = m.findIndex((x) => x.id === map.id);
        if (i >= 0) {
          const copy = [...m];
          copy[i] = map;
          return copy;
        }
        return [map, ...m];
      }),
    [commit],
  );

  const deleteMap = useCallback((id: string) => commit((m) => m.filter((x) => x.id !== id)), [commit]);

  return { maps, saveMap, deleteMap };
}
