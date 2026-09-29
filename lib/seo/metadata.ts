import type { Metadata } from "next";
import { localePath, type Dictionary, type Locale } from "@/i18n";

// PRD section 9 / SDD section 7: per-page metadata for the public pages.

/** The one canonical origin (non-www, https). Only a deployment with exactly this SITE_URL is indexed. */
export const CANONICAL_ORIGIN = "https://rifaldiradya.com";

/**
 * Origin for absolute URLs (canonical, hreflang, OG, sitemap, JSON-LD). Falls back to the canonical
 * origin when SITE_URL is missing (e.g. a CI build), which is harmless because such a build is
 * never indexable (see isIndexable).
 */
export function siteOrigin(env: string | undefined = process.env.SITE_URL): string {
  try {
    return env ? new URL(env).origin : CANONICAL_ORIGIN;
  } catch {
    return CANONICAL_ORIGIN;
  }
}

/**
 * Search engines may index only the production site. devstaging and local builds send noindex and a
 * robots.txt that disallows everything, so the staging copy never competes with rifaldiradya.com.
 */
export const isIndexable = (env: string | undefined = process.env.SITE_URL) =>
  env === CANONICAL_ORIGIN;

const OG_LOCALE: Record<Locale, string> = { en: "en_US", id: "id_ID" };

/** hreflang map for a locale-free path: en, id, and x-default → English (PRD section 9). */
export function languageAlternates(path: string, origin = "") {
  return {
    en: `${origin}${localePath(path, "en")}`,
    id: `${origin}${localePath(path, "id")}`,
    "x-default": `${origin}${localePath(path, "en")}`,
  };
}

type PageSeo = { title: string; description: string };

export function buildMetadata({
  lang,
  path,
  page,
  dict,
}: {
  lang: Locale;
  /** Locale-free path: "/", "/work", "/privacy". */
  path: string;
  page: PageSeo;
  dict: Dictionary;
}): Metadata {
  const url = localePath(path, lang);
  const other: Locale = lang === "en" ? "id" : "en";
  const image = { url: `/og/${lang}.png`, width: 1200, height: 630, alt: dict.seo.ogAlt };

  return {
    metadataBase: new URL(siteOrigin()),
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type: "website",
      siteName: dict.seo.siteName,
      title: page.title,
      description: page.description,
      url,
      locale: OG_LOCALE[lang],
      alternateLocale: [OG_LOCALE[other]],
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [image],
    },
    robots: isIndexable() ? { index: true, follow: true } : { index: false, follow: false },
  };
}
