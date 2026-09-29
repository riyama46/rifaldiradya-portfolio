import type { MetadataRoute } from "next";
import { localePath, locales, publicRoutes } from "@/i18n";
import { getLastPublishedUpdate } from "@/lib/projects/queries";
import { languageAlternates, siteOrigin } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site-config";

// Rebuilt with the public pages: every 5 minutes at most, and on demand after an admin save.
export const revalidate = 300;

async function lastProjectUpdate(): Promise<Date | undefined> {
  try {
    return (await getLastPublishedUpdate()) ?? undefined;
  } catch (error) {
    // Without a database (CI build) the sitemap is still valid, only without lastmod for these pages.
    console.warn(`[sitemap] no lastmod for project pages: ${(error as Error).message}`);
    return undefined;
  }
}

/** PRD section 9: the 6 public URLs, each with hreflang alternates (en, id, x-default). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const projectsUpdated = await lastProjectUpdate();
  const privacyUpdated = new Date(`${siteConfig.privacyUpdated}T00:00:00Z`);

  return publicRoutes.flatMap((path) =>
    locales.map((lang) => ({
      url: `${origin}${localePath(path, lang)}`,
      lastModified: path === "/privacy" ? privacyUpdated : projectsUpdated,
      alternates: { languages: languageAlternates(path, origin) },
    })),
  );
}
