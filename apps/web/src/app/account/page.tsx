"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { TranslifyMark } from "@/components/translify-mark";
import { TrialBanner } from "@/components/trial-banner";
import { ApiError } from "@/lib/api";
import { logout, me, updateProfile, type User } from "@/lib/auth";
import {
  activateProfile,
  createProfile,
  deleteProfile as deleteProfileRequest,
  listProfiles,
  type Profile,
  type ProfileKind,
} from "@/lib/profiles";
import {
  getSubscription,
  isUnlimited,
  planName,
  startCheckout,
  startPortal,
  type Cycle,
  type Plan,
  type Subscription,
} from "@/lib/billing";
import { LOCALES, useI18n } from "@/lib/i18n";
import { Lumi } from "@/components/lumi/lumi";
import { useLumi } from "@/components/lumi/lumi-context";
import {
  ACHIEVEMENTS,
  LEVEL_TITLES,
  LEVELS,
  xpToNextLevel,
} from "@/lib/lumi-progress";

type Tab = "profile" | "profiles" | "subscription" | "lumi" | "security" | "danger";

const PLAN_PRICES: Record<Exclude<Plan, "free">, { monthly: number; yearly: number }> = {
  reader:  { monthly: 9.99,  yearly: 7.99  },
  scholar: { monthly: 18.99, yearly: 14.99 },
  family:  { monthly: 27.99, yearly: 22    },
};

function AccountLoadingText() {
  const { t } = useI18n();
  return <>{t("account.loading")}</>;
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <main className="relative min-h-screen overflow-hidden">
          <ParchmentBackdrop />
          <div className="grid h-screen place-items-center">
            <span className="font-[family-name:var(--font-display)] italic text-[color:var(--color-ink-soft)]">
              <AccountLoadingText />
            </span>
          </div>
        </main>
      }
    >
      <AccountInner />
    </Suspense>
  );
}

function AccountInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { t, locale } = useI18n();

  const [user, setUser] = useState<User | null>(null);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("profile");
  const [flash, setFlash] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(
    null,
  );

  // Initial fetch.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [u, s] = await Promise.all([me(), getSubscription()]);
        if (!cancelled) {
          setUser(u);
          setSub(s);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
          return;
        }
        if (!cancelled) {
          setFlash({ tone: "error", text: t("account.errLoad") });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Surface checkout-return state from query params.
  useEffect(() => {
    const checkout = params.get("checkout");
    const upgrade = params.get("upgrade");
    if (checkout === "success") {
      setFlash({
        tone: "success",
        text: "Welcome aboard. Your plan is being activated — this page will refresh shortly.",
      });
      const id = setTimeout(() => {
        getSubscription().then(setSub).catch(() => {});
      }, 2500);
      setTab("subscription");
      return () => clearTimeout(id);
    }
    if (checkout === "cancelled") {
      setFlash({ tone: "info", text: "Checkout cancelled. No charges made." });
      setTab("subscription");
    }
    if (upgrade) {
      setFlash({ tone: "info", text: upgradeFlash(upgrade) });
      setTab("subscription");
    }
  }, [params]);

  if (loading || !user || !sub) {
    return (
      <main className="relative min-h-screen overflow-hidden">
        <ParchmentBackdrop />
        <div className="grid h-screen place-items-center">
          <div className="flex items-center gap-3 text-[color:var(--color-ink-soft)]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[color:var(--color-saffron)]" />
            <span className="font-[family-name:var(--font-display)] italic">Opening your shelf…</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <ParchmentBackdrop />

      <TrialBanner />
      <TopBar onLogout={() => logout().then(() => router.push("/"))} />

      <div className="relative z-10 mx-auto grid max-w-6xl gap-10 px-6 pb-24 pt-10 lg:grid-cols-[260px_1fr] lg:gap-14 lg:px-10">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <SideNav tab={tab} setTab={setTab} sub={sub} />
        </aside>

        <section className="min-w-0">
          {flash && <FlashBanner flash={flash} onDismiss={() => setFlash(null)} />}

          {tab === "profile" && (
            <ProfileSection user={user} setUser={setUser} setFlash={setFlash} />
          )}
          {tab === "profiles" && (
            <ProfilesSection user={user} setUser={setUser} sub={sub} setFlash={setFlash} />
          )}
          {tab === "subscription" && (
            <SubscriptionSection sub={sub} setSub={setSub} setFlash={setFlash} />
          )}
          {tab === "lumi" && <LumiSection />}
          {tab === "security" && <SecuritySection setFlash={setFlash} />}
          {tab === "danger" && <DangerSection user={user} />}
        </section>
      </div>

      <Stamp tone={statusTone(sub)} />

      {/* Locale persistence side-effect */}
      <input type="hidden" data-locale={locale} aria-hidden="true" />
      <span aria-hidden className="hidden">{t("nav.cta")}</span>
    </main>
  );
}

/* ─────────────────────── Top bar ─────────────────────── */

function TopBar({ onLogout }: { onLogout: () => void }) {
  const { t } = useI18n();
  return (
    <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 pt-6 lg:px-10 lg:pt-8">
      <TranslifyMark href="/library" size={36} wordmarkClassName="text-xl" />

      <div className="flex items-center gap-2">
        <LanguageSwitcher compact />
        <Link
          href="/library"
          className="hidden rounded-full px-4 py-2 text-sm font-semibold text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)] sm:inline"
        >
          {t("book.backToLibrary")}
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-paper)] px-4 py-2 text-sm font-semibold text-[color:var(--color-ink)] transition-all hover:-translate-y-[1px] hover:border-[color:var(--color-border-strong)]"
        >
          {t("account.logOut")}
        </button>
      </div>
    </header>
  );
}

/* ─────────────────────── Side nav ─────────────────────── */

