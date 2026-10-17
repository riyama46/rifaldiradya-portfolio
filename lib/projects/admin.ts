import type { Project } from "@/lib/db/schema";
import { PROJECT_GROUPS, SHOW_ON_HOME_MAX, type ProjectGroup } from "@/lib/projects/validation";

/**
 * "Selected work on the homepage: {k} of 5" (S-11 v2). Drafts count too: the limit of 5 (E-26)
 * applies to the switch, published or not.
 */
export function selectedWorkCount(projects: readonly { showOnHome: boolean }[]) {
  const count = projects.filter((project) => project.showOnHome).length;
  return { count, limit: SHOW_ON_HOME_MAX, full: count >= SHOW_ON_HOME_MAX };
}

/**
 * E-26 on S-12/S-13: is Selected work full without this project? Its own switch can then still be
 * turned off, but another one cannot be turned on.
 */
export function selectedWorkFullWithout(
  projects: readonly { id: string; showOnHome: boolean }[],
  projectId?: string,
) {
  return selectedWorkCount(projects.filter((project) => project.id !== projectId)).full;
}

const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60],
  ["month", 30 * 24 * 60 * 60],
  ["week", 7 * 24 * 60 * 60],
  ["day", 24 * 60 * 60],
  ["hour", 60 * 60],
  ["minute", 60],
];

const relativeFormat = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** Relative "updated" date for S-11, e.g. "2 days ago", "yesterday", "now" (admin UI is EN only). */
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relativeFormat.format(Math.trunc(seconds / size), unit);
  }
  return relativeFormat.format(0, "second");
}

/** One S-11 row, built on the server so the client list gets plain, already formatted data. */
export type AdminProjectRow = {
  id: string;
  position: number;
  title: string;
  /** "meta · side" in English, as on the homepage label; null while neither is filled in. */
  meta: string | null;
  group: ProjectGroup;
  published: boolean;
  showOnHome: boolean;
  updatedAt: string;
  updated: string;
  /** Screenshot thumbnail, or the number card's figure, by visual_type; null when not set yet. */
  visual: { type: "screenshot"; url: string } | { type: "number"; number: string } | null;
};

export function toAdminRows(projects: readonly Project[], now: Date): AdminProjectRow[] {
  return projects.map((project, index) => ({
    id: project.id,
    position: index + 1,
    title: project.titleEn,
    meta: [project.metaEn, project.sideEn].filter(Boolean).join(" · ") || null,
    group: project.group,
    published: project.published,
    showOnHome: project.showOnHome,
    updatedAt: project.updatedAt.toISOString(),
    updated: formatRelativeTime(project.updatedAt, now),
    visual:
      project.visualType === "number"
        ? project.cardNumber
          ? { type: "number", number: project.cardNumber }
          : null
        : project.thumbnailUrl
          ? { type: "screenshot", url: project.thumbnailUrl }
          : null,
  }));
}

/** "{n} projects · {p} published · {d} drafts" and the group filter's counts (S-11). */
export function projectCounts(projects: readonly { published: boolean; group: ProjectGroup }[]) {
  const published = projects.filter((project) => project.published).length;
  const groups = Object.fromEntries(
    PROJECT_GROUPS.map((group) => [group, projects.filter((p) => p.group === group).length]),
  ) as Record<ProjectGroup, number>;
  return { total: projects.length, published, drafts: projects.length - published, groups };
}
