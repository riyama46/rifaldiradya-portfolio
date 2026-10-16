// Non-secret site configuration (SDD section 9). Changing a value = commit + deploy.
export const siteConfig = {
  name: "Rifaldi Radya Pratama",
  shortName: "Rifaldi R.P.",
  role: "Web Developer",
  email: "hello@rifaldiradya.com",
  availableForWork: true,
  timezoneLabel: "GMT+7",
  initials: "RR",
  /** Matches "Last updated" on S-03; the privacy pages' sitemap lastmod. */
  privacyUpdated: "2026-09-29",
  stack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "HTML", "CSS", "JavaScript"],
  social: {
    linkedin: "https://www.linkedin.com/in/rifaldiradya",
  },
} as const;

export function mailtoHref(subject: string): string {
  return `mailto:${siteConfig.email}?subject=${encodeURIComponent(subject)}`;
}
