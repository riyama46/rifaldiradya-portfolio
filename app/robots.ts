import type { MetadataRoute } from "next";
import { isIndexable, siteOrigin } from "@/lib/seo/metadata";

export const revalidate = 300;

/**
 * Production: everything except the admin and the API, AI crawlers included (PRD section 9).
 * Any other deployment (devstaging, local) disallows everything so it is never indexed.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable()) return { rules: { userAgent: "*", disallow: "/" } };

  const origin = siteOrigin();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
