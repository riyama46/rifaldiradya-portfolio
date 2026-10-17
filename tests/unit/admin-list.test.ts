import { describe, expect, it } from "vitest";
import { adminStrings, parseNotice } from "@/components/admin/strings";
import { formatRelativeTime, selectedWorkCount } from "@/lib/projects/admin";

describe("selectedWorkCount (S-11 v2, E-26)", () => {
  const list = (flags: boolean[]) => flags.map((showOnHome) => ({ showOnHome }));

  it("counts every project switched on, drafts included", () => {
    expect(selectedWorkCount(list([true, false, true]))).toEqual({
      count: 2,
      limit: 5,
      full: false,
    });
  });

  it("is full at 5", () => {
    expect(selectedWorkCount(list(Array(5).fill(true))).full).toBe(true);
    expect(selectedWorkCount(list(Array(4).fill(true))).full).toBe(false);
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

  it("uses the S-11 wording for the Selected work info", () => {
    expect(adminStrings.projects.selectedWork(5, 5)).toBe(
      "Selected work on the homepage: 5 of 5. Turn one off before adding another.",
    );
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
