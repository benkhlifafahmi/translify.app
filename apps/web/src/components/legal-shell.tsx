import Link from "next/link";

interface Props {
  title: string;
  subtitle?: string;
  lastUpdated: string; // ISO date "YYYY-MM-DD"
  children: React.ReactNode;
}

export function LegalShell({ title, subtitle, lastUpdated, children }: Props) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 lg:py-20">
      <nav className="mb-10 text-sm text-[color:var(--color-ink-soft)]">
        <Link href="/" className="hover:text-[color:var(--color-ink)]">
          ← Back home
        </Link>
      </nav>

      <header className="mb-12 border-b border-[color:var(--color-border)] pb-8">
        <span className="badge-pill bg-[color:var(--color-paper-3)] text-[color:var(--color-ink-soft)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-saffron)]" />
          Legal
        </span>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2rem,4vw,2.8rem)] font-semibold leading-tight tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 text-[color:var(--color-ink-soft)]">
            {subtitle}
          </p>
        )}
        <p className="mt-4 text-xs text-[color:var(--color-ink-soft)]">
          Last updated: <time dateTime={lastUpdated}>{new Date(lastUpdated).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</time>
        </p>
      </header>

      <article className="prose-legal space-y-4 text-[0.98rem] leading-relaxed text-[color:var(--color-ink)]">
        {children}
      </article>

      <footer className="mt-16 border-t border-[color:var(--color-border)] pt-6 text-sm text-[color:var(--color-ink-soft)]">
        Questions? Email{" "}
        <a href="mailto:hello@translify.app" className="font-semibold text-[color:var(--color-saffron-deep)] underline decoration-[color:var(--color-saffron)]/40">
          hello@translify.app
        </a>
        .
      </footer>
    </main>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="!mt-10 font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
      {children}
    </h2>
  );
}

export function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="!mt-6 font-[family-name:var(--font-display)] text-base font-semibold tracking-tight">
      {children}
    </h3>
  );
}
