import { interpolate, type Dictionary } from "@/i18n";
import { siteConfig } from "@/lib/site-config";

/** The four mailto kinds of Delta APP_FLOW section 11 (F5). */
export type MailKind = "general" | "role" | "project" | "walkthrough";

const DICT_KEY = {
  general: "general",
  role: "role",
  project: "project",
  walkthrough: "walk",
} as const satisfies Record<MailKind, keyof Dictionary["mail"]>;

/**
 * mailto with the subject and body of the page language. `title` names the project in the
 * walkthrough subject (D-25). Everything user-visible is percent-encoded (SDD section 6).
 */
export function mailtoHref(dict: Dictionary, kind: MailKind, title = ""): string {
  const entry = dict.mail[DICT_KEY[kind]];
  const subject = interpolate(entry.s, { title });
  const body = "b" in entry ? `&body=${encodeURIComponent(entry.b)}` : "";
  return `mailto:${siteConfig.contactEmail}?subject=${encodeURIComponent(subject)}${body}`;
}
