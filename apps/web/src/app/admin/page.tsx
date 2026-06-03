"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";
import { me } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  formatBytes,
  formatDate,
  getAdminUser,
  listAdminUsers,
  sendAdminEmail,
  type AdminUserDetail,
  type AdminUserList,
  type AdminUserSummary,
} from "@/lib/admin";

type Gate = "loading" | "denied" | "ok";

export default function AdminPage() {
  const router = useRouter();
  const [gate, setGate] = useState<Gate>("loading");

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    me()
      .then((u) => setGate(u.is_superuser ? "ok" : "denied"))
      .catch(() => setGate("denied"));
  }, [router]);

  if (gate === "loading") {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[color:var(--color-paper)]">
        <p className="text-sm text-[color:var(--color-ink-soft)]">Checking access…</p>
      </main>
    );
  }

  if (gate === "denied") {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[color:var(--color-paper)] px-6">
        <div className="card-paper max-w-md p-8 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
            Not authorized
          </h1>
          <p className="mt-2 text-sm text-[color:var(--color-ink-soft)]">
            This area is for Translify staff. If you think you should have access, ask an admin to
            enable it on your account.
          </p>
          <Link href="/library" className="mt-5 inline-block">
            <Button variant="outline" size="sm">
              Back to library
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return <AdminConsole />;
}

// ───────────────────────── Console ─────────────────────────

