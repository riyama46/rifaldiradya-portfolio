import { interpolate, type Dictionary, type Locale } from "@/i18n";
import type { Project } from "@/lib/db/schema";
import { PROJECT_GROUPS, type CaseAction, type ProjectGroup } from "./validation";

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
  /**
   * Only when the case button opens the site, and only https (SDD section 6): a stored URL the page
   * doesn't show must not reach the JSON-LD either.
   */
  liveUrl: string | null;
  /** D-42: optional links shown beside the case button, https only (never in the JSON-LD). */
  demoUrl: string | null;
  repoUrl: string | null;
  visual: ScreenshotVisual | NumberVisual | null;
  showOnHome: boolean;
};

export const SELECTED_WORK_LIMIT = 5;
export const STACK_LIMIT = 6;

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
    liveUrl: caseAction === "site" ? liveUrl : null,
    demoUrl: httpsUrl(project.demoUrl),
    repoUrl: httpsUrl(project.repoUrl),
    visual: visualOf(project, lang),
    showOnHome: project.showOnHome,
  };
}

/** The screenshot of a project, or null (number cards appear only from v2.1.0, D-11). */
export const screenshotOf = (project: Pick<PublicProject, "visual">) =>
  project.visual?.type === "screenshot" ? project.visual : null;

/**
 * Selected work (Delta SDD section 5): from the published list in standard order, the projects
 * with show_on_home, at most 5. Derived in memory from the one query the homepage makes.
 */
export function selectSelectedWork<T extends { showOnHome: boolean }>(projects: readonly T[]) {
  return projects.filter((project) => project.showOnHome).slice(0, SELECTED_WORK_LIMIT);
}

/**
 * Scroll range of each pinned Selected work step, as % of the chapter's `contain` range
 * (option-b.html): step i is centred on its snap point i / (n - 1), half a step either side.
 * n = 5 gives -12.5/12.5, 12.5/37.5 … 87.5/112.5. A single project is not pinned: [].
 */
export function selectedWorkRanges(n: number): { r0: string; r1: string }[] {
  if (n < 2) return [];
  const step = 100 / (n - 1);
  const pct = (value: number) => `${Math.round(value * 1000) / 1000}%`;
  return Array.from({ length: n }, (_, i) => ({
    r0: pct(i * step - step / 2),
    r1: pct(i * step + step / 2),
  }));
}

/**
 * Filter buttons of the Work page (Delta APP_FLOW S-02 step 2): one per group that has projects,
 * in the fixed order HR automation, HR systems, Websites, AI tools (D-43). An empty group gets no button.
 */
export function groupCounts(
  projects: readonly Pick<PublicProject, "group">[],
): { group: ProjectGroup; count: number }[] {
  return PROJECT_GROUPS.map((group) => ({
    group,
    count: projects.filter((project) => project.group === group).length,
  })).filter(({ count }) => count > 0);
}

/**
 * Work page sub (D-30): one phrase per group that has projects, in the filter order, so the
 * sentence always matches the counts on the filter buttons. Numbers up to ten are written as
 * words. No projects → null (E-01 empty state says the rest).
 */
export function workSub(
  groups: readonly { group: ProjectGroup; count: number }[],
  sub: Dictionary["wp"]["sub"],
  lang: Locale,
): string | null {
  if (groups.length === 0) return null;

  const plural = new Intl.PluralRules(lang);
  const parts = groups.map(({ group, count }) =>
    interpolate(sub[group][plural.select(count) === "one" ? "one" : "other"], {
      n: sub.n[count] ?? count,
    }),
  );
  const last = parts.pop() as string;
  const list =
    parts.length === 0
      ? last
      : `${parts.join(", ")}${parts.length === 1 ? sub.and2 : sub.andN}${last}`;

  return `${list.charAt(0).toLocaleUpperCase(lang)}${list.slice(1)}. ${sub.end}`;
}
