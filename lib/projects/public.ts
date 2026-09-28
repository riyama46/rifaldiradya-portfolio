import type { Locale } from "@/i18n";
import type { Project } from "@/lib/db/schema";

/** Public DTO per locale (App Flow section 9). Never contains draft-only or admin fields. */
export type PublicProject = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  liveUrl: string;
  /** Host shown in the hero browser frame, e.g. "staging0.rifaldiradya.com". */
  liveHost: string;
  tags: string[];
  thumbnail: { url: string; width: number; height: number; alt: string } | null;
  featured: boolean;
};

export const HERO_PANEL_LIMIT = 3;
export const HOMEPAGE_GRID_LIMIT = 6;

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function toPublicProject(project: Project, lang: Locale): PublicProject {
  const alt = lang === "id" ? project.thumbnailAltId : project.thumbnailAltEn;
  const hasThumbnail =
    project.thumbnailUrl !== null &&
    project.thumbnailWidth !== null &&
    project.thumbnailHeight !== null;

  return {
    id: project.id,
    slug: project.slug,
    title: lang === "id" ? project.titleId : project.titleEn,
    summary: lang === "id" ? project.summaryId : project.summaryEn,
    liveUrl: project.liveUrl,
    liveHost: hostOf(project.liveUrl),
    tags: project.tags.slice(0, 4),
    thumbnail: hasThumbnail
      ? {
          url: project.thumbnailUrl!,
          width: project.thumbnailWidth!,
          height: project.thumbnailHeight!,
          alt: alt ?? "",
        }
      : null,
    featured: project.featured,
  };
}

/** Standard order (App Flow section 9): sort_order asc, then newest first. */
export function compareProjects(
  a: Pick<Project, "sortOrder" | "createdAt">,
  b: Pick<Project, "sortOrder" | "createdAt">,
): number {
  return a.sortOrder - b.sortOrder || b.createdAt.getTime() - a.createdAt.getTime();
}

/**
 * Homepage split (App Flow S-01): hero panel = first 3 featured; Selected work grid = first 6
 * published regardless of `featured`, plus the total for "View all work ({n})".
 * Input must already be published-only and in standard order.
 */
export function selectHomepageProjects<T extends { featured: boolean }>(projects: readonly T[]) {
  return {
    heroPanel: projects.filter((project) => project.featured).slice(0, HERO_PANEL_LIMIT),
    grid: projects.slice(0, HOMEPAGE_GRID_LIMIT),
    total: projects.length,
  };
}

/** Grid goes to 3 columns at >=1200px only with 3+ cards (App Flow S-02, E-04). */
export function gridColumnsClass(count: number): string {
  return count >= 3 ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2";
}
