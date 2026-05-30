"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Lumi } from "@/components/lumi/lumi";
import {
  addChild,
  countNodes,
  generateMindMap,
  makeMap,
  mapNode,
  removeNode,
  useMindMaps,
  type MindMap,
  type MindNode,
} from "@/lib/mindmap";

export function MindmapTool({ bookId }: { bookId: string }) {
  const store = useMindMaps(bookId);
  const [active, setActive] = useState<MindMap | null>(null);
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function generate() {
    const t = topic.trim();
    if (!t || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const root = await generateMindMap(bookId, t, null);
      const map = makeMap(t, root);
      store.saveMap(map);
      setActive(map);
      setTopic("");
    } catch {
      setErr("Couldn't generate the map. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (active) {
    return (
      <Editor
        map={active}
        onChange={(m) => {
          setActive(m);
          store.saveMap(m);
        }}
        onClose={() => setActive(null)}
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 p-5 sm:p-6">
      <div>
        <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold leading-tight tracking-tight text-[color:var(--color-ink)]">
          Mind map
        </h3>
        <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
          Ask the AI to map any topic from this book around a central idea, then
          reshape it to match how you think.
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border-[1.5px] border-[color:var(--color-border)] bg-[#FFFCF3] p-4">
        <label className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-ink-soft)]">
          Topic to understand
        </label>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") generate();
          }}
          placeholder="e.g. Eigenvalues, or Chapter 3"
          disabled={busy}
          className="rounded-xl border-[1.5px] border-[color:var(--color-border)] bg-white/70 px-3 py-2.5 text-sm focus:border-[color:var(--color-saffron)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-saffron)]/30"
        />
        <Button variant="accent" onClick={generate} disabled={busy || !topic.trim()}>
          {busy ? "Mapping…" : "Generate mind map"}
        </Button>
        {busy && (
          <div className="flex flex-col items-center gap-1 py-2">
            <Lumi state="thinking" size={64} animate />
            <p className="text-[0.72rem] italic text-[color:var(--color-ink-soft)]">
              Reading the book and mapping “{topic}”…
            </p>
          </div>
        )}
        {err && <p className="text-[0.78rem] text-[color:var(--color-destructive)]">{err}</p>}
      </div>

      {store.maps.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-ink-soft)]">
            Saved maps
          </p>
          <ul className="divide-y divide-[color:var(--color-border)]">
            {store.maps.map((m) => (
              <li key={m.id} className="group flex items-center gap-2 py-2.5">
                <button type="button" onClick={() => setActive(m)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-semibold text-[color:var(--color-ink)]">{m.title}</p>
                  <p className="text-[0.72rem] text-[color:var(--color-ink-soft)]">{countNodes(m.root)} nodes</p>
                </button>
                <button
                  type="button"
                  onClick={() => store.deleteMap(m.id)}
                  title="Delete"
                  className="opacity-0 transition-opacity group-hover:opacity-100 text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-destructive)]"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Center-out layout (topic in the middle, branches fan left + right)
// ---------------------------------------------------------------------------

interface Pos {
  x: number;
  y: number;
  depth: number;
}

const COL = 210; // horizontal distance per depth level
const ROW = 60; // vertical distance per leaf row
const PAD = 160; // canvas breathing room

function computeLayout(root: MindNode) {
  const pos: Record<string, Pos> = {};

  function place(node: MindNode, depth: number, sign: number, cursor: { v: number }): number {
    const kids = node.collapsed ? [] : node.children;
    let y: number;
    if (kids.length === 0) {
      y = cursor.v;
      cursor.v += ROW;
    } else {
      const ys = kids.map((k) => place(k, depth + 1, sign, cursor));
      y = (ys[0] + ys[ys.length - 1]) / 2;
    }
    pos[node.id] = { x: sign * depth * COL, y, depth };
    return y;
  }

  const kids = root.collapsed ? [] : root.children;
  const mid = Math.ceil(kids.length / 2);
  const right = kids.slice(0, mid);
  const left = kids.slice(mid);

  const rc = { v: 0 };
  const rightYs = right.map((k) => place(k, 1, 1, rc));
  const lc = { v: 0 };
  const leftYs = left.map((k) => place(k, 1, -1, lc));

  const firstYs = [...rightYs, ...leftYs];
  const rootY = firstYs.length ? firstYs.reduce((a, b) => a + b, 0) / firstYs.length : 0;
  pos[root.id] = { x: 0, y: rootY, depth: 0 };

  const all = Object.values(pos);
  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  const minX = Math.min(0, ...xs);
  const maxX = Math.max(0, ...xs);
  const minY = Math.min(0, ...ys);
  const maxY = Math.max(0, ...ys);
  const offX = -minX + PAD;
  const offY = -minY + PAD;
  const width = maxX - minX + PAD * 2;
  const height = maxY - minY + PAD * 2;

  const nodes: MindNode[] = [];
  const edges: { from: string; to: string }[] = [];
  const walk = (n: MindNode) => {
    nodes.push(n);
    const ch = n.collapsed ? [] : n.children;
    for (const c of ch) {
      edges.push({ from: n.id, to: c.id });
      walk(c);
    }
  };
  walk(root);

  return { pos, nodes, edges, width, height, offX, offY };
}

function curvePath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

interface NodeHandlers {
  onRename: (id: string, label: string) => void;
  onAdd: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

function Editor({
  map,
  onChange,
  onClose,
}: {
  map: MindMap;
  onChange: (m: MindMap) => void;
  onClose: () => void;
}) {
  const root = map.root;
  const update = (next: MindNode) => onChange({ ...map, root: next, updatedAt: Date.now() });
  const handlers: NodeHandlers = {
    onRename: (id, label) => update(mapNode(root, id, (n) => ({ ...n, label }))),
    onAdd: (id) => update(addChild(root, id)),
    onDelete: (id) => update(removeNode(root, id)),
    onToggle: (id) => update(mapNode(root, id, (n) => ({ ...n, collapsed: !n.collapsed }))),
  };

  const { pos, nodes, edges, width, height, offX, offY } = useMemo(() => computeLayout(root), [root]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    const rp = pos[root.id];
    if (!el || !rp) return;
    el.scrollLeft = offX + rp.x - el.clientWidth / 2;
    el.scrollTop = offY + rp.y - el.clientHeight / 2;
    // Centre on the root only when a different map opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map.id]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-[color:var(--color-border)] bg-[color:var(--color-paper)]/70 px-4 py-2.5">
        <button
          type="button"
          onClick={onClose}
          title="Back to maps"
          className="grid h-8 w-8 place-items-center rounded-lg text-lg text-[color:var(--color-ink-soft)] hover:bg-[color:var(--color-paper-3)]/60 hover:text-[color:var(--color-ink)]"
        >
          ‹
        </button>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[color:var(--color-ink)]">{map.title}</p>
        <span className="text-[0.7rem] font-semibold text-[color:var(--color-sage-deep)]">Saved</span>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-auto"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(74,60,30,0.06) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        <div className="relative" style={{ width, height }}>
          <svg className="absolute left-0 top-0" width={width} height={height} aria-hidden>
            {edges.map((e) => {
              const a = pos[e.from];
              const b = pos[e.to];
              if (!a || !b) return null;
              return (
                <path
                  key={`${e.from}-${e.to}`}
                  d={curvePath(offX + a.x, offY + a.y, offX + b.x, offY + b.y)}
                  fill="none"
                  stroke="var(--color-border-strong)"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          {nodes.map((n) => {
            const p = pos[n.id];
            if (!p) return null;
            return (
              <Chip
                key={n.id}
                node={n}
                isRoot={n.id === root.id}
                left={offX + p.x}
                top={offY + p.y}
                {...handlers}
              />
            );
          })}
        </div>
      </div>

      <p className="shrink-0 border-t border-[color:var(--color-border)] px-4 py-2 text-[0.7rem] text-[color:var(--color-ink-soft)]">
        Click a node to rename · hover for ＋ add / ✕ delete · edits save automatically
      </p>
    </div>
  );
}

function Chip({
  node,
  isRoot,
  left,
  top,
  onRename,
  onAdd,
  onDelete,
  onToggle,
}: { node: MindNode; isRoot?: boolean; left: number; top: number } & NodeHandlers) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(node.label);
  const hasKids = node.children.length > 0;

  const commit = () => {
    onRename(node.id, val.trim() || node.label);
    setEditing(false);
  };

  return (
    <div className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left, top }}>
      <div
        className={`group inline-flex items-center gap-1.5 rounded-xl border-[1.5px] ${
          isRoot
            ? "border-[color:var(--color-saffron-deep)] bg-[color:var(--color-saffron)]/20 px-3.5 py-2 shadow-[0_2px_0_rgba(152,96,24,0.2)]"
            : "border-[color:var(--color-border-strong)] bg-[#FFFCF3] px-2.5 py-1.5 shadow-[0_1px_0_rgba(74,60,30,0.08)]"
        }`}
      >
        {hasKids && (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            title={node.collapsed ? "Expand" : "Collapse"}
            className="text-[0.7rem] text-[color:var(--color-ink-soft)]"
          >
            {node.collapsed ? "⊕" : "⊖"}
          </button>
        )}
        {editing ? (
          <input
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              else if (e.key === "Escape") {
                setVal(node.label);
                setEditing(false);
              }
            }}
            className="w-[140px] bg-transparent text-sm outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setVal(node.label);
              setEditing(true);
            }}
            className={`whitespace-nowrap text-left text-[color:var(--color-ink)] ${
              isRoot ? "text-[0.95rem] font-semibold" : "text-sm font-medium"
            }`}
          >
            {node.label}
          </button>
        )}
        <span className="ml-0.5 hidden items-center gap-1.5 group-hover:inline-flex">
          <button
            type="button"
            onClick={() => onAdd(node.id)}
            title="Add branch"
            className="text-[color:var(--color-sage-deep)]"
          >
            ＋
          </button>
          {!isRoot && (
            <button
              type="button"
              onClick={() => onDelete(node.id)}
              title="Delete"
              className="text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-destructive)]"
            >
              ✕
            </button>
          )}
        </span>
      </div>
    </div>
  );
}
