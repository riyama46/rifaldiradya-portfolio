import type { Locale } from "@/i18n";
import type { Project } from "@/lib/db/schema";
import type { CaseAction, ProjectGroup } from "./validation";

export type ScreenshotVisual = {
  type: "screenshot";
  url: string;
  width: number;
  height: number;
  alt: string;
};
export type NumberVisual = { type: "number"; number: string; caption: string };

/**
 * Public DTO per locale (CHANGE v2.0.0, Delta APP_FLOW section 9). Never contains draft-only or
 * admin fields, nor the deprecated `featured` (D-22). Case parts that are still empty are null or
 * [] so the page can hide them (E-27); `visual` is null when the chosen visual is incomplete.
 */
export type PublicProject = {
  id: string;
  slug: string;
  group: ProjectGroup;
  title: string;
  meta: string | null;
  side: string | null;
  summary: string;
  caseIs: string | null;
  caseDid: string[];
  stack: string[];
  status: string | null;
  caseAction: CaseAction;
  /** Only an https URL ever reaches a page (SDD section 6). */
  liveUrl: string | null;
  visual: ScreenshotVisual | NumberVisual | null;
  showOnHome: boolean;
};

export const SELECTED_WORK_LIMIT = 5;
export const STACK_LIMIT = 6;

/** v1 homepage (removed in T-29/T-30): hero panel and grid sizes. */
export const HOMEPAGE_GRID_LIMIT = 6;

function httpsUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function visualOf(project: Project, lang: Locale): PublicProject["visual"] {
  if (project.visualType === "number") {
    const caption = lang === "id" ? project.cardCaptionId : project.cardCaptionEn;
    return project.cardNumber && caption
      ? { type: "number", number: project.cardNumber, caption }
      : null;
  }
  if (
    project.thumbnailUrl === null ||
    project.thumbnailWidth === null ||
    project.thumbnailHeight === null
  ) {
    return null;
  }
  return {
    type: "screenshot",
    url: project.thumbnailUrl,
    width: project.thumbnailWidth,
    height: project.thumbnailHeight,
    alt: (lang === "id" ? project.thumbnailAltId : project.thumbnailAltEn) ?? "",
  };
}

export function toPublicProject(project: Project, lang: Locale): PublicProject {
  const id = lang === "id";
  const liveUrl = httpsUrl(project.liveUrl);

  // E-28: a site button without a usable URL (old or broken data) becomes no button.
  let caseAction = project.caseAction;
  if (caseAction === "site" && !liveUrl) {
    console.warn(`[projects] "${project.slug}": case action "site" without a live URL, hidden.`);
    caseAction = "none";
  }

  return {
    id: project.id,
    slug: project.slug,
    group: project.group,
    title: id ? project.titleId : project.titleEn,
    meta: (id ? project.metaId : project.metaEn) || null,
    side: (id ? project.sideId : project.sideEn) || null,
    summary: id ? project.summaryId : project.summaryEn,
    caseIs: (id ? project.caseIsId : project.caseIsEn) || null,
    caseDid: (id ? project.caseDidId : project.caseDidEn) ?? [],
    stack: project.tags.slice(0, STACK_LIMIT),
    status: (id ? project.statusId : project.statusEn) || null,
    caseAction,
    liveUrl,
    visual: visualOf(project, lang),
    showOnHome: project.showOnHome,
  };
}

/** The screenshot of a project, or null (number cards appear only from v2.1.0, D-11). */
export const screenshotOf = (project: Pick<PublicProject, "visual">) =>
  project.visual?.type === "screenshot" ? project.visual : null;

/** Standard order (App Flow section 9): sort_order asc, then newest first. */
export function compareProjects(
  a: Pick<Project, "sortOrder" | "createdAt">,
  b: Pick<Project, "sortOrder" | "createdAt">,
): number {
  return a.sortOrder - b.sortOrder || b.createdAt.getTime() - a.createdAt.getTime();
}

/**
 * Selected work (Delta SDD section 5): from the published list in standard order, the projects
 * with show_on_home, at most 5. Derived in memory from the one query the homepage makes.
 */
export function selectSelectedWork<T extends { showOnHome: boolean }>(projects: readonly T[]) {
  return projects.filter((project) => project.showOnHome).slice(0, SELECTED_WORK_LIMIT);
}

/**
 * v1 homepage grid until T-30 replaces it with Selected work: the first 6 published, plus the
 * total for "View all work ({n})". Input must already be published-only and in standard order.
 */
export function selectHomepageProjects<T>(projects: readonly T[]) {
  return { grid: projects.slice(0, HOMEPAGE_GRID_LIMIT), total: projects.length };
}

/** Grid goes to 3 columns at >=1200px only with 3+ cards (App Flow S-02, E-04). */
export function gridColumnsClass(count: number): string {
  return count >= 3 ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2";
}
