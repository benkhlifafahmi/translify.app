"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import {
  createShare,
  getShare,
  inviteToShare,
  revokeShare,
  type ShareInfo,
} from "@/lib/shares";

export function ShareButton({ bookId }: { bookId: string }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  // Portal the modal to <body> so the header's backdrop-filter doesn't trap
  // its position:fixed. `mounted` guards against SSR (no document on server).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data: share } = useQuery<ShareInfo>({
    queryKey: ["share", bookId],
    queryFn: () => getShare(bookId),
    enabled: open, // only hit the API once the dialog is opened
  });

  const create = useMutation({
    mutationFn: () => createShare(bookId),
    onSuccess: (s) => qc.setQueryData(["share", bookId], s),
  });
  const revoke = useMutation({
    mutationFn: () => revokeShare(bookId),
    onSuccess: () =>
      qc.setQueryData<ShareInfo>(["share", bookId], { shared: false, slug: null, url: null }),
  });
  const invite = useMutation({
    mutationFn: (emails: string[]) => inviteToShare(bookId, emails),
    onSuccess: (s) => {
      // The invite auto-creates the share — reveal the link too.
      qc.setQueryData(["share", bookId], s);
      setEmailInput("");
    },
  });

  const sendInvite = () => {
    const emails = emailInput
      .split(/[\s,;]+/)
      .map((e) => e.trim())
      .filter(Boolean);
    if (emails.length === 0 || invite.isPending) return;
    invite.mutate(emails);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const copy = async () => {
    if (!share?.url) return;
    try {
      await navigator.clipboard.writeText(share.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the input is selectable as a fallback */
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={t("share.title")}
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-paper)] px-3 text-xs font-semibold text-[color:var(--color-ink-soft)] transition-all hover:-translate-y-[1px] hover:border-[color:var(--color-sage)] hover:text-[color:var(--color-sage-deep)] sm:h-9 sm:px-3.5"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
        </svg>
        <span className="hidden sm:inline">{t("share.button")}</span>
      </button>

      {open && mounted &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-[color:var(--color-ink)]/40 backdrop-blur-[2px]"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("share.title")}
            className="relative w-full max-w-md rounded-3xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)] p-6 shadow-[0_24px_48px_-16px_rgba(20,16,8,0.45)]"
          >
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
              {t("share.title")}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--color-ink-soft)]">
              {t("share.desc")}
            </p>

            {share?.shared && share.url ? (
              <>
                <div className="mt-5 flex items-center gap-2">
                  <input
                    readOnly
                    value={share.url}
                    onFocus={(e) => e.currentTarget.select()}
                    className="min-w-0 flex-1 truncate rounded-xl border-[1.5px] border-[color:var(--color-border)] bg-white/80 px-3 py-2 text-sm text-[color:var(--color-ink)]"
                  />
                  <Button variant="sage" size="sm" onClick={copy} className="shrink-0 rounded-full">
                    {copied ? t("share.copied") : t("share.copy")}
                  </Button>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[0.7rem] text-[color:var(--color-ink-soft)]">
                    {t("share.viewOnly")}
                  </span>
                  <button
                    type="button"
                    onClick={() => revoke.mutate()}
                    disabled={revoke.isPending}
                    className="text-xs font-semibold text-[color:var(--color-destructive)] hover:underline disabled:opacity-50"
                  >
                    {t("share.stop")}
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-5 flex flex-col items-start gap-3">
                <Button
                  variant="accent"
                  size="default"
                  onClick={() => create.mutate()}
                  disabled={create.isPending}
                >
                  {create.isPending ? t("share.creating") : t("share.create")}
                </Button>
                <span className="text-[0.7rem] text-[color:var(--color-ink-soft)]">
                  {t("share.viewOnly")}
                </span>
              </div>
            )}

            {/* Invite by email — auto-creates the share. */}
            <div className="mt-5 border-t border-[color:var(--color-border)] pt-4">
              <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-ink-soft)]">
                {t("share.inviteHeading")}
              </p>
              <div className="flex items-start gap-2">
                <input
                  type="text"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      sendInvite();
                    }
                  }}
                  placeholder={t("share.invitePlaceholder")}
                  disabled={invite.isPending}
                  className="min-w-0 flex-1 rounded-xl border-[1.5px] border-[color:var(--color-border)] bg-white/80 px-3 py-2 text-sm focus:border-[color:var(--color-sage)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-sage)]/25 disabled:opacity-50"
                />
                <Button
                  variant="sage"
                  size="sm"
                  onClick={sendInvite}
                  disabled={invite.isPending || !emailInput.trim()}
                  className="shrink-0 rounded-full"
                >
                  {invite.isPending ? t("share.inviting") : t("share.invite")}
                </Button>
              </div>
              {invite.isSuccess && (
                <p className="mt-2 text-xs font-semibold text-[color:var(--color-sage-deep)]">
                  {t("share.invited")}
                </p>
              )}
              {invite.isError && (
                <p className="mt-2 text-xs text-[color:var(--color-destructive)]">
                  {t("share.inviteError")}
                </p>
              )}
            </div>
          </div>
          </div>,
          document.body,
        )}
    </>
  );
}
