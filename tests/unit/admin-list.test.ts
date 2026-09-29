import { describe, expect, it } from "vitest";
import { adminStrings, parseNotice } from "@/components/admin/strings";
import { formatRelativeTime, heroFeaturedCount } from "@/lib/projects/admin";

describe("heroFeaturedCount (S-11, E-08)", () => {
  const project = (featured: boolean, published: boolean) => ({ featured, published });

  it("counts only featured projects that are published", () => {
    const result = heroFeaturedCount([
      project(true, true),
      project(true, false),
      project(false, true),
      project(true, true),
    ]);
    expect(result).toEqual({ count: 2, limit: 3, overLimit: false });
  });

  it("flags more than 3 without blocking anything", () => {
    const four = Array.from({ length: 4 }, () => project(true, true));
    expect(heroFeaturedCount(four).overLimit).toBe(true);
    expect(heroFeaturedCount(four.slice(0, 3)).overLimit).toBe(false);
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-09-29T10:00:00Z");
  const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000);

  it.each([
    [0, "now"],
    [30, "now"],
    [5 * 60, "5 minutes ago"],
    [3 * 60 * 60, "3 hours ago"],
    [26 * 60 * 60, "yesterday"],
    [2 * 24 * 60 * 60, "2 days ago"],
    [15 * 24 * 60 * 60, "2 weeks ago"],
    [65 * 24 * 60 * 60, "2 months ago"],
    [800 * 24 * 60 * 60, "2 years ago"],
  ])("%i seconds ago → %s", (seconds, expected) => {
    expect(formatRelativeTime(ago(seconds), now)).toBe(expected);
  });
});

describe("admin copy", () => {
  it("pluralises the project count", () => {
    expect(adminStrings.projects.count(0)).toBe("0 projects");
    expect(adminStrings.projects.count(1)).toBe("1 project");
    expect(adminStrings.projects.count(2)).toBe("2 projects");
  });

  it("uses the App Flow wording for the hero info", () => {
    expect(adminStrings.projects.featuredInHero(2, 3)).toBe("Featured in homepage hero: 2/3");
  });
});

describe("parseNotice (?notice= whitelist)", () => {
  it.each(["created", "saved", "deleted", "saved-stale", "not-found", "gone"])(
    "accepts %s",
    (key) => {
      expect(parseNotice(key)).toBe(key);
    },
  );

  it.each([undefined, "", "hello", "toString", "__proto__", "constructor", ["created"]])(
    "ignores %s",
    (value) => {
      expect(parseNotice(value as string | string[] | undefined)).toBeNull();
    },
  );
});
