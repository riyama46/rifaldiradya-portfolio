import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import { getDictionary } from "@/i18n";
import { homeJsonLd, serializeJsonLd, workJsonLd } from "@/lib/seo/jsonld";
import {
  buildMetadata,
  CANONICAL_ORIGIN,
  isIndexable,
  languageAlternates,
  siteOrigin,
} from "@/lib/seo/metadata";

afterEach(() => vi.unstubAllEnvs());

describe("SEO copy (PRD section 9 limits)", () => {
  it.each(["en", "id"] as const)("%s meta never mentions availability (D-26)", (lang) => {
    const { seo } = getDictionary(lang);
    const text = JSON.stringify(seo).toLowerCase();
    for (const word of ["open to", "available", "terbuka untuk", "menerima"]) {
      expect(text).not.toContain(word);
    }
  });

  it.each(["en", "id"] as const)("%s titles ≤ 60 and descriptions ≤ 155 characters", (lang) => {
    const { seo } = getDictionary(lang);
    for (const page of [seo.home, seo.work, seo.privacy]) {
      expect(page.title.length).toBeLessThanOrEqual(60);
      expect(page.description.length).toBeLessThanOrEqual(155);
    }
  });
});

describe("buildMetadata", () => {
  const dict = getDictionary("id");
  const metadata = () => buildMetadata({ lang: "id", path: "/work", page: dict.seo.work, dict });

  it("canonical points to the page itself, hreflang both ways + x-default to English", () => {
    const { alternates } = metadata();
    expect(alternates?.canonical).toBe("/id/work");
    expect(alternates?.languages).toEqual({ en: "/work", id: "/id/work", "x-default": "/work" });
  });

  it("Open Graph uses the page's locale, the other as alternate, and the locale's image", () => {
    const { openGraph, twitter, title } = metadata();
    expect(title).toEqual({ absolute: dict.seo.work.title });
    expect(openGraph).toMatchObject({
      locale: "id_ID",
      alternateLocale: ["en_US"],
      url: "/id/work",
      images: [{ url: "/og/id.png", width: 1200, height: 630 }],
    });
    expect(twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("absolute URLs come from SITE_URL", () => {
    vi.stubEnv("SITE_URL", "https://devstaging.rifaldiradya.com");
    expect(String(metadata().metadataBase)).toBe("https://devstaging.rifaldiradya.com/");
    expect(languageAlternates("/", "https://x.test")).toEqual({
      en: "https://x.test/",
      id: "https://x.test/id",
      "x-default": "https://x.test/",
    });
  });
});

describe("indexing only on the production domain", () => {
  it("indexes rifaldiradya.com and nothing else (devstaging, local, missing env)", () => {
    expect(isIndexable(CANONICAL_ORIGIN)).toBe(true);
    for (const env of ["https://devstaging.rifaldiradya.com", "http://localhost:3000", undefined]) {
      expect(isIndexable(env)).toBe(false);
    }
    expect(siteOrigin(undefined)).toBe(CANONICAL_ORIGIN);
    expect(siteOrigin("not a url")).toBe(CANONICAL_ORIGIN);
  });

  it("robots.txt: production allows all but /admin and /api, with the sitemap", () => {
    vi.stubEnv("SITE_URL", CANONICAL_ORIGIN);
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
      sitemap: "https://rifaldiradya.com/sitemap.xml",
      host: "https://rifaldiradya.com",
    });
  });

  it("robots.txt: staging disallows everything", () => {
    vi.stubEnv("SITE_URL", "https://devstaging.rifaldiradya.com");
    expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });

  it("pages send noindex outside production", () => {
    vi.stubEnv("SITE_URL", "https://devstaging.rifaldiradya.com");
    const dict = getDictionary("en");
    const { robots: meta } = buildMetadata({ lang: "en", path: "/", page: dict.seo.home, dict });
    expect(meta).toEqual({ index: false, follow: false });
  });
});

describe("JSON-LD", () => {
  const origin = "https://rifaldiradya.com";

  it("homepage: Person (with LinkedIn and GitHub) + WebSite in the page language", () => {
    const data = homeJsonLd("id", origin) as { "@graph": Record<string, unknown>[] };
    const [person, website] = data["@graph"];
    expect(person).toMatchObject({
      "@type": "Person",
      name: "Rifaldi Radya Pratama",
      jobTitle: "HR Automation Engineer",
      url: "https://rifaldiradya.com/id",
      knowsAbout: [
        "HR automation",
        "n8n",
        "LLM integration",
        "Google Workspace",
        "Power Automate",
        "HRMS",
        "C#",
        "ASP.NET",
        "SQL Server",
      ],
      // GitHub is empty, so only LinkedIn (D-19, AC-13).
      sameAs: ["https://www.linkedin.com/in/rifaldiradya", "https://github.com/riyama46"],
    });
    expect(website).toMatchObject({ "@type": "WebSite", inLanguage: "id-ID" });
    // D-41: the employer is named only in About and the CV, never in structured data.
    expect(person).not.toHaveProperty("worksFor");
  });

  it("work page: an ItemList of the projects in page order", () => {
    const data = workJsonLd("en", origin, "Work", [
      { title: "Clinic", slug: "clinic", liveUrl: "https://a.example" },
      { title: "Coffee", slug: "coffee", liveUrl: "https://b.example" },
    ]);
    expect(data).toMatchObject({
      "@type": "CollectionPage",
      url: "https://rifaldiradya.com/work",
      mainEntity: {
        itemListElement: [
          { position: 1, name: "Clinic", url: "https://a.example" },
          { position: 2, name: "Coffee", url: "https://b.example" },
        ],
      },
    });
  });

  it("work page: a project without a site points at its case row (Delta PRD section 9)", () => {
    const data = workJsonLd("id", origin, "Karya", [
      { title: "HR System", slug: "hr-system", liveUrl: null },
    ]);
    expect(data).toMatchObject({
      mainEntity: {
        itemListElement: [{ url: "https://rifaldiradya.com/id/work#case-hr-system" }],
      },
    });
  });

  it("escapes < so a project title can never close the script tag", () => {
    const data = workJsonLd("en", origin, "Work", [
      { title: "</script><script>alert(1)</script>", slug: "x", liveUrl: "https://a.example" },
    ]);
    const json = serializeJsonLd(data);
    expect(json).not.toContain("</script>");
    expect(JSON.parse(json)).toEqual(data);
  });
});