function AdminConsole() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [offset, setOffset] = useState(0);
  const LIMIT = 50;

  const [list, setList] = useState<AdminUserList | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Debounce the search box.
  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebounced(query.trim());
      setOffset(0);
    }, 300);
    return () => window.clearTimeout(id);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setListLoading(true);
    setListError(null);
    listAdminUsers({ query: debounced || undefined, limit: LIMIT, offset })
      .then((data) => {
        if (!cancelled) setList(data);
      })
      .catch((e) => {
        if (!cancelled) setListError(e?.message ?? "Failed to load users");
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, offset]);

  const total = list?.total ?? 0;
  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + LIMIT, total);

  return (
    <main className="flex h-[100dvh] flex-col bg-[color:var(--color-paper)]">
      <header className="flex shrink-0 items-center gap-3 border-b border-[color:var(--color-border)] bg-[color:var(--color-paper)]/80 px-5 py-3 backdrop-blur">
        <Link
          href="/library"
          className="grid h-8 w-8 place-items-center rounded-full border-[1.5px] border-[color:var(--color-border-strong)] text-[color:var(--color-ink-soft)] transition-colors hover:bg-[color:var(--color-paper-2)] hover:text-[color:var(--color-ink)]"
          aria-label="Back to library"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
            Admin
          </h1>
          <p className="text-[0.7rem] text-[color:var(--color-ink-soft)]">Customers, stats &amp; email</p>
        </div>
        <span className="ml-auto rounded-full bg-[color:var(--color-plum)]/12 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-plum)]">
          Staff
        </span>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[22rem_1fr]">
        {/* Customer list */}
        <aside className="flex min-h-0 flex-col border-r border-[color:var(--color-border)] bg-[color:var(--color-paper-2)]/40">
          <div className="shrink-0 border-b border-[color:var(--color-border)] p-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search email, name, or @handle"
              className="w-full rounded-xl border-[1.5px] border-[color:var(--color-border)] bg-white/70 px-3 py-2 text-sm focus:border-[color:var(--color-saffron)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-saffron)]/30"
            />
            <div className="mt-2 flex items-center justify-between px-1 text-[0.7rem] text-[color:var(--color-ink-soft)]">
              <span className="tabular-nums">
                {total > 0 ? `${pageStart}–${pageEnd} of ${total}` : listLoading ? "Loading…" : "No customers"}
              </span>
              <span className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setOffset((o) => Math.max(0, o - LIMIT))}
                  disabled={offset === 0}
                  className="rounded-md px-2 py-0.5 font-semibold disabled:opacity-40 enabled:hover:bg-[color:var(--color-paper-3)]/60"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setOffset((o) => o + LIMIT)}
                  disabled={pageEnd >= total}
                  className="rounded-md px-2 py-0.5 font-semibold disabled:opacity-40 enabled:hover:bg-[color:var(--color-paper-3)]/60"
                >
                  Next
                </button>
              </span>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {listError && (
              <p className="m-3 rounded-lg bg-[color:var(--color-destructive)]/10 px-3 py-2 text-xs text-[color:var(--color-destructive)]">
                {listError}
              </p>
            )}
            {!listError &&
              list?.users.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  active={u.id === selectedId}
                  onClick={() => setSelectedId(u.id)}
                />
              ))}
            {!listError && !listLoading && list?.users.length === 0 && (
              <p className="p-6 text-center text-sm text-[color:var(--color-ink-soft)]">
                No customers match that search.
              </p>
            )}
          </div>
        </aside>

        {/* Detail */}
        <section className="min-h-0 overflow-y-auto">
          {selectedId ? (
            <UserDetail userId={selectedId} />
          ) : (
            <div className="grid h-full place-items-center p-10 text-center">
              <p className="max-w-xs text-sm text-[color:var(--color-ink-soft)]">
                Pick a customer on the left to see their plan, usage, files, and to send them an
                email.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function UserRow({
  user,
  active,
  onClick,
}: {
  user: AdminUserSummary;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 border-b border-[color:var(--color-border)]/60 px-3 py-2.5 text-left transition-colors ${
        active ? "bg-[color:var(--color-saffron)]/10" : "hover:bg-[color:var(--color-paper-3)]/40"
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[color:var(--color-ink)]">
          {user.display_name || user.email}
        </span>
        <span className="block truncate text-[0.72rem] text-[color:var(--color-ink-soft)]">
          {user.display_name ? user.email : user.username ? `@${user.username}` : "—"}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <PlanBadge plan={user.plan} status={user.status} />
        <span className="text-[0.66rem] tabular-nums text-[color:var(--color-ink-soft)]">
          {user.book_count} {user.book_count === 1 ? "book" : "books"}
        </span>
      </span>
    </button>
  );
}

// ───────────────────────── Detail view ─────────────────────────

function UserDetail({ userId }: { userId: string }) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);
    getAdminUser(userId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? "Failed to load customer");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return <p className="p-8 text-sm text-[color:var(--color-ink-soft)]">Loading customer…</p>;
  }
  if (error || !detail) {
    return (
      <p className="m-8 rounded-lg bg-[color:var(--color-destructive)]/10 px-4 py-3 text-sm text-[color:var(--color-destructive)]">
        {error ?? "Customer not found"}
      </p>
    );
  }

  const s = detail.stats;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 lg:p-8">
      {/* Identity */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
            {detail.display_name || detail.email}
          </h2>
          <p className="mt-0.5 text-sm text-[color:var(--color-ink-soft)]">
            {detail.email}
            {detail.username && <> · @{detail.username}</>}
          </p>
          <p className="mt-1 text-[0.72rem] text-[color:var(--color-ink-soft)]">
            Joined {formatDate(detail.created_at)} · {detail.preferred_language.toUpperCase()}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <PlanBadge plan={detail.subscription.plan} status={detail.subscription.status} />
          {detail.is_superuser && <Tag tone="plum">Staff</Tag>}
          {detail.is_anonymous && <Tag tone="ink">Anonymous</Tag>}
          {!detail.is_verified && !detail.is_anonymous && <Tag tone="coral">Unverified</Tag>}
          {detail.family_safe_mode && <Tag tone="sage">Family-safe</Tag>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Books" value={s.book_count} />
        <Stat label="Pages" value={s.pages_total.toLocaleString()} />
        <Stat label="Storage" value={formatBytes(s.storage_bytes)} />
        <Stat label="Translations" value={s.translation_count} />
        <Stat label="Highlights" value={s.highlight_count} />
        <Stat label="Quizzes" value={s.quiz_count} />
        <Stat label="Chats" value={s.chat_count} />
        <Stat
          label="This period"
          value={`${detail.usage.pages_uploaded}p`}
          sub={`${detail.usage.quizzes_generated} quizzes`}
        />
      </div>

      {/* Subscription */}
      <Section title="Subscription">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-3">
          <Field label="Plan" value={detail.subscription.plan} />
          <Field label="Cycle" value={detail.subscription.cycle ?? "—"} />
          <Field label="Status" value={detail.subscription.status} />
          <Field label="Renews" value={formatDate(detail.subscription.current_period_end)} />
          <Field label="Trial ends" value={formatDate(detail.subscription.trial_end)} />
          <Field
            label="Cancels at period end"
            value={detail.subscription.cancel_at_period_end ? "Yes" : "No"}
          />
          {detail.subscription.stripe_customer_id && (
            <Field
              label="Stripe customer"
              value={detail.subscription.stripe_customer_id}
              mono
            />
          )}
        </dl>
      </Section>

      {/* Files */}
      <Section title={`Files (${detail.books.length})`}>
        {detail.books.length === 0 ? (
          <p className="text-sm text-[color:var(--color-ink-soft)]">No uploads yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[color:var(--color-border)] text-[0.68rem] uppercase tracking-[0.1em] text-[color:var(--color-ink-soft)]">
                  <th className="py-2 pr-3 font-semibold">Title</th>
                  <th className="py-2 pr-3 font-semibold">Format</th>
                  <th className="py-2 pr-3 font-semibold">Status</th>
                  <th className="py-2 pr-3 text-right font-semibold">Pages</th>
                  <th className="py-2 pr-3 text-right font-semibold">Size</th>
                  <th className="py-2 text-right font-semibold">Added</th>
                </tr>
              </thead>
              <tbody>
                {detail.books.map((b) => (
                  <tr key={b.id} className="border-b border-[color:var(--color-border)]/50">
                    <td className="max-w-[16rem] truncate py-2 pr-3 font-medium text-[color:var(--color-ink)]">
                      {b.title}
                    </td>
                    <td className="py-2 pr-3 uppercase text-[color:var(--color-ink-soft)]">
                      {b.format}
                    </td>
                    <td className="py-2 pr-3">
                      <StatusDot status={b.status} />
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-[color:var(--color-ink-soft)]">
                      {b.page_count ?? "—"}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-[color:var(--color-ink-soft)]">
                      {formatBytes(b.file_size_bytes)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-[color:var(--color-ink-soft)]">
                      {formatDate(b.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Email composer */}
      <Section title="Send an email">
        <EmailComposer userId={detail.id} to={detail.email} />
      </Section>
    </div>
  );
}

function EmailComposer({ userId, to }: { userId: string; to: string }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Reset when switching customer.
  useEffect(() => {
    setSubject("");
    setBody("");
    setResult(null);
  }, [userId]);

  const send = useCallback(async () => {
    setSending(true);
    setResult(null);
    try {
      const res = await sendAdminEmail(userId, { subject: subject.trim(), body });
      setResult(
        res.sent
          ? { ok: true, msg: `Sent to ${res.to}.` }
          : { ok: false, msg: res.detail ?? "Not delivered." },
      );
      if (res.sent) {
        setSubject("");
        setBody("");
      }
    } catch (e) {
      setResult({ ok: false, msg: (e as Error)?.message ?? "Send failed." });
    } finally {
      setSending(false);
    }
  }, [userId, subject, body]);

  const disabled = sending || !subject.trim() || !body.trim();

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[0.72rem] text-[color:var(--color-ink-soft)]">
        Goes to <span className="font-semibold text-[color:var(--color-ink)]">{to}</span> from the
        Translify address, wrapped in the branded template.
      </p>
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject"
        maxLength={200}
        className="w-full rounded-xl border-[1.5px] border-[color:var(--color-border)] bg-white/70 px-3 py-2 text-sm focus:border-[color:var(--color-saffron)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-saffron)]/30"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your message. Blank lines start new paragraphs."
        rows={6}
        maxLength={10000}
        className="w-full resize-y rounded-xl border-[1.5px] border-[color:var(--color-border)] bg-white/70 px-3 py-2 text-sm leading-relaxed focus:border-[color:var(--color-saffron)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-saffron)]/30"
      />
      <div className="flex items-center gap-3">
        <Button variant="accent" size="sm" onClick={send} disabled={disabled}>
          {sending ? "Sending…" : "Send email"}
        </Button>
        {result && (
          <span
            className={`text-[0.78rem] font-medium ${
              result.ok
                ? "text-[color:var(--color-sage-deep)]"
                : "text-[color:var(--color-destructive)]"
            }`}
          >
            {result.msg}
          </span>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Small pieces ─────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-paper p-5">
      <h3 className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-ink-soft)]">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border-[1.5px] border-[color:var(--color-border)] bg-white/55 p-3">
      <p className="text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-[color:var(--color-ink-soft)]">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold tabular-nums tracking-tight text-[color:var(--color-ink)]">
        {value}
      </p>
      {sub && <p className="text-[0.66rem] text-[color:var(--color-ink-soft)]">{sub}</p>}
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-[color:var(--color-ink-soft)]">
        {label}
      </dt>
      <dd
        className={`mt-0.5 truncate text-[color:var(--color-ink)] ${
          mono ? "font-[family-name:var(--font-mono)] text-xs" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

const TAG_TONE: Record<string, string> = {
  sage: "bg-[color:var(--color-sage)]/15 text-[color:var(--color-sage-deep)]",
  saffron: "bg-[color:var(--color-saffron)]/15 text-[color:var(--color-saffron-deep)]",
  coral: "bg-[color:var(--color-coral)]/15 text-[color:var(--color-coral-deep)]",
  plum: "bg-[color:var(--color-plum)]/12 text-[color:var(--color-plum)]",
  ink: "bg-[color:var(--color-ink)]/8 text-[color:var(--color-ink-soft)]",
};

function Tag({ tone, children }: { tone: keyof typeof TAG_TONE | string; children: React.ReactNode }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[0.64rem] font-semibold uppercase tracking-[0.08em] ${
        TAG_TONE[tone] ?? TAG_TONE.ink
      }`}
    >
      {children}
    </span>
  );
}

function PlanBadge({ plan, status }: { plan: string; status: string }) {
  const tone =
    status === "active" || status === "trialing"
      ? "sage"
      : status === "past_due" || status === "unpaid"
        ? "coral"
        : plan !== "free"
          ? "saffron"
          : "ink";
  const label = plan === "free" ? status : `${plan} · ${status}`;
  return <Tag tone={tone}>{label}</Tag>;
}

function StatusDot({ status }: { status: string }) {
  const tone =
    status === "ready"
      ? "var(--color-sage)"
      : status === "failed"
        ? "var(--color-coral)"
        : "var(--color-saffron)";
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.78rem] capitalize text-[color:var(--color-ink-soft)]">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} />
      {status}
    </span>
  );
}
