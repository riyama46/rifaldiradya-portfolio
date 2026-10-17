import { SHOW_ON_HOME_MAX } from "@/lib/projects/validation";

/**
 * "Selected work on the homepage: {k} of 5" (S-11 v2). Drafts count too: the limit of 5 (E-26)
 * applies to the switch, published or not.
 */
export function selectedWorkCount(projects: readonly { showOnHome: boolean }[]) {
  const count = projects.filter((project) => project.showOnHome).length;
  return { count, limit: SHOW_ON_HOME_MAX, full: count >= SHOW_ON_HOME_MAX };
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
