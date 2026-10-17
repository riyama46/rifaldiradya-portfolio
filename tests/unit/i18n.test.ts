import { describe, expect, it } from "vitest";
import en from "@/i18n/en.json";
import id from "@/i18n/id.json";
import { altPath, getDictionary, interpolate, isLocale, localePath, splitLocale } from "@/i18n";

function leafKeys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

function leafValues(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value !== "object" || value === null) return [];
  return Object.values(value).flatMap(leafValues);
}

describe("dictionaries", () => {
  it("en and id have exactly the same keys", () => {
    expect(leafKeys(id).sort()).toEqual(leafKeys(en).sort());
  });

  it("has no empty strings", () => {
    for (const text of [...leafValues(en), ...leafValues(id)]) {
      expect(text.trim()).not.toBe("");
    }
  });

  it("only uses allowed rich-text tags, balanced", () => {
    const allowed = new Set(["em", "s", "strong"]);
    for (const text of [...leafValues(en), ...leafValues(id)]) {
      const tags = [...text.matchAll(/<\/?([a-z]+)>/g)].map((m) => m[1]);
      for (const tag of tags) expect(allowed.has(tag), `${tag} in "${text}"`).toBe(true);
      for (const tag of allowed) {
        const opens = text.split(`<${tag}>`).length - 1;
        const closes = text.split(`</${tag}>`).length - 1;
        expect(opens, `unbalanced <${tag}> in "${text}"`).toBe(closes);
      }
    }
  });

  it("uses the same placeholders in both languages", () => {
    const placeholders = (dict: unknown) =>
      Object.fromEntries(
        leafKeys(dict).map((key) => {
          const text = key
            .split(".")
            .reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], dict);
          return [key, [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()];
        }),
      );
    expect(placeholders(id)).toEqual(placeholders(en));
  });

  it("returns the dictionary for each locale", () => {
    expect(getDictionary("en").nav.work).toBe("Work");
    expect(getDictionary("id").nav.work).toBe("Hasil Kerja");
  });
});

describe("isLocale", () => {
  it("accepts only en and id", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("id")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale("")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe("splitLocale", () => {
  it.each([
    ["/", "en", "/"],
    ["/work", "en", "/work"],
    ["/privacy", "en", "/privacy"],
    ["/id", "id", "/"],
    ["/id/work", "id", "/work"],
    ["/id/privacy", "id", "/privacy"],
    ["/idea", "en", "/idea"],
    ["/id/unknown/deep", "id", "/unknown/deep"],
  ])("%s -> %s %s", (pathname, lang, path) => {
    expect(splitLocale(pathname)).toEqual({ lang, path });
  });
});

describe("localePath", () => {
  it.each([
    ["/", "en", "/"],
    ["/", "id", "/id"],
    ["/work", "en", "/work"],
    ["/work", "id", "/id/work"],
    ["/privacy", "id", "/id/privacy"],
    ["/#work", "en", "/#work"],
    ["/#work", "id", "/id#work"],
    ["#work", "id", "/id#work"],
    ["/work#top", "id", "/id/work#top"],
  ] as const)("localePath(%s, %s) = %s", (path, lang, expected) => {
    expect(localePath(path, lang)).toBe(expected);
  });
});

describe("altPath", () => {
  it.each([
    ["/", "", "id", "/id"],
    ["/id", "", "en", "/"],
    ["/work", "", "id", "/id/work"],
    ["/id/work", "", "en", "/work"],
    ["/privacy", "", "id", "/id/privacy"],
    ["/id/privacy", "", "en", "/privacy"],
    ["/", "#work", "id", "/id#work"],
    ["/id", "#work", "en", "/#work"],
    ["/does-not-exist", "", "id", "/id"],
    ["/id/does-not-exist", "", "en", "/"],
  ] as const)("altPath(%s, %s) -> %s %s", (pathname, hash, lang, href) => {
    expect(altPath(pathname, hash)).toEqual({ lang, href });
  });
});

describe("interpolate", () => {
  it("replaces known placeholders and keeps unknown ones", () => {
    expect(interpolate("View all work ({n})", { n: 8 })).toBe("View all work (8)");
    expect(interpolate("Indonesia ({timezone})", { timezone: "GMT+7" })).toBe("Indonesia (GMT+7)");
    expect(interpolate("Hi {name}", {})).toBe("Hi {name}");
  });
});
