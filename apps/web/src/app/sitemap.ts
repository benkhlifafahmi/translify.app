import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";

const LOCALES = ["en", "fr", "es", "de", "ja", "ar"] as const;

const PUBLIC_PATHS = [
  { path: "/",           priority: 1.0,  changeFrequency: "weekly" as const },
  { path: "/onboarding", priority: 0.9,  changeFrequency: "monthly" as const },
  { path: "/login",      priority: 0.4,  changeFrequency: "yearly" as const },
  { path: "/register",   priority: 0.4,  changeFrequency: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return PUBLIC_PATHS.map((p) => ({
    url: `${SITE}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
    alternates: {
      languages: Object.fromEntries(
        LOCALES.map((l) => [l, `${SITE}${p.path}?lang=${l}`]),
      ),
    },
  }));
}
