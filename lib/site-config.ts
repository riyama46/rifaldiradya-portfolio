// Non-secret site configuration (SDD section 9). Changing a value = commit + deploy.
export const siteConfig = {
  name: "Rifaldi Radya Pratama",
  shortName: "Rifaldi R.P.",
  role: "Web Developer",
  contactEmail: "hello@rifaldiradya.com",
  /** Static web CV (D-14): no phone number, replaced through a PATCH. */
  cvPath: "/cv/rifaldi-radya-pratama-cv.pdf",
  timezoneLabel: "GMT+7",
  timezone: "Asia/Jakarta",
  initials: "RR",
  /** Matches "Last updated" on S-03; the privacy pages' sitemap lastmod. */
  privacyUpdated: "2026-09-29",
  /** Hero stack line (Delta PRD section 4). */
  stack: ["C#", "ASP.NET", "SQL Server", "Azure", "Power Automate", "Next.js", "TypeScript"],
  social: {
    linkedin: "https://www.linkedin.com/in/rifaldiradya",
    /** Empty = not rendered anywhere (D-19). */
    github: "",
  },
} as const;
