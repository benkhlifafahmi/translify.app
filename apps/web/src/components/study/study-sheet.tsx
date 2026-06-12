"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

/**
 * Desktop pull-up sheet for the roomy study tools (flashcards, mind map). It
 * rises over the reader, which dims behind it, and the grab handle resizes it.
 * Fixed-positioned so it escapes the narrow study column.
 */
export function StudySheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const [shown, setShown] = useState(false);
  const [heightVh, setHeightVh] = useState(82);
  const dragging = useRef(false);

  useEffect(() => {
    // Next frame so the entrance transition actually plays.
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    const fromBottom = window.innerHeight - e.clientY;
    const pct = (fromBottom / window.innerHeight) * 100;
    setHeightVh(Math.min(94, Math.max(42, pct)));
  }
  function endDrag() {
    dragging.current = false;
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label={t("study.sheet.close")}
        onClick={onClose}
        className={`absolute inset-0 bg-[color:var(--color-ink)]/35 transition-opacity duration-300 ${
          shown ? "opacity-100" : "opacity-0"
        }`}
      />
      <section
        role="dialog"
        aria-label={title}
        style={{ height: `${heightVh}vh` }}
        className={`absolute inset-x-0 bottom-0 flex flex-col rounded-t-[1.4rem] border-t border-[color:var(--color-border)] bg-[color:var(--color-paper)] shadow-[0_-22px_44px_-18px_rgba(20,16,8,0.4)] transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          shown ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="flex cursor-row-resize touch-none flex-col items-center pb-1 pt-2.5"
          title={t("study.sheet.resize")}
        >
          <span className="h-1.5 w-10 rounded-full bg-[color:var(--color-border-strong)]" />
        </div>
        <header className="flex shrink-0 items-center justify-between border-b border-[color:var(--color-border)] px-5 py-2.5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-[color:var(--color-ink)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm font-semibold text-[color:var(--color-ink-soft)] transition-colors hover:bg-[color:var(--color-paper-2)] hover:text-[color:var(--color-ink)]"
          >
            {t("study.common.done")}
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      </section>
    </div>
  );
}
