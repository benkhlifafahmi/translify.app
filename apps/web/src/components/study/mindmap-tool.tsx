"use client";

import { useState } from "react";
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
      setErr("Couldn't generate the breakdown. Check your connection and try again.");
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
    <div className="flex flex-col gap-5 p-5">
      <div>
        <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold leading-tight tracking-tight text-[color:var(--color-ink)]">
          Mind map
        </h3>
        <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
          Ask the AI to break a topic from this book into its key ideas, then
          shape the outline however helps you understand it.
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
                  <p className="text-[0.72rem] text-[color:var(--color-ink-soft)]">{countNodes(m.root)} ideas</p>
                </button>
                <button
                  type="button"
                  onClick={() => store.deleteMap(m.id)}
                  title="Delete"
                  className="text-[color:var(--color-ink-soft)] opacity-0 transition-opacity hover:text-[color:var(--color-destructive)] group-hover:opacity-100"
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
  const h: NodeHandlers = {
    onRename: (id, label) => update(mapNode(root, id, (n) => ({ ...n, label }))),
    onAdd: (id) => update(addChild(root, id)),
    onDelete: (id) => update(removeNode(root, id)),
    onToggle: (id) => update(mapNode(root, id, (n) => ({ ...n, collapsed: !n.collapsed }))),
  };

  const [editingTopic, setEditingTopic] = useState(false);
  const [tv, setTv] = useState(root.label);

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

      <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
        <div className="group mb-3 flex items-center gap-2">
          {editingTopic ? (
            <input
              autoFocus
              value={tv}
              onChange={(e) => setTv(e.target.value)}
              onBlur={() => {
                h.onRename(root.id, tv.trim() || root.label);
                setEditingTopic(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  h.onRename(root.id, tv.trim() || root.label);
                  setEditingTopic(false);
                } else if (e.key === "Escape") {
                  setTv(root.label);
                  setEditingTopic(false);
                }
              }}
              className="w-full bg-transparent font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setTv(root.label);
                setEditingTopic(true);
              }}
              className="text-left font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-[color:var(--color-ink)]"
            >
              {root.label}
            </button>
          )}
          <button
            type="button"
            onClick={() => h.onAdd(root.id)}
            title="Add idea"
            className="shrink-0 text-[color:var(--color-sage-deep)] opacity-0 transition-opacity group-hover:opacity-100"
          >
            ＋
          </button>
        </div>

        {root.children.length === 0 ? (
          <p className="rounded-xl border-[1.5px] border-dashed border-[color:var(--color-border)] px-3 py-2.5 text-xs text-[color:var(--color-ink-soft)]">
            Hover the topic above and tap ＋ to start adding ideas.
          </p>
        ) : (
          <ul className="flex flex-col">
            {root.children.map((c) => (
              <Row key={c.id} node={c} depth={0} {...h} />
            ))}
          </ul>
        )}
      </div>

      <p className="shrink-0 border-t border-[color:var(--color-border)] px-4 py-2 text-[0.7rem] text-[color:var(--color-ink-soft)]">
        Click any idea to rename · hover for ＋ / ✕ · edits save automatically
      </p>
    </div>
  );
}

function Row({ node, depth, onRename, onAdd, onDelete, onToggle }: { node: MindNode; depth: number } & NodeHandlers) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(node.label);
  const hasKids = node.children.length > 0;
  const open = hasKids && !node.collapsed;

  const commit = () => {
    onRename(node.id, val.trim() || node.label);
    setEditing(false);
  };

  return (
    <li>
      <div className="group flex items-center gap-1 rounded-lg px-1 py-1 transition-colors hover:bg-[color:var(--color-paper-3)]/40">
        {hasKids ? (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            title={node.collapsed ? "Expand" : "Collapse"}
            className="grid h-5 w-5 shrink-0 place-items-center text-[0.7rem] text-[color:var(--color-ink-soft)]"
          >
            {node.collapsed ? "▸" : "▾"}
          </button>
        ) : (
          <span className="grid h-5 w-5 shrink-0 place-items-center text-[color:var(--color-border-strong)]">·</span>
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
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setVal(node.label);
              setEditing(true);
            }}
            className={`min-w-0 flex-1 truncate text-left ${
              depth === 0
                ? "text-[0.95rem] font-medium text-[color:var(--color-ink)]"
                : "text-sm text-[color:var(--color-ink-soft)]"
            }`}
          >
            {node.label}
          </button>
        )}

        <span className="ml-1 hidden shrink-0 items-center gap-2 group-hover:inline-flex">
          <button type="button" onClick={() => onAdd(node.id)} title="Add" className="text-[color:var(--color-sage-deep)]">
            ＋
          </button>
          <button
            type="button"
            onClick={() => onDelete(node.id)}
            title="Delete"
            className="text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-destructive)]"
          >
            ✕
          </button>
        </span>
      </div>

      {open && (
        <ul className="ml-[0.65rem] flex flex-col border-l border-[color:var(--color-border)] pl-2">
          {node.children.map((c) => (
            <Row key={c.id} node={c} depth={depth + 1} onRename={onRename} onAdd={onAdd} onDelete={onDelete} onToggle={onToggle} />
          ))}
        </ul>
      )}
    </li>
  );
}
