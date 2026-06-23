"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { usePostHog } from "posthog-js/react";
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
  const posthog = usePostHog();
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
      // Conversion event for experiments (e.g. the /study hero A/B). PostHog
      // auto-attaches the user's active flags, so this attributes the purchase
      // back to the variant. Deduped per checkout session so a refresh of the
      // success URL doesn't double-count.
      const sessionId = params.get("session_id") ?? undefined;
      try {
        const key = `ph_sub_started_${sessionId ?? "x"}`;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          posthog?.capture("subscription_started", { session_id: sessionId });
        }
      } catch {
        posthog?.capture("subscription_started", { session_id: sessionId });
      }
      setFlash({
        tone: "success",
        text: t("account.checkoutSuccess"),
      });
      const id = setTimeout(() => {
        getSubscription().then(setSub).catch(() => {});
      }, 2500);
      setTab("subscription");
      return () => clearTimeout(id);
    }
    if (checkout === "cancelled") {
      setFlash({ tone: "info", text: t("account.checkoutCancelled") });
      setTab("subscription");
    }
    if (upgrade) {
      setFlash({ tone: "info", text: upgradeFlash(upgrade, t) });
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
            <span className="font-[family-name:var(--font-display)] italic">{t("account.openingShelf")}</span>
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
  const { t } = useI18n();
  const items: { id: Tab; label: string; sub: string; icon: string }[] = [
    { id: "profile",      label: t("account.navProfile"),      sub: t("account.navProfileSub"),      icon: "✦" },
    { id: "profiles",     label: t("account.navProfiles"),     sub: t("account.navProfilesSub"),     icon: "❋" },
    { id: "subscription", label: t("account.navSubscription"), sub: t("account.navSubscriptionSub"), icon: "❀" },
    { id: "lumi",         label: t("account.navLumi"),         sub: t("account.navLumiSub"),         icon: "🦉" },
    { id: "security",     label: t("account.navSecurity"),     sub: t("account.navSecuritySub"),     icon: "◇" },
    { id: "danger",       label: t("account.navDanger"),       sub: t("account.navDangerSub"),       icon: "⌫" },
  ];

  return (
    <div className="card-paper-lifted relative overflow-hidden p-3">
      {/* Library-card header */}
      <div className="mb-3 rounded-2xl bg-gradient-to-br from-[#FFFCF3] to-[#F5E9CD] p-4 ring-1 ring-[color:var(--color-border)]">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[color:var(--color-saffron-deep)]">
          {t("account.readerCardKicker")}
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
        {t("account.needHelp")}{" "}
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
      eyebrow={t("account.profileEyebrow")}
      title={t("account.profileTitle")}
      lede={t("account.profileLede")}
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
            {t("account.publicProfileKicker")}
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-[1.05rem] font-semibold leading-tight text-[color:var(--color-ink)]">
            {t("account.publicProfileTitle")}
          </p>
          <p className="mt-0.5 text-[0.84rem] leading-snug text-[color:var(--color-ink-soft)]">
            {t("account.publicProfileDesc")}
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
          <Field label={t("account.nameLabel")}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="paper-input"
              placeholder={t("account.namePlaceholder")}
            />
          </Field>
          <Field label={t("account.emailLabel")}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="paper-input"
            />
            <span className="mt-1 text-[0.7rem] text-[color:var(--color-ink-soft)]">
              {t("account.emailReverifyNote")}
            </span>
          </Field>
          <Field label={t("account.languageLabel")}>
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
          <Field label={t("account.familySafeLabel")}>
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
                    {t("account.familySafeName")}
                  </span>
                  <span className="rounded-full bg-[color:var(--color-coral)]/15 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.08em] text-[color:var(--color-coral-deep)]">
                    {t("account.familyPlanBadge")}
                  </span>
                </span>
                <span className="mt-1 block text-[0.72rem] leading-snug text-[color:var(--color-ink-soft)]">
                  {t("account.familySafeDesc")}
                </span>
              </span>
            </label>
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex h-12 items-center justify-center gap-2 self-start rounded-full bg-[color:var(--color-ink)] px-7 font-semibold text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4)] transition-transform hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? t("account.saving") : t("account.saveReaderCard")}
          </button>
        </div>

        {/* Card preview */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <div className="relative rotate-[1deg] rounded-[1.6rem] border-[1.5px] border-[color:var(--color-border-strong)] bg-gradient-to-br from-[#FFFCF3] to-[#F0DCB6] p-7 shadow-[var(--shadow-paper-lg)] transition-transform hover:rotate-0">
            <div aria-hidden className="absolute -top-3 left-8 -rotate-[6deg]">
              <span className="rounded-[2px] bg-[color:var(--color-coral)]/55 px-3 py-1 text-[0.55rem] font-bold uppercase tracking-[0.2em] text-[color:var(--color-coral-deep)] shadow-[0_2px_4px_rgba(60,40,15,0.15)]">
                {t("account.memberSince", { year: String(new Date().getFullYear()) })}
              </span>
            </div>

            <p className="text-[0.6rem] font-bold uppercase tracking-[0.28em] text-[color:var(--color-saffron-deep)]">
              {t("account.readerCardKicker")}
            </p>
            <h3 className="mt-3 font-[family-name:var(--font-display)] text-[2rem] font-semibold leading-[1.05] tracking-tight text-[color:var(--color-ink)]">
              {name || <em className="text-[color:var(--color-ink-soft)]">{t("account.yourName")}</em>}
            </h3>

            <div className="mt-5 flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[color:var(--color-ink)] font-[family-name:var(--font-display)] text-[1.6rem] font-semibold text-[color:var(--color-paper)] shadow-[0_4px_10px_rgba(20,16,8,0.35)]">
                {initial}
              </span>
              <div>
                <p className="text-[0.78rem] font-semibold text-[color:var(--color-ink)]">{email}</p>
                <p className="text-[0.7rem] text-[color:var(--color-ink-soft)]">
                  {t("account.readsIn")}{" "}
                  <strong className="text-[color:var(--color-ink)]">
                    {LOCALES.find((l) => l.code === language)?.label ?? language}
                  </strong>
                </p>
              </div>
            </div>

            <div className="mt-7 flex items-end justify-between border-t border-dashed border-[color:var(--color-border-strong)] pt-3">
              <p className="font-[family-name:var(--font-display)] text-[0.65rem] italic leading-snug text-[color:var(--color-ink-soft)]">
                {t("account.cardMottoLine1")}<br />{t("account.cardMottoLine2")}
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
  const { t, tn } = useI18n();
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
            text: err instanceof ApiError ? err.message : t("account.errLoadProfiles"),
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
      setFlash({ tone: "success", text: t("account.readerSwitched") });
      // Force a fresh load of book/highlight context in case a child profile
      // is now active (the chat / quiz routes resolve family-safe per request,
      // but it's nice for the picker label to update everywhere).
      router.refresh();
    } catch (err) {
      setFlash({
        tone: "error",
        text: err instanceof ApiError ? err.message : t("account.errSwitchReader"),
      });
    } finally {
      setBusy(null);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm(t("account.confirmDeleteProfile"))) {
      return;
    }
    setBusy(id);
    try {
      await deleteProfileRequest(id);
      setProfiles((prev) => prev?.filter((p) => p.id !== id) ?? null);
      if (user.active_profile_id === id) {
        setUser({ ...user, active_profile_id: null });
      }
      setFlash({ tone: "success", text: t("account.profileRemoved") });
    } catch (err) {
      setFlash({
        tone: "error",
        text: err instanceof ApiError ? err.message : t("account.errDeleteProfile"),
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
      setFlash({ tone: "success", text: t("account.readerJoined", { name: created.name }) });
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setFlash({
          tone: "info",
          text: t("account.readerLimitReached"),
        });
      } else {
        setFlash({
          tone: "error",
          text: err instanceof ApiError ? err.message : t("account.errAddReader"),
        });
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <SectionShell
      eyebrow={t("account.profilesEyebrow")}
      title={t("account.profilesTitle")}
      lede={
        quota > 1
          ? t("account.profilesLedeQuota", { quota: String(quota) })
          : t("account.profilesLedeFamily")
      }
    >
      {profiles === null ? (
        <p className="text-[color:var(--color-ink-soft)]">{t("account.loadingProfiles")}</p>
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
                  <strong className="text-[color:var(--color-ink)]">{t("account.oneReaderTitle")}</strong>{" "}
                  {t("account.oneReaderUpgrade")}
                </>
              ) : (
                <>{t("account.slotsFilled", { quota: String(quota) })}</>
              )}
            </div>
          ) : (
            <form
              onSubmit={onCreate}
              className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-5 shadow-[var(--shadow-paper)]"
            >
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[color:var(--color-saffron-deep)]">
                {tn("account.addReaderSlots", remaining)}
              </p>
              <h4 className="mt-1 font-[family-name:var(--font-display)] text-[1.4rem] font-semibold text-[color:var(--color-ink)]">
                {t("account.whoJoining")}
              </h4>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
                <Field label={t("account.readerNameLabel")}>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="paper-input"
                    placeholder={t("account.readerNamePlaceholder")}
                    maxLength={60}
                    required
                  />
                </Field>
                <Field label={t("account.readerKindLabel")}>
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
                          {k === "adult" ? t("account.readerKindAdult") : t("account.readerKindChild")}
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
                    {creating ? t("account.adding") : t("account.addReader")}
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <Field label={t("account.avatarLabel")}>
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
  const { t } = useI18n();
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
          {t("account.currentlyReading")}
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
            {profile.kind === "child" ? t("account.kindChildLabel") : t("account.kindAdultLabel")}
            {profile.is_default && t("account.defaultSuffix")}
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
          {active ? t("account.selected") : busy ? t("account.switching") : t("account.switchToReader")}
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            aria-label={t("account.deleteProfileAria", { name: profile.name })}
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
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(AVATAR_EMOJI).map(([seed, emoji]) => {
        const sel = value === seed;
        return (
          <button
            key={seed}
            type="button"
            onClick={() => onChange(seed)}
            aria-label={t("account.avatarAria", { seed })}
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
  const { t, tn } = useI18n();
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
        text: err instanceof ApiError ? err.message : t("account.errCheckout"),
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
        text: err instanceof ApiError ? err.message : t("account.errPortal"),
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
      eyebrow={t("account.subEyebrow")}
      title={t("account.subTitle")}
      lede={t("account.subLede")}
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
                  ↻ {t("account.endsAtPeriodEnd")}
                </span>
              )}
            </div>
            <h3 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2.2rem,4.5vw,3.4rem)] font-semibold leading-[1.05] tracking-tight">
              {planName(sub.plan)}
              {sub.cycle && (
                <span className="ml-3 text-[1rem] font-normal italic text-[color:var(--color-ink-soft)]">
                  / {sub.cycle === "yearly" ? t("account.cycleYearly") : t("account.cycleMonthly")}
                </span>
              )}
            </h3>
            {sub.current_period_end && (
              <p className="mt-2 text-[0.92rem] text-[color:var(--color-ink-soft)]">
                {sub.cancel_at_period_end ? t("account.accessEnds") : t("account.renews")}{" "}
                <strong className="text-[color:var(--color-ink)]">
                  {formatDate(sub.current_period_end)}
                </strong>
              </p>
            )}
            {sub.trial_end && new Date(sub.trial_end) > new Date() && (
              <p className="mt-2 text-[0.92rem] text-[color:var(--color-saffron-deep)]">
                ✦ {t("account.trialEnds", { date: formatDate(sub.trial_end) })}
              </p>
            )}

            {/* Quota meter */}
            <div className="mt-6">
              <div className="flex items-baseline justify-between">
                <span className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[color:var(--color-ink-soft)]">
                  {t("account.pagesThisPeriod")}
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
                  ⚠ {t("account.usageWarning", { pct: String(pct) })}{" "}
                  <button
                    type="button"
                    onClick={() => document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" })}
                    className="font-semibold underline decoration-[color:var(--color-coral)] decoration-2 underline-offset-2"
                  >
                    {t("account.usageUpgradeCta")}
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
                {busy === "portal" ? t("account.openingStripe") : t("account.manageInStripe")}
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
              {busy === "refresh" ? t("account.refreshing") : t("account.refreshStatus")}
            </button>
          </div>
        </div>

        {/* Quota chips */}
        <div className="relative mt-7 flex flex-wrap gap-2">
          <Chip on={sub.quota.chat_with_citations}>{t("account.featChatCitations")}</Chip>
          <Chip on={sub.quota.literary_translation}>{t("account.featLiteraryTranslation")}</Chip>
          <Chip on={sub.quota.annotated_export}>{t("account.featAnnotatedExport")}</Chip>
          <Chip on={sub.quota.priority_queue}>{t("account.featPriorityQueue")}</Chip>
          <Chip on={sub.quota.family_safe_mode}>{t("account.featKidSafe")}</Chip>
          <Chip on={sub.quota.profiles > 1}>{tn("account.featProfiles", sub.quota.profiles)}</Chip>
        </div>
      </div>

      {/* Plan options — passport stamps */}
      <div id="plans" className="mt-12">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="badge-pill bg-[color:var(--color-paper-3)] text-[color:var(--color-ink-soft)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-saffron)]" />
              {isSubscriber ? t("account.changePlan") : t("account.choosePlan")}
            </span>
            <h3 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.7rem,3vw,2.2rem)] font-semibold leading-tight tracking-tight">
              {isSubscriber ? t("account.changePlanHeading") : t("account.choosePlanHeading")}
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
  const { t } = useI18n();
  const map: Record<Subscription["status"], { label: string; bg: string; text: string; dot: string }> = {
    inactive: {
      label: t("account.statusInactive"),
      bg: "bg-[color:var(--color-paper-3)]",
      text: "text-[color:var(--color-ink-soft)]",
      dot: "bg-[color:var(--color-ink-soft)]",
    },
    trialing: {
      label: t("account.statusTrialing"),
      bg: "bg-[color:var(--color-saffron)]/25",
      text: "text-[color:var(--color-saffron-deep)]",
      dot: "bg-[color:var(--color-saffron)]",
    },
    active: {
      label: t("account.statusActive"),
      bg: "bg-[color:var(--color-sage)]/25",
      text: "text-[color:var(--color-sage-deep)]",
      dot: "bg-[color:var(--color-sage)]",
    },
    past_due: {
      label: t("account.statusPastDue"),
      bg: "bg-[color:var(--color-coral)]/25",
      text: "text-[color:var(--color-coral-deep)]",
      dot: "bg-[color:var(--color-coral)]",
    },
    canceled: {
      label: t("account.statusCanceled"),
      bg: "bg-[color:var(--color-paper-3)]",
      text: "text-[color:var(--color-ink-soft)]",
      dot: "bg-[color:var(--color-ink-soft)]",
    },
    unpaid: {
      label: t("account.statusUnpaid"),
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
  const { t } = useI18n();
  return (
    <div className="relative inline-flex items-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-1 shadow-[0_1px_0_rgba(74,60,30,0.05)]">
      <button
        type="button"
        onClick={() => setCycle("monthly")}
        className={`relative z-10 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
          cycle === "monthly" ? "text-[color:var(--color-paper)]" : "text-[color:var(--color-ink-soft)]"
        }`}
      >
        {t("account.monthly")}
      </button>
      <button
        type="button"
        onClick={() => setCycle("yearly")}
        className={`relative z-10 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
          cycle === "yearly" ? "text-[color:var(--color-paper)]" : "text-[color:var(--color-ink-soft)]"
        }`}
      >
        {t("account.yearly")}
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
  const { t } = useI18n();
  const isCurrent = currentPlan === plan;
  const price = PLAN_PRICES[plan][cycle];

  const features: Record<typeof plan, string[]> = {
    reader: [
      t("account.featReaderPages"),
      t("account.featReaderLanguages"),
      t("account.featReaderSideBySide"),
      t("account.featReaderChat"),
      t("account.featReaderQuiz"),
    ],
    scholar: [
      t("account.featScholarUnlimited"),
      t("account.featScholarLiterary"),
      t("account.featScholarPriority"),
      t("account.featScholarExport"),
      t("account.featScholarVocab"),
    ],
    family: [
      t("account.featFamilyEverything"),
      t("account.featFamilyProfiles"),
      t("account.featFamilyKidSafe"),
      t("account.featFamilyDashboard"),
    ],
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
  const tone = tones[plan];

  return (
    <div
      className={`relative ${tilt} flex flex-col rounded-[1.4rem] border-[1.5px] ${tone.ring} ${tone.bg} p-6 shadow-[var(--shadow-paper)] transition-transform duration-300 hover:rotate-0 hover:-translate-y-1`}
    >
      {best && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 -rotate-[3deg]">
          <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-coral)] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white shadow-[0_8px_18px_-6px_rgba(197,89,77,0.55)]">
            ★ {t("account.mostLoved")}
          </span>
        </div>
      )}
      {isCurrent && (
        <div className="absolute -top-3 right-4">
          <span className="rounded-full bg-[color:var(--color-ink)] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[color:var(--color-paper)]">
            ✓ {t("account.currentBadge")}
          </span>
        </div>
      )}

      <span className={`badge-pill ${tone.chip} ${tone.chipText}`}>{planName(plan)}</span>

      <div className="mt-5 flex items-baseline gap-1">
        <span className="font-[family-name:var(--font-display)] text-[2.6rem] font-semibold leading-none tracking-tight">
          €{price}
        </span>
        <span className="text-sm text-[color:var(--color-ink-soft)]">{t("account.perMonth")}</span>
      </div>
      <p className="mt-1 text-xs text-[color:var(--color-ink-soft)]">
        {cycle === "yearly" ? t("account.billedYearly", { total: String(price * 12) }) : t("account.billedMonthly")}
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
          ? t("account.redirecting")
          : isCurrent
            ? t("account.yourCurrentPlan")
            : currentPlan === "free"
              ? t("account.becomePlan", { plan: planName(plan) })
              : t("account.switchToPlan", { plan: planName(plan) })}
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
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setFlash({ tone: "error", text: t("account.passwordsMismatch") });
      return;
    }
    if (password.length < 8) {
      setFlash({ tone: "error", text: t("account.passwordTooShort") });
      return;
    }
    setSubmitting(true);
    try {
      await updateProfile({ password });
      setFlash({ tone: "success", text: t("account.passwordUpdated") });
      setPassword("");
      setConfirm("");
    } catch (err) {
      setFlash({
        tone: "error",
        text: err instanceof ApiError ? err.message : t("account.errUpdatePassword"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SectionShell
      eyebrow={t("account.securityEyebrow")}
      title={t("account.securityTitle")}
      lede={t("account.securityLede")}
    >
      <form onSubmit={onSubmit} className="grid max-w-lg gap-5">
        <Field label={t("account.newPasswordLabel")}>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="paper-input"
            placeholder={t("account.newPasswordPlaceholder")}
            autoComplete="new-password"
          />
        </Field>
        <Field label={t("account.confirmPasswordLabel")}>
          <input
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="paper-input"
            placeholder={t("account.confirmPasswordPlaceholder")}
            autoComplete="new-password"
          />
        </Field>
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 inline-flex h-12 items-center justify-center gap-2 self-start rounded-full bg-[color:var(--color-ink)] px-7 font-semibold text-[color:var(--color-paper)] shadow-[0_2px_0_rgba(20,16,8,0.4)] transition-transform hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? t("account.updating") : t("account.updatePassword")}
        </button>
      </form>
    </SectionShell>
  );
}

/* ─────────────────────── Lumi & Progress ─────────────────────── */

function LumiSection() {
  const { t, tn } = useI18n();
  const { progress } = useLumi();
  const xpInfo = xpToNextLevel(progress);
  const title = LEVEL_TITLES[progress.level];
  const allLevels = [1, 2, 3, 4, 5] as const;

  return (
    <SectionShell
      eyebrow={t("account.lumiEyebrow")}
      title={t("account.lumiTitle")}
      lede={t("account.lumiLede")}
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
              {t("account.levelTitle", { level: String(progress.level), title })}
            </p>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-[clamp(1.6rem,3vw,2.2rem)] font-semibold leading-tight tracking-tight">
              {progress.xp.toLocaleString()}{" "}
              <span className="text-[color:var(--color-ink-soft)]">{t("account.xp")}</span>
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-ink-soft)]">
              {xpInfo
                ? t("account.xpToNextLevel", {
                    needed: xpInfo.needed.toLocaleString(),
                    level: String(progress.level + 1),
                  })
                : t("account.highestRank")}
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
                  {t("account.xpProgress", { xp: String(progress.xp), next: String(xpInfo.next) })}
                </p>
              )}
            </div>

            {/* Streak */}
            {progress.streakDays > 0 && (
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-coral)]/15 px-3 py-1 text-[12px] font-semibold text-[color:var(--color-coral-deep)]">
                <span aria-hidden>🔥</span>
                <span>{tn("account.dayStreak", progress.streakDays)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Level ladder */}
      <div className="mt-6 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-paper)]/60 p-5">
        <h4 className="mb-4 font-[family-name:var(--font-display)] text-[1.1rem] font-semibold tracking-tight">
          {t("account.theLadder")}
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
                    {t("account.ladderLevel", { level: String(lv) })}
                  </p>
                  <p className="text-[0.65rem] leading-tight text-[color:var(--color-ink-soft)]">
                    {LEVEL_TITLES[lv]}
                  </p>
                  <p className="mt-0.5 font-mono text-[0.62rem] tabular-nums text-[color:var(--color-ink-soft)]/70">
                    {t("account.xpAmount", { xp: String(threshold) })}
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
            {t("account.achievements")}
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
                  {t("account.xpReward", { xp: String(ach.xp) })}
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
  const { t } = useI18n();
  const [confirm, setConfirm] = useState("");
  const matches = confirm === user.email;

  return (
    <SectionShell
      eyebrow={t("account.dangerEyebrow")}
      title={t("account.dangerTitle")}
      lede={t("account.dangerLede")}
    >
      <div className="rounded-[1.4rem] border-[1.5px] border-[color:var(--color-coral-deep)]/40 bg-[color:var(--color-coral)]/8 p-7 shadow-[var(--shadow-paper)]">
        <h3 className="font-[family-name:var(--font-display)] text-[1.4rem] font-semibold tracking-tight text-[color:var(--color-coral-deep)]">
          {t("account.deleteAccountHeading")}
        </h3>
        <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-[color:var(--color-ink-soft)]">
          {t("account.deleteAccountIntro")}{" "}
          <strong className="text-[color:var(--color-ink)]">{t("account.manageInStripe")}</strong>{" "}
          {t("account.deleteAccountOutro")}
        </p>
        <div className="mt-5 grid max-w-md gap-3">
          <input
            type="email"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="paper-input"
            placeholder={user.email}
            aria-label={t("account.confirmEmailAria")}
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
            {t("account.permanentlyDelete")}
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
  const { t } = useI18n();
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
        aria-label={t("account.dismiss")}
      >
        ×
      </button>
    </div>
  );
}

