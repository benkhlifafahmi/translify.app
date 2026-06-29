"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LibrarySidebar,
  type ActiveFolder,
  type ActiveNav,
} from "@/components/library/library-sidebar";
import { UploadButton } from "@/components/upload-button";
import { YouTubeImportButton } from "@/components/youtube-import-button";
import { FolderEditor } from "@/components/folder-editor";
import { MarketingHeader } from "@/components/marketing-header";
import { MilestoneToast } from "@/components/milestone-toast";
import { me, logout, type User } from "@/lib/auth";
import { listBooks, moveBookToFolder, type Book } from "@/lib/books";
import { listFolders, type Folder } from "@/lib/folders";
import { getToken } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

/**
 * The authenticated app frame. Every in-app surface (library shelf, feed,
 * discover, search, profile) renders its content inside this so the navigation
 * rail is always present, instead of bouncing the user to a bare page.
 *
 * When the viewer isn't authenticated (public profiles, /discover logged out)
 * it falls back to the marketing header chrome, preserving the old public look.
 *
 * The shell owns everything cross-cutting: the folder data + counts the rail
 * shows, the drag-to-file mutation, the folder editor modal, and the mobile
 * drawer. Pages only provide a title, optional toolbar, and their content.
 */
export function AppShell(props: {
  title?: React.ReactNode;
  /** Right-aligned topbar controls (e.g. library search + sort). */
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}) {
  // useSearchParams (inside AppShellImpl) must sit under a Suspense boundary so
  // server-component pages (e.g. /u/[username]) that render the shell still
  // build. The fallback renders the content in a neutral frame, matching the
  // pre-mount branch so there's no visible jump.
  return (
    <Suspense fallback={<div className="min-h-screen bg-[color:var(--color-paper)]">{props.children}</div>}>
      <AppShellImpl {...props} />
    </Suspense>
  );
}

function AppShellImpl({
  title,
  toolbar,
  children,
}: {
  title?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const authed = mounted && !!getToken();

  const [mobileNav, setMobileNav] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);

  const { data: user } = useQuery<User>({ queryKey: ["me"], queryFn: me, enabled: authed });
  const { data: books } = useQuery<Book[]>({ queryKey: ["books"], queryFn: listBooks, enabled: authed });
  const { data: folders } = useQuery<Folder[]>({ queryKey: ["folders"], queryFn: listFolders, enabled: authed });

  const orderedFolders = useMemo(
    () => (folders ?? []).slice().sort((a, b) => a.position - b.position || a.name.localeCompare(b.name)),
    [folders],
  );

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: 0, unsorted: 0 };
    for (const b of books ?? []) {
      m.all += 1;
      const k = b.folder_id ?? "unsorted";
      m[k] = (m[k] ?? 0) + 1;
    }
    return m;
  }, [books]);

  const moveBook = useMutation({
    mutationFn: ({ bookId, folderId }: { bookId: string; folderId: string | null }) =>
      moveBookToFolder(bookId, folderId),
    onMutate: async ({ bookId, folderId }) => {
      await queryClient.cancelQueries({ queryKey: ["books"] });
      const prev = queryClient.getQueryData<Book[]>(["books"]);
      queryClient.setQueryData<Book[]>(["books"], (old) =>
        old?.map((b) => b.id === bookId ? { ...b, folder_id: folderId } : b),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["books"], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  const onLogout = async () => {
    await logout();
    router.replace("/login");
  };

  // Active nav derivation from the URL.
  const { activeFolder, activeNav } = useMemo<{ activeFolder: ActiveFolder; activeNav: ActiveNav }>(() => {
    if (pathname === "/library") {
      const f = searchParams.get("folder");
      return { activeFolder: f === "unsorted" ? "unsorted" : f ? f : "all", activeNav: null };
    }
    if (pathname.startsWith("/feed")) return { activeFolder: null, activeNav: "feed" };
    if (pathname.startsWith("/discover")) return { activeFolder: null, activeNav: "discover" };
    if (pathname.startsWith("/search")) return { activeFolder: null, activeNav: "search" };
    if (pathname.startsWith("/u/") || pathname.startsWith("/settings/profile")) {
      return { activeFolder: null, activeNav: "profile" };
    }
    return { activeFolder: null, activeNav: null };
  }, [pathname, searchParams]);

  // Pre-hydration: render content in a neutral frame so server-rendered pages
  // (public profiles, /discover) never blank out and SSR content is preserved.
  // Auth can only be known client-side (token lives in localStorage), so we
  // settle the real chrome after mount. Server + first client render match,
  // so there's no hydration mismatch.
  if (!mounted) {
    return <div className="min-h-screen bg-[color:var(--color-paper)]">{children}</div>;
  }
  // Logged out: keep the public marketing chrome so anonymous visitors of
  // public pages never see the app rail.
  if (!authed) {
    return (
      <div className="min-h-screen bg-[color:var(--color-paper)]">
        <MarketingHeader />
        {children}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[color:var(--color-paper)]">
      <MilestoneToast />

      <div className="flex">
        <LibrarySidebar
          user={user}
          folders={orderedFolders}
          counts={counts}
          activeFolder={activeFolder}
          activeNav={activeNav}
          onNewFolder={() => { setEditingFolder(null); setEditorOpen(true); }}
          onEditFolder={(f) => { setEditingFolder(f); setEditorOpen(true); }}
          onDropBook={(bookId, folderId) => moveBook.mutate({ bookId, folderId })}
          onLogout={onLogout}
          upload={
            <div className="flex flex-col gap-2">
              <UploadButton />
              <YouTubeImportButton />
            </div>
          }
          mobileOpen={mobileNav}
          onMobileClose={() => setMobileNav(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[color:var(--color-border)] bg-[color:var(--color-paper)]/85 backdrop-blur-md">
            <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
              <button
                type="button"
                onClick={() => setMobileNav(true)}
                aria-label={t("library.openNav")}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[color:var(--color-border)] text-[color:var(--color-ink)] transition-colors hover:bg-[color:var(--color-paper-2)] lg:hidden"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M3 6h18M3 12h18M3 18h18" />
                </svg>
              </button>

              {title != null && (
                <div className="flex min-w-0 items-baseline gap-2.5">
                  <h1 className="truncate font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-[color:var(--color-ink)] sm:text-[1.6rem]">
                    {title}
                  </h1>
                </div>
              )}

              {toolbar && <div className="ms-auto flex items-center gap-2">{toolbar}</div>}
            </div>
          </header>

          <main className="relative flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>

      <FolderEditor folder={editingFolder} open={editorOpen} onClose={() => setEditorOpen(false)} />
    </div>
  );
}
