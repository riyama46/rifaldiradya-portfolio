// Non-secret site configuration (SDD section 9). Changing a value = commit + deploy.
export const siteConfig = {
  name: "Rifaldi Radya Pratama",
  shortName: "Rifaldi R.P.",
  role: "Web Developer",
  email: "hello@rifaldiradya.com",
  availableForWork: true,
  timezoneLabel: "GMT+7",
  initials: "RR",
  stack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "HTML", "CSS", "JavaScript"],
  social: {
    linkedin: "https://www.linkedin.com/in/rifaldi-radya-070a44174/",
  },
} as const;

export function mailtoHref(subject: string): string {
  return `mailto:${siteConfig.email}?subject=${encodeURIComponent(subject)}`;
}