function SideNav({ tab, setTab, sub }: { tab: Tab; setTab: (t: Tab) => void; sub: Subscription }) {
  const items: { id: Tab; label: string; sub: string; icon: string }[] = [
    { id: "profile",      label: "Reader card",    sub: "Name · email · language",       icon: "✦" },
    { id: "profiles",     label: "Family readers", sub: "Switch between profiles",       icon: "❋" },
    { id: "subscription", label: "Subscription",   sub: "Plan · billing · usage",        icon: "❀" },
    { id: "lumi",         label: "Lumi & progress", sub: "Level · XP · achievements",     icon: "🦉" },
    { id: "security",     label: "Security",       sub: "Password · sessions",           icon: "◇" },
    { id: "danger",       label: "Danger zone",    sub: "Delete account",                icon: "⌫" },
  ];

  return (
    <div className="card-paper-lifted relative overflow-hidden p-3">
      {/* Library-card header */}
      <div className="mb-3 rounded-2xl bg-gradient-to-br from-[#FFFCF3] to-[#F5E9CD] p-4 ring-1 ring-[color:var(--color-border)]">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[color:var(--color-saffron-deep)]">
          Translify · reader card
        </p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-[0.95rem] font-semibold leading-snug text-[color:var(--color-ink)]">
          {planName(sub.plan)}{" "}
          <span className="text-[color:var(--color-ink-soft)]">·</span>{" "}
          <span className="text-[color:var(--color-ink-soft)] italic">{sub.status}</span>
        </p>
      </div>

      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`group flex items-start gap-3 rounded-xl px-3 py-2.5 text-start transition-all ${
                active
                  ? "bg-[color:var(--color-ink)] text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.3)]"
                  : "text-[color:var(--color-ink)] hover:bg-[color:var(--color-paper-2)]"
              }`}
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg font-[family-name:var(--font-display)] text-base ${
                  active
                    ? "bg-[color:var(--color-saffron)] text-[color:var(--color-accent-foreground)]"
                    : "bg-[color:var(--color-paper-3)] text-[color:var(--color-ink-soft)]"
                }`}
              >
                {item.icon}
              </span>
              <span className="flex-1 leading-tight">
                <span className="block font-[family-name:var(--font-display)] text-[0.95rem] font-semibold">
                  {item.label}
                </span>
                <span className={`block text-[0.7rem] ${active ? "text-[color:var(--color-paper)]/70" : "text-[color:var(--color-ink-soft)]"}`}>
                  {item.sub}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-3 rounded-xl border border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)]/60 p-3 text-[0.72rem] leading-snug text-[color:var(--color-ink-soft)]">
        Need help?{" "}
        <a
          href="mailto:hello@translify.app"
          className="font-semibold text-[color:var(--color-ink)] underline decoration-[color:var(--color-saffron)] decoration-2 underline-offset-4"
        >
          hello@translify.app
        </a>
      </div>
    </div>
  );
}

/* ─────────────────────── Profile ─────────────────────── */

function ProfileSection({
  user,
  setUser,
  setFlash,
}: {
  user: User;
  setUser: (u: User) => void;
  setFlash: (f: { tone: "success" | "error" | "info"; text: string } | null) => void;
}) {
  const { t, setLocale } = useI18n();
  const [name, setName] = useState(user.display_name ?? "");
  const [email, setEmail] = useState(user.email);
  const [language, setLanguage] = useState(user.preferred_language ?? "en");
  const [familySafe, setFamilySafe] = useState(user.family_safe_mode);
  const [submitting, setSubmitting] = useState(false);

  const initial = (user.display_name || user.email || "?").charAt(0).toUpperCase();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updated = await updateProfile({
        display_name: name || null,
        preferred_language: language,
        family_safe_mode: familySafe,
        ...(email !== user.email ? { email } : {}),
      });
      setUser(updated);
      // Sync the i18n provider if the preferred language changed.
      if (
        ["en", "fr", "es", "de", "ja", "zh", "ar", "id", "ms"].includes(language) &&
        language !== user.preferred_language
      ) {
        setLocale(language as Parameters<typeof setLocale>[0]);
      }
      setFlash({ tone: "success", text: t("account.saved") });
    } catch (err) {
      setFlash({
        tone: "error",
        text: err instanceof ApiError ? err.message : t("account.errSave"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SectionShell
      eyebrow="Reader card"
      title="Your reader card."
      lede="The way you appear to the books, the citations, and the people you share a shelf with."
    >
      {/* Quick link out to the social/public profile editor — handle, bio,
          avatar. Lives at /settings/profile because the social schema is
          separate from the reader-card preferences below. */}
      <Link
        href="/settings/profile"
        className="mb-6 flex items-center justify-between gap-4 rounded-2xl border-[1.5px] border-dashed border-[color:var(--color-saffron-deep)]/40 bg-gradient-to-br from-[#FFFBF0] to-[#FBE9C2] px-5 py-4 transition-[transform,border-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-[1px] hover:border-[color:var(--color-saffron-deep)] active:scale-[0.995]"
      >
        <div className="min-w-0">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[color:var(--color-saffron-deep)]">
            Public profile
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-[1.05rem] font-semibold leading-tight text-[color:var(--color-ink)]">
            Handle, bio, and avatar
          </p>
          <p className="mt-0.5 text-[0.84rem] leading-snug text-[color:var(--color-ink-soft)]">
            What people see when you share a sentence to your timeline.
          </p>
        </div>
        <span
          aria-hidden
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--color-ink)] text-[color:var(--color-paper)]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </span>
      </Link>

      <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        {/* Form column */}
        <div className="flex flex-col gap-5">
          <Field label="What should we call you?">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="paper-input"
              placeholder="Optional — your shelf name"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="paper-input"
            />
            <span className="mt-1 text-[0.7rem] text-[color:var(--color-ink-soft)]">
              Changing your email will require re-verification.
            </span>
          </Field>
          <Field label="Preferred language">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {LOCALES.map((l) => {
                const sel = language === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setLanguage(l.code)}
                    dir={l.dir}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-start transition-all ${
                      sel
                        ? "border-[color:var(--color-saffron-deep)] bg-gradient-to-br from-[#FFFBF0] to-[#FBE9C2] shadow-[var(--shadow-paper)]"
                        : "border-[color:var(--color-border)] bg-[color:var(--color-paper)] hover:-translate-y-[1px]"
                    }`}
                  >
                    <span className="text-base leading-none">{l.flag}</span>
                    <span className="truncate text-[0.78rem] font-semibold text-[color:var(--color-ink)]">
                      {l.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Family-safe content toggle. Always visible so users see it exists;
              actual effect requires the Family plan (backend silently ignores
              the toggle on lower tiers, the preference still persists). */}
          <Field label="Family-safe mode">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-3 transition-colors hover:border-[color:var(--color-coral)]">
              <input
                type="checkbox"
                checked={familySafe}
                onChange={(e) => setFamilySafe(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--color-coral-deep)]"
              />
              <span className="flex-1 text-start">
                <span className="flex items-center gap-2">
                  <span className="text-[0.85rem] font-semibold text-[color:var(--color-ink)]">
                    Kid-safe content posture
                  </span>
                  <span className="rounded-full bg-[color:var(--color-coral)]/15 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.08em] text-[color:var(--color-coral-deep)]">
                    Family plan
                  </span>
                </span>
                <span className="mt-1 block text-[0.72rem] leading-snug text-[color:var(--color-ink-soft)]">
                  Lumi softens chat answers and quiz questions — no graphic violence,
                  no explicit content, no shock-value passages. Translation faithfully
                  reproduces the source either way.
                </span>
              </span>
            </label>
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex h-12 items-center justify-center gap-2 self-start rounded-full bg-[color:var(--color-ink)] px-7 font-semibold text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4)] transition-transform hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Saving…" : "Save reader card"}
          </button>
        </div>

        {/* Card preview */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <div className="relative rotate-[1deg] rounded-[1.6rem] border-[1.5px] border-[color:var(--color-border-strong)] bg-gradient-to-br from-[#FFFCF3] to-[#F0DCB6] p-7 shadow-[var(--shadow-paper-lg)] transition-transform hover:rotate-0">
            <div aria-hidden className="absolute -top-3 left-8 -rotate-[6deg]">
              <span className="rounded-[2px] bg-[color:var(--color-coral)]/55 px-3 py-1 text-[0.55rem] font-bold uppercase tracking-[0.2em] text-[color:var(--color-coral-deep)] shadow-[0_2px_4px_rgba(60,40,15,0.15)]">
                ✦ Member since {new Date().getFullYear()}
              </span>
            </div>

            <p className="text-[0.6rem] font-bold uppercase tracking-[0.28em] text-[color:var(--color-saffron-deep)]">
              Translify · reader card
            </p>
            <h3 className="mt-3 font-[family-name:var(--font-display)] text-[2rem] font-semibold leading-[1.05] tracking-tight text-[color:var(--color-ink)]">
              {name || <em className="text-[color:var(--color-ink-soft)]">Your name</em>}
            </h3>

            <div className="mt-5 flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[color:var(--color-ink)] font-[family-name:var(--font-display)] text-[1.6rem] font-semibold text-[color:var(--color-paper)] shadow-[0_4px_10px_rgba(20,16,8,0.35)]">
                {initial}
              </span>
              <div>
                <p className="text-[0.78rem] font-semibold text-[color:var(--color-ink)]">{email}</p>
                <p className="text-[0.7rem] text-[color:var(--color-ink-soft)]">
                  reads in{" "}
                  <strong className="text-[color:var(--color-ink)]">
                    {LOCALES.find((l) => l.code === language)?.label ?? language}
                  </strong>
                </p>
              </div>
            </div>

            <div className="mt-7 flex items-end justify-between border-t border-dashed border-[color:var(--color-border-strong)] pt-3">
              <p className="font-[family-name:var(--font-display)] text-[0.65rem] italic leading-snug text-[color:var(--color-ink-soft)]">
                Lend, but never lose.<br />Read, and remember.
              </p>
              <span className="font-mono text-[0.6rem] tracking-wider text-[color:var(--color-ink-soft)]">
                #{user.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </form>
    </SectionShell>
  );
}

