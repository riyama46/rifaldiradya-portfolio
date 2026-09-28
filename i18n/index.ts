import en from "./en.json";
import id from "./id.json";

export const locales = ["en", "id"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = { en, id };

export const publicRoutes = ["/", "/work", "/privacy"] as const;

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (locales as readonly string[]).includes(value);
}

export function getDictionary(lang: Locale): Dictionary {
  return dictionaries[lang];
}

/** Locale comes from the URL only (App Flow G1): `/id` prefix = id, anything else = en. */
export function splitLocale(pathname: string): { lang: Locale; path: string } {
  if (pathname === "/id" || pathname.startsWith("/id/")) {
    return { lang: "id", path: pathname.slice(3) || "/" };
  }
  return { lang: "en", path: pathname || "/" };
}

/** `localePath('/work', 'id')` → `/id/work`; keeps a trailing `#hash`. All internal links go through this. */
export function localePath(path: string, lang: Locale): string {
  const hashIndex = path.indexOf("#");
  const base = (hashIndex === -1 ? path : path.slice(0, hashIndex)) || "/";
  const hash = hashIndex === -1 ? "" : path.slice(hashIndex);

  if (lang === "en") return base + hash;
  return (base === "/" ? "/id" : `/id${base}`) + hash;
}

/** Counterpart page in the other locale; unknown paths (404) go to the other locale's home. */
export function altPath(pathname: string, hash = ""): { lang: Locale; href: string } {
  const { lang, path } = splitLocale(pathname);
  const target: Locale = lang === "en" ? "id" : "en";
  const isKnown = (publicRoutes as readonly string[]).includes(path);

  return { lang: target, href: localePath(isKnown ? path + hash : "/", target) };
}

export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