function Stamp({ tone }: { tone: "active" | "trial" | "free" | "warn" }) {
  const { t } = useI18n();
  // Decorative wax-stamp seal in the page corner — matches active state.
  const colors = {
    active: { fg: "var(--color-sage-deep)", bg: "rgba(123,161,124,0.18)", label: `✓ ${t("account.stampReading")}` },
    trial: { fg: "var(--color-saffron-deep)", bg: "rgba(224,164,88,0.20)", label: `✦ ${t("account.stampTrial")}` },
    warn: { fg: "var(--color-coral-deep)", bg: "rgba(226,120,108,0.18)", label: `! ${t("account.stampAttend")}` },
    free: { fg: "rgba(74,82,99,0.6)", bg: "rgba(74,82,99,0.08)", label: t("account.stampFree") },
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

function upgradeFlash(
  reason: string,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  switch (reason) {
    case "pages":
    case "books":   // legacy alias from older links
    case "quota":   // legacy alias from older links
      return t("account.upgradePages");
    case "quizzes":
      return t("account.upgradeQuizzes");
    case "chat":
      return t("account.upgradeChat");
    case "translate":
      return t("account.upgradeTranslate");
    case "no_plan":
      return t("account.upgradeNoPlan");
    case "trial":
      return t("account.upgradeTrial");
    default:
      return t("account.upgradeDefault");
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
