# Inner-route metadata rewrites

Drop these into each route's `page.tsx` as a top-level `metadata` export.
The root `template: "%s · Translify"` from `layout.tsx` automatically suffixes
the brand, so titles below are the bare strings before " · Translify".

---

## `/onboarding`

```ts
export const metadata: Metadata = {
  title: "Get started — set up your reading library in 60 seconds",
  description:
    "Sign up free, pick your reading style, and Translify tailors your library — for students, researchers, lifelong readers, or parents reading with kids.",
  alternates: { canonical: "/onboarding" },
  openGraph: {
    title: "Get started with Translify",
    description:
      "Set up your reading library in under a minute. 14-day free trial, 30-day money-back.",
    url: "https://translify.app/onboarding",
    images: [{ url: "/og-onboarding.png", width: 1200, height: 630, alt: "Translify onboarding" }],
  },
  // Onboarding is a conversion page — index it (default).
};
```

---

## `/login`

```ts
export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your Translify library.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true }, // No SEO value; prevent duplicate indexing.
};
```

---

## `/register`

```ts
export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Sign up for Translify. Free 14-day trial, no credit card required, 30-day money-back guarantee.",
  alternates: { canonical: "/register" },
};
```

---

## `/library` and `/library/[bookId]`

Already disallowed in robots.txt — correct. Leave noindex.

```ts
// apps/web/src/app/library/layout.tsx (new file)
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
```

---

## `/account`

```ts
export const metadata: Metadata = {
  title: "Account & billing",
  description: "Manage your Translify subscription, billing, and reading preferences.",
  robots: { index: false, follow: false },
};
```

---

## `/manifesto` (currently 404 — create this page)

```ts
export const metadata: Metadata = {
  title: "Why we built Translify",
  description:
    "Translify exists because reading should not stop at language. Our manifesto: who we are, what we believe about reading, and how AI changes what's possible.",
  alternates: { canonical: "/manifesto" },
  openGraph: {
    type: "article",
    title: "Why we built Translify",
    description:
      "Reading should not stop at language. Here's what we believe.",
    images: [{ url: "/og-manifesto.png", width: 1200, height: 630 }],
  },
};
```

This page is **critical** for GEO/E-E-A-T — without it, Translify has no
"who we are" signal that AI search engines can cite. Build it before
ranking matters.

---

## `/languages` (new index page for the 56 programmatic pages)

```ts
export const metadata: Metadata = {
  title: "All supported languages",
  description:
    "Translify supports 14 target languages across 56 source→target pairs. Read Spanish books in English, German books in French, Japanese books in Arabic, and 53 other combinations — every one with the original layout preserved.",
  alternates: { canonical: "/languages" },
};
```

The page itself should be a clean grid listing every supported pair with
links to the corresponding `/read-{source}-books-in-{target}` page. This
gives the 56 programmatic pages a hub page with proper internal linking
(which Google strongly weights).
