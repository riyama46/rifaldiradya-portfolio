// Non-secret site configuration (SDD section 9). Changing a value = commit + deploy.
export const siteConfig = {
  name: "Rifaldi Radya Pratama",
  shortName: "Rifaldi R.P.",
  /** JSON-LD jobTitle. No worksFor: the employer is named only in About and the CV (D-41). */
  role: "HR Automation Engineer",
  /** JSON-LD knowsAbout (CHANGE v2.2.0, Delta PRD section 9): automation first, .NET as proof. */
  knowsAbout: [
    "HR automation",
    "n8n",
    "Google Gemini",
    "Google Workspace",
    "Power Automate",
    "HRMS",
    "C#",
    "ASP.NET",
    "SQL Server",
  ],
  contactEmail: "hello@rifaldiradya.com",
  /** Static web CV (D-14): no phone number, replaced through a PATCH. */
  cvPath: "/cv/rifaldi-radya-pratama-cv.pdf",
  timezoneLabel: "GMT+7",
  timezone: "Asia/Jakarta",
  initials: "RR",
  /** Matches "Last updated" on S-03; the privacy pages' sitemap lastmod. */
  privacyUpdated: "2026-10-17",
  /** Hero stack line (CHANGE v2.2.0, Delta PRD section 4); scripts/og-images.mts reads the same list. */
  // Six short items so the hero still fits a 375 × 667 screen with the cookie banner (AC-1).
  stack: ["n8n", "Gemini", "Google Workspace", "C#", "ASP.NET", "SQL Server"],
  social: {
    linkedin: "https://www.linkedin.com/in/rifaldiradya",
    /** Empty = not rendered anywhere (D-19). */
    github: "https://github.com/riyama46",
  },
} as const;
