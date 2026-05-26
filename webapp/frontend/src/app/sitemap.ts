import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/data/blog-articles";
import { routing } from "@/i18n/routing";

const SITE_URL = "https://www.alin-africa.com";

// Chemins statiques (sans préfixe de locale ; FR = défaut sans préfixe).
const STATIC_PATHS = [
  "",
  "/a-propos",
  "/manifeste",
  "/blog",
  "/contacts",
  "/ressources",
  "/mentions-legales",
  "/confidentialite",
  "/cgu",
];

function url(locale: string, path: string): string {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${SITE_URL}${prefix}${path}`;
}

function alternates(path: string) {
  return {
    languages: Object.fromEntries(
      routing.locales.map((locale) => [locale, url(locale, path)]),
    ),
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    ...STATIC_PATHS,
    ...getAllSlugs().map((slug) => `/blog/${slug}`),
  ];

  return paths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: url(locale, path),
      lastModified: new Date(),
      alternates: alternates(path),
    })),
  );
}
