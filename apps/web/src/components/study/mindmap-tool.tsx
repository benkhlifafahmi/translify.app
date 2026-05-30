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
    <div className="flex flex-col gap-4 p-5">
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-ink-soft)]">
          Study mode
        </p>
        <h3 className="mt-1.5 font-[family-name:var(--font-display)] text-xl font-semibold leading-tight tracking-tight">
          Mind map
        </h3>
        <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
          Ask the AI to map out any topic from this book, then reshape it to match
          how you think.
        </p>
      </div>

      <div className="card-paper flex flex-col gap-2 p-4">
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
          {store.maps.map((m) => (
            <div key={m.id} className="card-paper flex items-center gap-2 p-3">
              <button
                type="button"
                onClick={() => setActive(m)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate text-sm font-semibold text-[color:var(--color-ink)]">
                  {m.title}
                </p>
                <p className="text-[0.72rem] text-[color:var(--color-ink-soft)]">
                  {countNodes(m.root)} nodes
                </p>
              </button>
              <button
                type="button"
                onClick={() => store.deleteMap(m.id)}
                title="Delete"
                className="text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-destructive)]"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
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

  const rename = (id: string, label: string) => update(mapNode(root, id, (n) => ({ ...n, label })));
  const add = (id: string) => update(addChild(root, id));
  const del = (id: string) => update(removeNode(root, id));
  const toggle = (id: string) =>
    update(mapNode(root, id, (n) => ({ ...n, collapsed: !n.collapsed })));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-[color:var(--color-border)] bg-[color:var(--color-paper)]/60 px-4 py-2.5">
        <button
          type="button"
          onClick={onClose}
          title="Back to maps"
          className="grid h-8 w-8 place-items-center rounded-lg text-lg text-[color:var(--color-ink-soft)] hover:bg-[color:var(--color-paper-3)]/60 hover:text-[color:var(--color-ink)]"
        >
          ‹
        </button>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[color:var(--color-ink)]">
          {map.title}
        </p>
        <span className="text-[0.7rem] font-semibold text-[color:var(--color-sage-deep)]">Saved</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <Branch
          node={root}
          isRoot
          onRename={rename}
          onAdd={add}
          onDelete={del}
          onToggle={toggle}
        />
      </div>
      <p className="shrink-0 border-t border-[color:var(--color-border)] px-4 py-2 text-[0.7rem] text-[color:var(--color-ink-soft)]">
        Click a node to rename · hover for ＋ add / ✕ delete · edits save automatically
      </p>
    </div>
  );
}

function Branch({
  node,
  isRoot,
  onRename,
  onAdd,
  onDelete,
  onToggle,
}: {
  node: MindNode;
  isRoot?: boolean;
  onRename: (id: string, label: string) => void;
  onAdd: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(node.label);
  const hasKids = node.children.length > 0;

  return (
    <div className="flex items-start gap-2">
      <div
        className={`group inline-flex shrink-0 items-center gap-1.5 rounded-xl border-[1.5px] px-2.5 py-1.5 ${
          isRoot
            ? "border-[color:var(--color-saffron-deep)] bg-[color:var(--color-saffron)]/12"
            : "border-[color:var(--color-border-strong)] bg-white"
        }`}
      >
        {hasKids && (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            className="text-[0.7rem] text-[color:var(--color-ink-soft)]"
            title={node.collapsed ? "Expand" : "Collapse"}
          >
            {node.collapsed ? "▸" : "▾"}
          </button>
        )}
        {editing ? (
          <input
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={() => {
              onRename(node.id, val.trim() || node.label);
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onRename(node.id, val.trim() || node.label);
                setEditing(false);
              } else if (e.key === "Escape") {
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
            className="text-left text-sm font-medium text-[color:var(--color-ink)]"
          >
            {node.label}
          </button>
        )}
        <span className="ml-1 hidden items-center gap-1.5 group-hover:inline-flex">
          <button
            type="button"
            onClick={() => onAdd(node.id)}
            title="Add child"
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

      {hasKids && !node.collapsed && (
        <div className="flex flex-col gap-2 border-l-2 border-[color:var(--color-border)] pl-3">
          {node.children.map((c) => (
            <Branch
              key={c.id}
              node={c}
              onRename={onRename}
              onAdd={onAdd}
              onDelete={onDelete}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
