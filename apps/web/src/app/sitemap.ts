import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "./blog/_posts";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";

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

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: `${SITE}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  const langPairEntries: MetadataRoute.Sitemap = [];
  for (const source of LANG_SLUGS) {
    for (const target of LANG_SLUGS) {
      if (source === target) continue;
      langPairEntries.push({
        url: `${SITE}/read/${source}/in/${target}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  const competitorEntries: MetadataRoute.Sitemap = COMPETITORS.map((slug) => ({
    url: `${SITE}/alternative/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  const blogEntries: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${SITE}/blog/${post.slug}`,
    lastModified: new Date(post.modifiedAt ?? post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  return [...staticEntries, ...blogEntries, ...langPairEntries, ...competitorEntries];
}
