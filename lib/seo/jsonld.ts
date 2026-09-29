import { localePath, type Locale } from "@/i18n";
import type { PublicProject } from "@/lib/projects/public";
import { siteConfig } from "@/lib/site-config";

// Structured data (PRD section 9). Everything here must match what the page visibly shows.

type Json = Record<string, unknown>;

const inLanguage = (lang: Locale) => (lang === "id" ? "id-ID" : "en-US");
const ids = (origin: string) => ({ person: `${origin}/#person`, website: `${origin}/#website` });

/** Homepage: the person behind the site and the site itself. */
export function homeJsonLd(lang: Locale, origin: string): Json {
  const { person, website } = ids(origin);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": person,
        name: siteConfig.name,
        url: `${origin}${localePath("/", lang)}`,
        jobTitle: siteConfig.role,
        email: `mailto:${siteConfig.email}`,
        knowsAbout: ["Landing page development", "Web development", "Next.js"],
        sameAs: [siteConfig.social.linkedin],
      },
      {
        "@type": "WebSite",
        "@id": website,
        name: siteConfig.name,
        url: `${origin}${localePath("/", lang)}`,
        inLanguage: inLanguage(lang),
        publisher: { "@id": person },
      },
    ],
  };
}

/** Work page: the list of live projects shown on it. */
export function workJsonLd(
  lang: Locale,
  origin: string,
  title: string,
  projects: Pick<PublicProject, "title" | "liveUrl">[],
): Json {
  const { person, website } = ids(origin);
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    url: `${origin}${localePath("/work", lang)}`,
    inLanguage: inLanguage(lang),
    isPartOf: { "@id": website },
    author: { "@id": person },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: projects.map((project, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: project.title,
        url: project.liveUrl,
      })),
    },
  };
}

/**
 * Safe to put inside <script type="application/ld+json">: "<" is escaped so text from the admin
 * (project titles) can never close the script tag (SDD section 6, XSS).
 */
export function serializeJsonLd(data: Json): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