/* ─────────────────────── Profiles (Family) ─────────────────────── */

function ProfilesSection({
  user,
  setUser,
  sub,
  setFlash,
}: {
  user: User;
  setUser: (u: User) => void;
  sub: Subscription;
  setFlash: (f: { tone: "success" | "error" | "info"; text: string } | null) => void;
}) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<ProfileKind>("adult");
  const [newAvatar, setNewAvatar] = useState<string>("lumi");

  // Initial load. Mutated locally on create/delete for snappier UX.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listProfiles();
        if (!cancelled) setProfiles(list);
      } catch (err) {
        if (!cancelled) {
          setFlash({
            tone: "error",
            text: err instanceof ApiError ? err.message : "Couldn't load profiles.",
          });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [setFlash]);

  const quota = sub.quota.profiles;
  const remaining = profiles ? Math.max(0, quota - profiles.length) : 0;
  const atCap = profiles ? profiles.length >= quota : false;

  const onActivate = async (id: string) => {
    setBusy(id);
    try {
      await activateProfile(id);
      setUser({ ...user, active_profile_id: id });
      setFlash({ tone: "success", text: "Reader switched." });
      // Force a fresh load of book/highlight context in case a child profile
      // is now active (the chat / quiz routes resolve family-safe per request,
      // but it's nice for the picker label to update everywhere).
      router.refresh();
    } catch (err) {
      setFlash({
        tone: "error",
        text: err instanceof ApiError ? err.message : "Couldn't switch reader.",
      });
    } finally {
      setBusy(null);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this reader profile? Their reading history is kept under the household.")) {
      return;
    }
    setBusy(id);
    try {
      await deleteProfileRequest(id);
      setProfiles((prev) => prev?.filter((p) => p.id !== id) ?? null);
      if (user.active_profile_id === id) {
        setUser({ ...user, active_profile_id: null });
      }
      setFlash({ tone: "success", text: "Profile removed." });
    } catch (err) {
      setFlash({
        tone: "error",
        text: err instanceof ApiError ? err.message : "Couldn't delete that profile.",
      });
    } finally {
      setBusy(null);
    }
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const created = await createProfile({
        name: newName.trim(),
        kind: newKind,
        avatar_seed: newAvatar,
      });
      setProfiles((prev) => (prev ? [...prev, created] : [created]));
      setNewName("");
      setNewKind("adult");
      setNewAvatar("lumi");
      setFlash({ tone: "success", text: `${created.name} joined the shelf.` });
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setFlash({
          tone: "info",
          text: "You're at your plan's reader limit — upgrade to Family for up to 5.",
        });
      } else {
        setFlash({
          tone: "error",
          text: err instanceof ApiError ? err.message : "Couldn't add that reader.",
        });
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <SectionShell
      eyebrow="Family readers"
      title="One household, many readers."
      lede={
        quota > 1
          ? `Switch profiles to keep each reader's vibe distinct. Up to ${quota} readers on your plan.`
          : "Family plans get up to 5 reader profiles — one for each person on the shelf."
      }
    >
      {profiles === null ? (
        <p className="text-[color:var(--color-ink-soft)]">Loading profiles…</p>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((p) => (
              <ProfileCard
                key={p.id}
                profile={p}
                active={user.active_profile_id === p.id}
                busy={busy === p.id}
                onActivate={() => onActivate(p.id)}
                onDelete={p.is_default ? undefined : () => onDelete(p.id)}
              />
            ))}
          </div>

          {atCap ? (
            <div className="rounded-2xl border border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-paper-2)] p-5 text-[0.8rem] text-[color:var(--color-ink-soft)]">
              {quota === 1 ? (
                <>
                  <strong className="text-[color:var(--color-ink)]">One reader per shelf on this plan.</strong>{" "}
                  Upgrade to Family for up to 5 readers + per-child kid-safe mode.
                </>
              ) : (
                <>You've filled all {quota} reader slots — remove one to add another.</>
              )}
            </div>
          ) : (
            <form
              onSubmit={onCreate}
              className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-5 shadow-[var(--shadow-paper)]"
            >
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[color:var(--color-saffron-deep)]">
                Add a reader · {remaining} slot{remaining === 1 ? "" : "s"} left
              </p>
              <h4 className="mt-1 font-[family-name:var(--font-display)] text-[1.4rem] font-semibold text-[color:var(--color-ink)]">
                Who's joining the shelf?
              </h4>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
                <Field label="Reader name">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="paper-input"
                    placeholder="e.g. Yara"
                    maxLength={60}
                    required
                  />
                </Field>
                <Field label="Reader kind">
                  <div className="flex gap-2">
                    {(["adult", "child"] as const).map((k) => {
                      const sel = newKind === k;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setNewKind(k)}
                          className={`flex-1 rounded-xl border px-3 py-2 text-[0.78rem] font-semibold transition-colors ${
                            sel
                              ? "border-[color:var(--color-coral-deep)] bg-[color:var(--color-coral)]/15 text-[color:var(--color-coral-deep)]"
                              : "border-[color:var(--color-border)] bg-[color:var(--color-paper)] text-[color:var(--color-ink)]"
                          }`}
                        >
                          {k === "adult" ? "Grown-up" : "Kid (safe mode on)"}
                        </button>
                      );
                    })}
                  </div>
                </Field>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={creating || !newName.trim()}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[color:var(--color-ink)] px-6 font-semibold text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4)] transition-transform hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {creating ? "Adding…" : "Add reader"}
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <Field label="Avatar">
                  <AvatarPicker value={newAvatar} onChange={setNewAvatar} />
                </Field>
              </div>
            </form>
          )}
        </div>
      )}
    </SectionShell>
  );
}

