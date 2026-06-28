"use client";

import { useState } from "react";
import Link from "next/link";
import { TranslifyMark } from "@/components/translify-mark";
import { LumiHud } from "@/components/lumi/lumi-hud";
import { folderColorToken, type Folder } from "@/lib/folders";
import type { User } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

/** "all" = everything, "unsorted" = books with no folder, else a folder id. */
export type LibraryView = "all" | "unsorted" | (string & {});

interface Props {
  user?: User | null;
  folders: Folder[];
  counts: Record<string, number>;
  activeView: LibraryView;
  onSelectView: (v: LibraryView) => void;
  onNewFolder: () => void;
  onEditFolder: (f: Folder) => void;
  onDropBook: (bookId: string, folderId: string | null) => void;
  onLogout: () => void;
  upload: React.ReactNode;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

/**
 * The library's primary navigation rail. It absorbs everything that used to be
 * scattered across the page chrome (header links, the social bar, the folder
 * chips) into one calm, scannable column, so the content pane only ever shows
 * one collection at a time.
 *
 * Desktop: a sticky paper-toned aside. Mobile: an off-canvas drawer.
 */
export function LibrarySidebar(props: Props) {
  const { mobileOpen, onMobileClose } = props;
  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-e border-[color:var(--color-border)] bg-[color:var(--color-paper-2)]/55 lg:block">
        <SidebarBody {...props} />
      </aside>

      {/* Mobile drawer. Kept mounted; slid off-canvas when closed. */}
      <div className={`fixed inset-0 z-50 lg:hidden ${mobileOpen ? "" : "pointer-events-none"}`}>
        <div
          className={`absolute inset-0 bg-[color:var(--color-ink)]/35 transition-opacity duration-200 ${mobileOpen ? "opacity-100" : "opacity-0"}`}
          onClick={onMobileClose}
        />
        <aside
          className={`absolute inset-y-0 start-0 flex w-72 max-w-[82%] flex-col bg-[color:var(--color-paper-2)] shadow-[0_24px_60px_-20px_rgba(20,16,8,0.5)] transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
          aria-hidden={!mobileOpen}
        >
          <SidebarBody {...props} onAfterSelect={onMobileClose} />
        </aside>
      </div>
    </>
  );
}

function SidebarBody({
  user,
  folders,
  counts,
  activeView,
  onSelectView,
  onNewFolder,
  onEditFolder,
  onDropBook,
  onLogout,
  upload,
  onAfterSelect,
}: Props & { onAfterSelect?: () => void }) {
  const { t } = useI18n();
  const select = (v: LibraryView) => { onSelectView(v); onAfterSelect?.(); };

  const profileHref = user?.username
    ? `/u/${encodeURIComponent(user.username)}`
    : "/settings/profile";
  const profileLabel = user?.username ? t("socialnav.yourProfile") : t("socialnav.claimHandle");
  const isAnon = !!user?.is_anonymous;

  return (
    <div className="flex h-full flex-col">
      {/* Brand + primary create action */}
      <div className="flex flex-col gap-3 px-4 pb-2 pt-5">
        <TranslifyMark href="/library" size={32} wordmarkClassName="text-lg" />
        <div className="pt-1">{upload}</div>
      </div>

      {/* Scrollable nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 [scrollbar-width:thin]">
        <NavItem
          icon={<HomeIcon />}
          label={t("library.allBooks")}
          count={counts.all ?? 0}
          active={activeView === "all"}
          onClick={() => select("all")}
        />
        <NavItem
          icon={<InboxIcon />}
          label={t("library.unsorted")}
          count={counts.unsorted ?? 0}
          active={activeView === "unsorted"}
          onClick={() => select("unsorted")}
          onDropBook={(id) => onDropBook(id, null)}
        />

        <div className="mt-5 flex items-center justify-between pe-1">
          <SectionLabel className="mb-0">{t("library.nav.folders")}</SectionLabel>
          <button
            type="button"
            onClick={onNewFolder}
            aria-label={t("library.newFolder")}
            title={t("library.newFolder")}
            className="grid h-6 w-6 place-items-center rounded-full text-[color:var(--color-ink-soft)] transition-colors hover:bg-[color:var(--color-paper-3)] hover:text-[color:var(--color-saffron-deep)]"
          >
            <PlusIcon />
          </button>
        </div>
        <div className="mt-1 flex flex-col">
          {folders.length === 0 ? (
            <button
              type="button"
              onClick={onNewFolder}
              className="rounded-xl border border-dashed border-[color:var(--color-border-strong)] px-3 py-2.5 text-start text-[0.82rem] text-[color:var(--color-ink-soft)] transition-colors hover:border-[color:var(--color-saffron-deep)] hover:text-[color:var(--color-ink)]"
            >
              {t("library.addFolder")}
            </button>
          ) : (
            folders.map((f) => (
              <NavItem
                key={f.id}
                emoji={f.emoji}
                color={folderColorToken(f.color).ring}
                label={f.name}
                count={counts[f.id] ?? 0}
                active={activeView === f.id}
                onClick={() => select(f.id)}
                onEdit={() => onEditFolder(f)}
                onDropBook={(id) => onDropBook(id, f.id)}
              />
            ))
          )}
        </div>

        {!isAnon && (
          <>
            <SectionLabel className="mt-6">{t("library.nav.community")}</SectionLabel>
            <ExternalItem href={profileHref} icon={<UserIcon />} label={profileLabel} />
            <ExternalItem href="/feed" icon={<FeedIcon />} label={t("socialnav.feed")} />
            <ExternalItem href="/discover" icon={<CompassIcon />} label={t("socialnav.discover")} />
            <ExternalItem href="/search" icon={<SearchIcon />} label={t("socialnav.findPeople")} />
          </>
        )}
      </nav>

      {/* Footer: progress + account actions */}
      <div className="border-t border-[color:var(--color-border)] px-3 py-3">
        <div className="px-1 pb-2">
          <LumiHud />
        </div>
        <div className="flex flex-col">
          <ExternalItem href="/garden" icon={<span aria-hidden className="text-[0.95rem] leading-none">🌿</span>} label={t("bookCard.garden")} compact />
          <ExternalItem href="/account" icon={<GearIcon />} label={t("library.account")} compact />
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-start text-[0.84rem] text-[color:var(--color-ink-soft)] transition-colors hover:bg-[color:var(--color-paper-3)]/70 hover:text-[color:var(--color-ink)]"
          >
            <span className="grid w-5 shrink-0 place-items-center"><LogoutIcon /></span>
            {t("library.logOut")}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`mb-1.5 px-3 text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[color:var(--color-ink-soft)]/80 ${className}`}>
      {children}
    </p>
  );
}

function NavItem({
  label,
  count,
  active,
  onClick,
  icon,
  emoji,
  color,
  onEdit,
  onDropBook,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  emoji?: string;
  color?: string;
  onEdit?: () => void;
  onDropBook?: (bookId: string) => void;
}) {
  const { t } = useI18n();
  const [over, setOver] = useState(false);
  const droppable = !!onDropBook;
  const ringColor = color ?? "var(--color-saffron-deep)";
  return (
    <div className="group/nav relative">
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        onDragOver={droppable ? (e) => {
          if (!e.dataTransfer.types.includes("application/x-translify-book")) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (!over) setOver(true);
        } : undefined}
        onDragLeave={droppable ? () => setOver(false) : undefined}
        onDrop={droppable ? (e) => {
          e.preventDefault();
          setOver(false);
          const id = e.dataTransfer.getData("application/x-translify-book");
          if (id) onDropBook!(id);
        } : undefined}
        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-[0.88rem] transition-colors duration-150 ${
          active
            ? "bg-[color:var(--color-saffron)]/22 font-semibold text-[color:var(--color-ink)]"
            : "text-[color:var(--color-ink)] hover:bg-[color:var(--color-paper-3)]/70"
        }`}
        style={over ? { boxShadow: `inset 0 0 0 1.5px ${ringColor}`, background: `color-mix(in oklab, ${ringColor} 12%, transparent)` } : undefined}
      >
        <span className={`grid w-5 shrink-0 place-items-center text-[1.02rem] leading-none ${active && !emoji ? "text-[color:var(--color-saffron-deep)]" : ""}`}>
          {emoji ?? icon}
        </span>
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <span className={`shrink-0 text-[0.72rem] tabular-nums text-[color:var(--color-ink-soft)] ${onEdit ? "group-hover/nav:opacity-0" : ""}`}>
          {count}
        </span>
      </button>
      {onEdit && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          aria-label={t("library.editFolder")}
          title={t("library.editFolder")}
          className="absolute end-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-[color:var(--color-ink-soft)] opacity-0 transition-opacity hover:text-[color:var(--color-ink)] focus-visible:opacity-100 group-hover/nav:opacity-100"
        >
          <PencilIcon />
        </button>
      )}
    </div>
  );
}

function ExternalItem({
  href,
  icon,
  label,
  compact = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-lg px-3 text-start text-[color:var(--color-ink)] transition-colors duration-150 hover:bg-[color:var(--color-paper-3)]/70 ${
        compact ? "py-2 text-[0.84rem] text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]" : "py-2 text-[0.88rem]"
      }`}
    >
      <span className="grid w-5 shrink-0 place-items-center">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

/* ── Icons (hand-rolled, matching the project's stroke style) ─────────── */

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10.5 12 4l8 6.5" /><path d="M6 9.5V20h12V9.5" />
    </svg>
  );
}
function InboxIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 13h4l1.5 2.5h5L16 13h4" /><path d="M4 13 6 5h12l2 8v6H4Z" />
    </svg>
  );
}
function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.4 5.4l1.4 1.4M17.2 17.2l1.4 1.4M5.4 18.6l1.4-1.4M17.2 6.8l1.4-1.4" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9" /><path d="m16 8 4 4-4 4" /><path d="M20 12H9" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function FeedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11a9 9 0 0 1 9 9" /><path d="M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1" />
    </svg>
  );
}
function CompassIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M14.5 9.5 12 14l-4.5 2.5L10 12l4.5-2.5Z" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
    </svg>
  );
}
