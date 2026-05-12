// Replaces: apps/web/src/app/sitemap.ts
//
// Adds the 56 language-pair pages + the 4 competitor-alternative pages to
// the sitemap. Goes from 4 indexed URLs → 64. Every page has proper
// hreflang alternates for all 8 UI locales.

import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "./blog/_posts";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";

const LOCALES = ["en", "fr", "es", "de", "ja", "ar", "id", "ms"] as const;

const LANG_SLUGS = [
  "english", "spanish", "french", "german",
  "japanese", "arabic", "indonesian", "malay",
] as const;

const COMPETITORS = ["readlang", "immersive-translate", "kindle-translate", "deepl"] as const;

const STATIC_PATHS = [
  { path: "/",               priority: 1.0,  changeFrequency: "weekly"  as const },
  { path: "/pricing",        priority: 0.95, changeFrequency: "monthly" as const },
  { path: "/join",           priority: 0.95, changeFrequency: "monthly" as const },
  { path: "/onboarding",     priority: 0.9,  changeFrequency: "monthly" as const },
  { path: "/languages",      priority: 0.8,  changeFrequency: "monthly" as const },
  { path: "/blog",           priority: 0.8,  changeFrequency: "weekly"  as const },
  { path: "/manifesto",      priority: 0.7,  changeFrequency: "monthly" as const },
  { path: "/contact",        priority: 0.6,  changeFrequency: "yearly"  as const },
  { path: "/privacy",        priority: 0.4,  changeFrequency: "yearly"  as const },
  { path: "/terms",          priority: 0.4,  changeFrequency: "yearly"  as const },
  { path: "/cookies",        priority: 0.3,  changeFrequency: "yearly"  as const },
  { path: "/refund-policy",  priority: 0.4,  changeFrequency: "yearly"  as const },
  { path: "/login",          priority: 0.3,  changeFrequency: "yearly"  as const },
  { path: "/register",       priority: 0.3,  changeFrequency: "yearly"  as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const langAlternates = (path: string) =>
    Object.fromEntries(LOCALES.map((l) => [l, `${SITE}${path}?lang=${l}`]));

  // Static landing pages
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: `${SITE}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
    alternates: { languages: langAlternates(p.path) },
  }));

  // 56 programmatic language-pair pages
  const langPairEntries: MetadataRoute.Sitemap = [];
  for (const source of LANG_SLUGS) {
    for (const target of LANG_SLUGS) {
      if (source === target) continue;
      const path = `/read/${source}/in/${target}`;
      langPairEntries.push({
        url: `${SITE}${path}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: { languages: langAlternates(path) },
      });
    }
  }

  // Competitor alternative pages
  const competitorEntries: MetadataRoute.Sitemap = COMPETITORS.map((slug) => {
    const path = `/alternative/${slug}`;
    return {
      url: `${SITE}${path}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
      alternates: { languages: langAlternates(path) },
    };
  });

  // Blog posts
  const blogEntries: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => {
    const path = `/blog/${post.slug}`;
    return {
      url: `${SITE}${path}`,
      lastModified: new Date(post.modifiedAt ?? post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.75,
      alternates: { languages: langAlternates(path) },
    };
  });

  return [...staticEntries, ...blogEntries, ...langPairEntries, ...competitorEntries];
}
