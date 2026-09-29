import { HERO_PANEL_LIMIT } from "@/lib/projects/public";

/**
 * "Featured in homepage hero: {n}/3" (S-11, E-08). Only published projects can reach the hero,
 * so a featured draft is not counted.
 */
export function heroFeaturedCount(projects: readonly { featured: boolean; published: boolean }[]) {
  const count = projects.filter((project) => project.featured && project.published).length;
  return { count, limit: HERO_PANEL_LIMIT, overLimit: count > HERO_PANEL_LIMIT };
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