function ProfileCard({
  profile,
  active,
  busy,
  onActivate,
  onDelete,
}: {
  profile: Profile;
  active: boolean;
  busy: boolean;
  onActivate: () => void;
  onDelete?: () => void;
}) {
  // Avoid pulling avatarEmoji statically — keeps the bundle a touch leaner
  // for tabs that never get visited.
  const emoji = AVATAR_EMOJI[profile.avatar_seed] ?? "🦉";
  return (
    <div
      className={`relative rounded-2xl border p-5 shadow-[var(--shadow-paper)] transition-transform hover:-translate-y-[2px] ${
        active
          ? "border-[color:var(--color-saffron-deep)] bg-gradient-to-br from-[#FFFCF3] to-[#FBE9C2]"
          : "border-[color:var(--color-border)] bg-[color:var(--color-paper)]"
      }`}
    >
      {active && (
        <span className="absolute -top-2 left-4 rounded-[2px] bg-[color:var(--color-saffron)] px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.2em] text-[color:var(--color-accent-foreground)] shadow-[0_2px_4px_rgba(60,40,15,0.15)]">
          Currently reading
        </span>
      )}
      <div className="flex items-start gap-3">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[color:var(--color-paper-3)] text-[1.8rem] shadow-[inset_0_0_0_1px_var(--color-border)]">
          {emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-[family-name:var(--font-display)] text-[1.25rem] font-semibold leading-tight text-[color:var(--color-ink)]">
            {profile.name}
          </p>
          <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[color:var(--color-ink-soft)]">
            {profile.kind === "child" ? "Kid · safe mode" : "Grown-up"}
            {profile.is_default && " · default"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onActivate}
          disabled={active || busy}
          className={`flex-1 rounded-full px-4 py-2 text-[0.78rem] font-semibold transition-colors ${
            active
              ? "cursor-default bg-[color:var(--color-ink)]/10 text-[color:var(--color-ink-soft)]"
              : "bg-[color:var(--color-ink)] text-[color:var(--color-paper)] hover:-translate-y-[1px]"
          } disabled:cursor-not-allowed`}
        >
          {active ? "Selected" : busy ? "Switching…" : "Switch to this reader"}
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            aria-label={`Delete ${profile.name}`}
            className="grid h-9 w-9 place-items-center rounded-full border border-[color:var(--color-border)] text-[color:var(--color-ink-soft)] transition-colors hover:border-[color:var(--color-coral)] hover:text-[color:var(--color-coral-deep)] disabled:opacity-40"
          >
            ⌫
          </button>
        )}
      </div>
    </div>
  );
}

const AVATAR_EMOJI: Record<string, string> = {
  lumi: "🦉",
  fox: "🦊",
  bear: "🐻",
  panda: "🐼",
  cat: "🐱",
  rabbit: "🐰",
  dragon: "🐉",
  unicorn: "🦄",
};

function AvatarPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (seed: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(AVATAR_EMOJI).map(([seed, emoji]) => {
        const sel = value === seed;
        return (
          <button
            key={seed}
            type="button"
            onClick={() => onChange(seed)}
            aria-label={`Avatar ${seed}`}
            className={`grid h-11 w-11 place-items-center rounded-xl border text-[1.4rem] transition-transform hover:-translate-y-[1px] ${
              sel
                ? "border-[color:var(--color-saffron-deep)] bg-gradient-to-br from-[#FFFCF3] to-[#FBE9C2] shadow-[var(--shadow-paper)]"
                : "border-[color:var(--color-border)] bg-[color:var(--color-paper)]"
            }`}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────── Subscription ─────────────────────── */

function SubscriptionSection({
  sub,
  setSub,
  setFlash,
}: {
  sub: Subscription;
  setSub: (s: Subscription) => void;
  setFlash: (f: { tone: "success" | "error" | "info"; text: string } | null) => void;
}) {
  const [cycle, setCycle] = useState<Cycle>("yearly");
  const [busy, setBusy] = useState<string | null>(null);

  const onSubscribe = async (plan: Exclude<Plan, "free">) => {
    setBusy(plan);
    try {
      const { url } = await startCheckout({
        plan,
        cycle,
        applyFirstMonthDiscount: sub.plan === "free",
      });
      window.location.href = url;
    } catch (err) {
      setFlash({
        tone: "error",
        text: err instanceof ApiError ? err.message : "Couldn't start checkout.",
      });
      setBusy(null);
    }
  };

  const onPortal = async () => {
    setBusy("portal");
    try {
      const { url } = await startPortal();
      window.location.href = url;
    } catch (err) {
      setFlash({
        tone: "error",
        text: err instanceof ApiError ? err.message : "Couldn't open the billing portal.",
      });
      setBusy(null);
    }
  };

  // Manual refresh button — useful right after returning from Stripe.
  const onRefresh = async () => {
    setBusy("refresh");
    try {
      const fresh = await getSubscription();
      setSub(fresh);
    } finally {
      setBusy(null);
    }
  };

  const isSubscriber = sub.plan !== "free" && sub.status !== "inactive";

  const pagesUsed = sub.usage.pages_uploaded;
  const pagesLimit = sub.quota.pages_per_month;
  const pct = isUnlimited(pagesLimit) ? 0 : Math.min(100, Math.round((pagesUsed / Math.max(1, pagesLimit)) * 100));

  return (
    <SectionShell
      eyebrow="Subscription"
      title="Your reading passport."
      lede="The shape of your shelf, the rights that come with it, and how much you've explored this period."
    >
      {/* Status hero */}
      <div className="relative overflow-hidden rounded-[1.6rem] border-[1.5px] border-[color:var(--color-border-strong)] bg-gradient-to-br from-[#FFFCF3] via-[#F8E9C5] to-[#EFD8A6] p-7 shadow-[var(--shadow-paper-lg)] lg:p-9">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-16 h-56 w-56 rounded-full bg-white/40 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-16 -bottom-16 h-44 w-44 rounded-full bg-[color:var(--color-coral)]/15 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <StatusPill status={sub.status} />
              {sub.cancel_at_period_end && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-coral)]/20 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[color:var(--color-coral-deep)]">
                  ↻ Ends at period end
                </span>
              )}
            </div>
            <h3 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2.2rem,4.5vw,3.4rem)] font-semibold leading-[1.05] tracking-tight">
              {planName(sub.plan)}
              {sub.cycle && (
                <span className="ml-3 text-[1rem] font-normal italic text-[color:var(--color-ink-soft)]">
                  / {sub.cycle === "yearly" ? "yearly" : "monthly"}
                </span>
              )}
            </h3>
            {sub.current_period_end && (
              <p className="mt-2 text-[0.92rem] text-[color:var(--color-ink-soft)]">
                {sub.cancel_at_period_end ? "Access ends" : "Renews"}{" "}
                <strong className="text-[color:var(--color-ink)]">
                  {formatDate(sub.current_period_end)}
                </strong>
              </p>
            )}
            {sub.trial_end && new Date(sub.trial_end) > new Date() && (
              <p className="mt-2 text-[0.92rem] text-[color:var(--color-saffron-deep)]">
                ✦ Trial ends {formatDate(sub.trial_end)} — first charge happens then.
              </p>
            )}

            {/* Quota meter */}
            <div className="mt-6">
              <div className="flex items-baseline justify-between">
                <span className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[color:var(--color-ink-soft)]">
                  Pages this period
                </span>
                <span className="font-[family-name:var(--font-display)] text-[1.1rem] font-semibold tabular-nums text-[color:var(--color-ink)]">
                  {pagesUsed.toLocaleString()}{" "}
                  <span className="text-[color:var(--color-ink-soft)]">/</span>{" "}
                  {isUnlimited(pagesLimit) ? "∞" : pagesLimit.toLocaleString()}
                </span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/60 ring-1 ring-[color:var(--color-border)] ring-inset">
                {isUnlimited(pagesLimit) ? (
                  <div className="h-full w-full bg-gradient-to-r from-[color:var(--color-saffron)] via-[color:var(--color-coral)] to-[color:var(--color-plum)] opacity-60" />
                ) : (
                  <div
                    className="h-full bg-gradient-to-r from-[color:var(--color-saffron)] to-[color:var(--color-coral)] transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                )}
              </div>
              {!isUnlimited(pagesLimit) && pagesUsed >= pagesLimit * 0.8 && (
                <p className="mt-2 text-[0.78rem] text-[color:var(--color-coral-deep)]">
                  ⚠ You&apos;ve used {pct}% of your monthly pages. Time to{" "}
                  <button
                    type="button"
                    onClick={() => document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" })}
                    className="font-semibold underline decoration-[color:var(--color-coral)] decoration-2 underline-offset-2"
                  >
                    upgrade?
                  </button>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 self-start">
            {isSubscriber && (
              <button
                type="button"
                onClick={onPortal}
                disabled={busy !== null}
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[color:var(--color-ink)] px-6 font-semibold text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4),0_10px_22px_-8px_rgba(20,16,8,0.4)] transition-transform hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === "portal" ? "Opening Stripe…" : "Manage in Stripe"}
                <span className="opacity-70">↗</span>
              </button>
            )}
            <button
              type="button"
              onClick={onRefresh}
              disabled={busy !== null}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border-[1.5px] border-[color:var(--color-ink)] bg-[color:var(--color-paper)] px-5 text-sm font-semibold text-[color:var(--color-ink)] transition-transform hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className={busy === "refresh" ? "animate-spin inline-block" : "inline-block"}>↻</span>
              {busy === "refresh" ? "Refreshing…" : "Refresh status"}
            </button>
          </div>
        </div>

        {/* Quota chips */}
        <div className="relative mt-7 flex flex-wrap gap-2">
          <Chip on={sub.quota.chat_with_citations}>Chat with citations</Chip>
          <Chip on={sub.quota.literary_translation}>Literary translation</Chip>
          <Chip on={sub.quota.annotated_export}>Annotated PDF export</Chip>
          <Chip on={sub.quota.priority_queue}>Priority queue</Chip>
          <Chip on={sub.quota.family_safe_mode}>Kid-safe mode</Chip>
          <Chip on={sub.quota.profiles > 1}>{sub.quota.profiles} profiles</Chip>
        </div>
      </div>

      {/* Plan options — passport stamps */}
      <div id="plans" className="mt-12">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="badge-pill bg-[color:var(--color-paper-3)] text-[color:var(--color-ink-soft)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-saffron)]" />
              {isSubscriber ? "Change plan" : "Choose a plan"}
            </span>
            <h3 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.7rem,3vw,2.2rem)] font-semibold leading-tight tracking-tight">
              {isSubscriber ? "Upgrade, downgrade, or switch cycles." : "Stamp your passport."}
            </h3>
          </div>
          <CycleToggle cycle={cycle} setCycle={setCycle} />
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {(["reader", "scholar", "family"] as const).map((p, i) => (
            <PlanStamp
              key={p}
              plan={p}
              cycle={cycle}
              currentPlan={sub.plan}
              busy={busy === p}
              onSubscribe={() => onSubscribe(p)}
              best={p === "scholar"}
              tilt={i === 0 ? "-rotate-[1.2deg]" : i === 1 ? "rotate-[0.6deg]" : "-rotate-[0.4deg]"}
            />
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

function StatusPill({ status }: { status: Subscription["status"] }) {
  const map: Record<Subscription["status"], { label: string; bg: string; text: string; dot: string }> = {
    inactive: {
      label: "Free reader",
      bg: "bg-[color:var(--color-paper-3)]",
      text: "text-[color:var(--color-ink-soft)]",
      dot: "bg-[color:var(--color-ink-soft)]",
    },
    trialing: {
      label: "On trial",
      bg: "bg-[color:var(--color-saffron)]/25",
      text: "text-[color:var(--color-saffron-deep)]",
      dot: "bg-[color:var(--color-saffron)]",
    },
    active: {
      label: "Active",
      bg: "bg-[color:var(--color-sage)]/25",
      text: "text-[color:var(--color-sage-deep)]",
      dot: "bg-[color:var(--color-sage)]",
    },
    past_due: {
      label: "Past due",
      bg: "bg-[color:var(--color-coral)]/25",
      text: "text-[color:var(--color-coral-deep)]",
      dot: "bg-[color:var(--color-coral)]",
    },
    canceled: {
      label: "Canceled",
      bg: "bg-[color:var(--color-paper-3)]",
      text: "text-[color:var(--color-ink-soft)]",
      dot: "bg-[color:var(--color-ink-soft)]",
    },
    unpaid: {
      label: "Unpaid",
      bg: "bg-[color:var(--color-coral)]/25",
      text: "text-[color:var(--color-coral-deep)]",
      dot: "bg-[color:var(--color-coral)]",
    },
  };
  const m = map[status];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full ${m.bg} px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.16em] ${m.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function Chip({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.78rem] font-semibold ${
        on
          ? "bg-[color:var(--color-ink)]/90 text-[color:var(--color-paper)]"
          : "bg-white/60 text-[color:var(--color-ink-soft)] line-through opacity-60"
      }`}
    >
      <span aria-hidden>{on ? "✓" : "·"}</span>
      {children}
    </span>
  );
}

function CycleToggle({ cycle, setCycle }: { cycle: Cycle; setCycle: (c: Cycle) => void }) {
  return (
    <div className="relative inline-flex items-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-1 shadow-[0_1px_0_rgba(74,60,30,0.05)]">
      <button
        type="button"
        onClick={() => setCycle("monthly")}
        className={`relative z-10 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
          cycle === "monthly" ? "text-[color:var(--color-paper)]" : "text-[color:var(--color-ink-soft)]"
        }`}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => setCycle("yearly")}
        className={`relative z-10 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
          cycle === "yearly" ? "text-[color:var(--color-paper)]" : "text-[color:var(--color-ink-soft)]"
        }`}
      >
        Yearly
        <span className={`rounded-full px-1.5 py-0.5 text-[0.6rem] font-bold ${
          cycle === "yearly" ? "bg-[color:var(--color-saffron)] text-[color:var(--color-accent-foreground)]" : "bg-[color:var(--color-sage)]/20 text-[color:var(--color-sage-deep)]"
        }`}>
          −20%
        </span>
      </button>
      <span
        aria-hidden
        className="absolute inset-y-1 w-[calc(50%-2px)] rounded-full bg-[color:var(--color-ink)] shadow-[0_2px_0_rgba(20,16,8,0.45)] transition-transform duration-300"
        style={{ transform: cycle === "monthly" ? "translateX(2px)" : "translateX(calc(100% - 2px))" }}
      />
    </div>
  );
}

function PlanStamp({
  plan,
  cycle,
  currentPlan,
  busy,
  onSubscribe,
  best,
  tilt,
}: {
  plan: Exclude<Plan, "free">;
  cycle: Cycle;
  currentPlan: Plan;
  busy: boolean;
  onSubscribe: () => void;
  best?: boolean;
  tilt: string;
}) {
  const isCurrent = currentPlan === plan;
  const price = PLAN_PRICES[plan][cycle];

  const features: Record<typeof plan, string[]> = {
    reader: ["600 pages / month (~3 books)", "All 14 languages", "Side-by-side reading", "Chat with citations", "Quiz mode (10 q / book)"],
    scholar: ["Unlimited pages", "Literary translation (Anthropic)", "Priority queue", "Annotated PDF export", "Smart vocabulary lists"],
    family: ["Everything in Scholar", "5 reader profiles", "Kid-safe mode", "Parent dashboard"],
  };
  const tones: Record<typeof plan, { ring: string; bg: string; chip: string; chipText: string }> = {
    reader: {
      ring: "border-[color:var(--color-border)]",
      bg: "bg-[color:var(--color-paper)]",
      chip: "bg-[color:var(--color-paper-3)]",
      chipText: "text-[color:var(--color-ink-soft)]",
    },
    scholar: {
      ring: "border-[color:var(--color-saffron-deep)]",
      bg: "bg-gradient-to-br from-[#FFFBF0] to-[#FBE9C2]",
      chip: "bg-[color:var(--color-saffron)]",
      chipText: "text-[color:var(--color-accent-foreground)]",
    },
    family: {
      ring: "border-[color:var(--color-sage-deep)]/60",
      bg: "bg-gradient-to-br from-[#F4F8EC] to-[#DDEAD2]",
      chip: "bg-[color:var(--color-sage)]/20",
      chipText: "text-[color:var(--color-sage-deep)]",
    },
  };
  const t = tones[plan];

  return (
    <div
      className={`relative ${tilt} flex flex-col rounded-[1.4rem] border-[1.5px] ${t.ring} ${t.bg} p-6 shadow-[var(--shadow-paper)] transition-transform duration-300 hover:rotate-0 hover:-translate-y-1`}
    >
      {best && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 -rotate-[3deg]">
          <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-coral)] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white shadow-[0_8px_18px_-6px_rgba(197,89,77,0.55)]">
            ★ Most loved
          </span>
        </div>
      )}
      {isCurrent && (
        <div className="absolute -top-3 right-4">
          <span className="rounded-full bg-[color:var(--color-ink)] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[color:var(--color-paper)]">
            ✓ current
          </span>
        </div>
      )}

      <span className={`badge-pill ${t.chip} ${t.chipText}`}>{planName(plan)}</span>

      <div className="mt-5 flex items-baseline gap-1">
        <span className="font-[family-name:var(--font-display)] text-[2.6rem] font-semibold leading-none tracking-tight">
          €{price}
        </span>
        <span className="text-sm text-[color:var(--color-ink-soft)]">/mo</span>
      </div>
      <p className="mt-1 text-xs text-[color:var(--color-ink-soft)]">
        {cycle === "yearly" ? `billed €${price * 12} yearly` : "billed monthly"}
      </p>

      <ul className="mt-5 space-y-2 text-[0.88rem] text-[color:var(--color-ink)]">
        {features[plan].map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[color:var(--color-sage)]/20 text-[color:var(--color-sage-deep)]">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex-1" />

      <button
        type="button"
        onClick={onSubscribe}
        disabled={busy || isCurrent}
        className={`inline-flex h-11 items-center justify-center gap-2 rounded-full font-semibold transition-transform hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60 ${
          best
            ? "bg-[color:var(--color-ink)] text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4)]"
            : "border-[1.5px] border-[color:var(--color-ink)] bg-[color:var(--color-paper)] text-[color:var(--color-ink)]"
        }`}
      >
        {busy
          ? "Redirecting…"
          : isCurrent
            ? "Your current plan"
            : currentPlan === "free"
              ? `Become a ${planName(plan)}`
              : `Switch to ${planName(plan)}`}
      </button>
    </div>
  );
}

/* ─────────────────────── Security ─────────────────────── */

function SecuritySection({
  setFlash,
}: {
  setFlash: (f: { tone: "success" | "error" | "info"; text: string } | null) => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setFlash({ tone: "error", text: "Passwords don't match." });
      return;
    }
    if (password.length < 8) {
      setFlash({ tone: "error", text: "Password must be at least 8 characters." });
      return;
    }
    setSubmitting(true);
    try {
      await updateProfile({ password });
      setFlash({ tone: "success", text: "Password updated." });
      setPassword("");
      setConfirm("");
    } catch (err) {
      setFlash({
        tone: "error",
        text: err instanceof ApiError ? err.message : "Couldn't update password.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SectionShell
      eyebrow="Security"
      title="Lock the cabinet."
      lede="A new password, every once in a while. We never see the old one."
    >
      <form onSubmit={onSubmit} className="grid max-w-lg gap-5">
        <Field label="New password">
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="paper-input"
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirm new password">
          <input
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="paper-input"
            placeholder="Type it once more"
            autoComplete="new-password"
          />
        </Field>
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 inline-flex h-12 items-center justify-center gap-2 self-start rounded-full bg-[color:var(--color-ink)] px-7 font-semibold text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4)] transition-transform hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </SectionShell>
  );
}

/* ─────────────────────── Lumi & Progress ─────────────────────── */

function LumiSection() {
  const { progress } = useLumi();
  const xpInfo = xpToNextLevel(progress);
  const title = LEVEL_TITLES[progress.level];
  const allLevels = [1, 2, 3, 4, 5] as const;

  return (
    <SectionShell
      eyebrow="Companion"
      title="Lumi & your progress"
      lede="Track your reading journey. Every book translated, quiz aced, and day kept is a feather in Lumi's wings."
    >
      {/* Hero card — current state of Lumi */}
      <div className="relative overflow-hidden rounded-3xl border-[1.5px] border-[color:var(--color-border)] bg-gradient-to-br from-[#FFFCF3] to-[color:var(--color-paper-2)] p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-12 -top-16 h-56 w-56 rounded-full bg-[color:var(--color-saffron)]/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -bottom-16 h-56 w-56 rounded-full bg-[color:var(--color-sage)]/15 blur-3xl"
        />

        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
          <div className="shrink-0">
            <Lumi state="happy" size={180} level={progress.level} animate />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[color:var(--color-saffron-deep)]">
              Level {progress.level} · {title}
            </p>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-[clamp(1.6rem,3vw,2.2rem)] font-semibold leading-tight tracking-tight">
              {progress.xp.toLocaleString()}{" "}
              <span className="text-[color:var(--color-ink-soft)]">XP</span>
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-ink-soft)]">
              {xpInfo
                ? `${xpInfo.needed.toLocaleString()} XP to Level ${progress.level + 1}.`
                : "You've reached the highest rank. Lumi salutes you. 🦉"}
            </p>

            {/* XP bar */}
            <div className="mt-4 max-w-md">
              <div className="relative h-2.5 overflow-hidden rounded-full bg-[color:var(--color-paper-3)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[color:var(--color-saffron)] to-[color:var(--color-saffron-deep)] transition-[width] duration-700 ease-out"
                  style={{ width: xpInfo ? `${xpInfo.pct}%` : "100%" }}
                />
              </div>
              {xpInfo && (
                <p className="mt-1.5 font-mono text-[10px] tabular-nums text-[color:var(--color-ink-soft)]">
                  {progress.xp} / {xpInfo.next} XP
                </p>
              )}
            </div>

            {/* Streak */}
            {progress.streakDays > 0 && (
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-coral)]/15 px-3 py-1 text-[12px] font-semibold text-[color:var(--color-coral-deep)]">
                <span aria-hidden>🔥</span>
                <span>{progress.streakDays}-day streak</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Level ladder */}
      <div className="mt-6 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-paper)]/60 p-5">
        <h4 className="mb-4 font-[family-name:var(--font-display)] text-[1.1rem] font-semibold tracking-tight">
          The ladder
        </h4>
        <div className="grid grid-cols-5 gap-3">
          {allLevels.map((lv) => {
            const reached = progress.level >= lv;
            const threshold = LEVELS[lv - 1] ?? 0;
            return (
              <div
                key={lv}
                className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all ${
                  reached
                    ? "border-[color:var(--color-saffron)] bg-[color:var(--color-saffron)]/8"
                    : "border-dashed border-[color:var(--color-border)] opacity-50"
                }`}
              >
                <div className={reached ? "" : "grayscale"}>
                  <Lumi state="neutral" size={56} level={lv} animate={false} />
                </div>
                <div className="text-center">
                  <p className="font-[family-name:var(--font-display)] text-[0.75rem] font-semibold text-[color:var(--color-ink)]">
                    Lv {lv}
                  </p>
                  <p className="text-[0.65rem] leading-tight text-[color:var(--color-ink-soft)]">
                    {LEVEL_TITLES[lv]}
                  </p>
                  <p className="mt-0.5 font-mono text-[0.62rem] tabular-nums text-[color:var(--color-ink-soft)]/70">
                    {threshold} XP
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements grid */}
      <div className="mt-6 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-paper)]/60 p-5">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h4 className="font-[family-name:var(--font-display)] text-[1.1rem] font-semibold tracking-tight">
            Achievements
          </h4>
          <span className="font-mono text-[11px] tabular-nums text-[color:var(--color-ink-soft)]">
            {progress.awarded.length} / {Object.keys(ACHIEVEMENTS).length}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {Object.entries(ACHIEVEMENTS).map(([id, ach]) => {
            const earned = progress.awarded.includes(id);
            return (
              <div
                key={id}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                  earned
                    ? "border-[color:var(--color-saffron)]/50 bg-gradient-to-br from-[#FFF8E8] to-[color:var(--color-paper)] shadow-[var(--shadow-paper)]"
                    : "border-dashed border-[color:var(--color-border)] bg-[color:var(--color-paper)]/40 opacity-60"
                }`}
              >
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg text-xl ${
                    earned
                      ? "bg-[color:var(--color-saffron)]/20"
                      : "bg-[color:var(--color-paper-3)] grayscale"
                  }`}
                >
                  <span aria-hidden>{ach.emoji}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-[family-name:var(--font-display)] text-[0.92rem] font-semibold leading-tight text-[color:var(--color-ink)]">
                    {ach.title}
                  </p>
                  <p className="mt-0.5 text-[0.75rem] leading-tight text-[color:var(--color-ink-soft)]">
                    {ach.description}
                  </p>
                </div>
                <div
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${
                    earned
                      ? "bg-[color:var(--color-saffron)] text-white"
                      : "bg-[color:var(--color-paper-3)] text-[color:var(--color-ink-soft)]"
                  }`}
                >
                  +{ach.xp} XP
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SectionShell>
  );
}

/* ─────────────────────── Danger zone ─────────────────────── */

function DangerSection({ user }: { user: User }) {
  const [confirm, setConfirm] = useState("");
  const matches = confirm === user.email;

  return (
    <SectionShell
      eyebrow="Danger zone"
      title="Closing the shelf."
      lede="Permanent, irreversible. We'll delete your books, translations, chats, quizzes — everything."
    >
      <div className="rounded-[1.4rem] border-[1.5px] border-[color:var(--color-coral-deep)]/40 bg-[color:var(--color-coral)]/8 p-7 shadow-[var(--shadow-paper)]">
        <h3 className="font-[family-name:var(--font-display)] text-[1.4rem] font-semibold tracking-tight text-[color:var(--color-coral-deep)]">
          Delete your account
        </h3>
        <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-[color:var(--color-ink-soft)]">
          If you have an active subscription, please cancel it first via{" "}
          <strong className="text-[color:var(--color-ink)]">Manage in Stripe</strong>{" "}
          to avoid being charged. Then type your email below to confirm.
        </p>
        <div className="mt-5 grid max-w-md gap-3">
          <input
            type="email"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="paper-input"
            placeholder={user.email}
            aria-label="Confirm email"
          />
          <button
            type="button"
            disabled={!matches}
            onClick={() => {
              // Account deletion endpoint not yet wired — surface for support email.
              window.location.href = `mailto:hello@translify.app?subject=Delete%20my%20account&body=Please%20delete%20account%20${encodeURIComponent(user.email)}`;
            }}
            className="inline-flex h-12 items-center justify-center gap-2 self-start rounded-full bg-[color:var(--color-coral-deep)] px-6 font-semibold text-white shadow-[0_2px_0_rgba(140,40,30,0.4)] transition-transform hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-30"
          >
            Permanently delete my account
          </button>
        </div>
      </div>
    </SectionShell>
  );
}

/* ─────────────────────── Shared ─────────────────────── */

function SectionShell({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-paper-lifted relative overflow-hidden p-7 lg:p-10">
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[color:var(--color-saffron-deep)]">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(2rem,4vw,2.8rem)] font-semibold leading-[1.05] tracking-tight">
        {title}
      </h2>
      <p className="mt-3 max-w-xl text-[0.98rem] leading-relaxed text-[color:var(--color-ink-soft)]">
        {lede}
      </p>
      <div className="mt-8 border-t border-dashed border-[color:var(--color-border)] pt-8" />
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[color:var(--color-ink-soft)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function FlashBanner({
  flash,
  onDismiss,
}: {
  flash: { tone: "success" | "error" | "info"; text: string };
  onDismiss: () => void;
}) {
  const tones = {
    success: "border-[color:var(--color-sage-deep)]/40 bg-[color:var(--color-sage)]/12 text-[color:var(--color-sage-deep)]",
    error: "border-[color:var(--color-coral-deep)]/40 bg-[color:var(--color-coral)]/12 text-[color:var(--color-coral-deep)]",
    info: "border-[color:var(--color-saffron-deep)]/40 bg-[color:var(--color-saffron)]/15 text-[color:var(--color-saffron-deep)]",
  };
  return (
    <div
      role="status"
      className={`mb-6 flex items-start gap-3 rounded-2xl border-[1.5px] ${tones[flash.tone]} px-4 py-3 shadow-[var(--shadow-paper)] animate-pop-in`}
    >
      <span className="font-[family-name:var(--font-display)] text-lg leading-none">
        {flash.tone === "success" ? "✓" : flash.tone === "error" ? "!" : "·"}
      </span>
      <p className="flex-1 text-[0.92rem] leading-snug">{flash.text}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="text-current/60 hover:text-current"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

function Stamp({ tone }: { tone: "active" | "trial" | "free" | "warn" }) {
  // Decorative wax-stamp seal in the page corner — matches active state.
  const colors = {
    active: { fg: "var(--color-sage-deep)", bg: "rgba(123,161,124,0.18)", label: "✓ READING" },
    trial: { fg: "var(--color-saffron-deep)", bg: "rgba(224,164,88,0.20)", label: "✦ TRIAL" },
    warn: { fg: "var(--color-coral-deep)", bg: "rgba(226,120,108,0.18)", label: "! ATTEND" },
    free: { fg: "rgba(74,82,99,0.6)", bg: "rgba(74,82,99,0.08)", label: "FREE" },
  }[tone];
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed bottom-6 right-6 z-0 hidden -rotate-[10deg] lg:block"
    >
      <div
        className="grid h-20 w-20 place-items-center rounded-full border-[3px] font-[family-name:var(--font-display)] text-[0.6rem] font-bold uppercase tracking-[0.16em] shadow-[inset_0_0_0_3px_rgba(255,255,255,0.5)]"
        style={{
          color: colors.fg,
          borderColor: colors.fg,
          background: colors.bg,
        }}
      >
        {colors.label}
      </div>
    </div>
  );
}

function statusTone(sub: Subscription): "active" | "trial" | "free" | "warn" {
  if (sub.status === "active") return "active";
  if (sub.status === "trialing") return "trial";
  if (sub.status === "past_due" || sub.status === "unpaid") return "warn";
  return "free";
}

function ParchmentBackdrop() {
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-24 h-96 w-96 rounded-full bg-[color:var(--color-saffron)]/14 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-32 top-40 h-[28rem] w-[28rem] rounded-full bg-[color:var(--color-sage)]/12 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[color:var(--color-coral)]/10 blur-3xl" />
    </>
  );
}

function upgradeFlash(reason: string): string {
  switch (reason) {
    case "pages":
    case "books":   // legacy alias from older links
    case "quota":   // legacy alias from older links
      return "This upload would put you over your plan's monthly page budget. Upgrade below to keep going.";
    case "quizzes":
      return "You've used every quiz this book allows on your plan. Upgrade for unlimited.";
    case "chat":
      return "Chat with citations is a Reader feature. Pick a plan below to unlock.";
    case "translate":
      return "Translations need an active plan. Pick one below — first month is on us.";
    case "no_plan":
      return "An active plan is required for that. Pick one below to keep going.";
    case "trial":
      return "Welcome — your 2 free pages are ready. Pick a plan below whenever you're set on more.";
    default:
      return "Upgrade your plan below to unlock more.";
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

// Suppress unused — useMemo kept for potential future memoized derivations.
useMemo;
