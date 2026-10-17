import { describe, expect, it } from "vitest";
import { adminStrings, parseNotice } from "@/components/admin/strings";
import type { Project } from "@/lib/db/schema";
import {
  formatRelativeTime,
  projectCounts,
  selectedWorkCount,
  selectedWorkFullWithout,
  toAdminRows,
} from "@/lib/projects/admin";

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

describe("selectedWorkFullWithout (E-26 on the form)", () => {
  const five = Array.from({ length: 5 }, (_, i) => ({ id: `p${i}`, showOnHome: true }));

  it("is full for a new project or one that is switched off", () => {
    expect(selectedWorkFullWithout(five)).toBe(true);
    expect(selectedWorkFullWithout([...five, { id: "x", showOnHome: false }], "x")).toBe(true);
  });

  it("is not full for one of the five, so its own switch stays usable", () => {
    expect(selectedWorkFullWithout(five, "p2")).toBe(false);
  });
});

describe("S-11 rows and counts", () => {
  const base = {
    titleEn: "HR System",
    metaEn: "Panasonic · 13 companies",
    sideEn: "2022–now",
    group: "panasonic",
    published: true,
    showOnHome: true,
    visualType: "number",
    cardNumber: "13",
    thumbnailUrl: null,
    updatedAt: new Date("2026-10-17T09:00:00Z"),
  } as unknown as Project;
  const now = new Date("2026-10-17T10:00:00Z");

  it("joins meta and side like the homepage label and picks the visual by type", () => {
    const [row] = toAdminRows([{ ...base, id: "a" }], now);
    expect(row).toMatchObject({
      position: 1,
      meta: "Panasonic · 13 companies · 2022–now",
      visual: { type: "number", number: "13" },
      updated: "1 hour ago",
    });
  });

  it("shows the thumbnail for a screenshot, nothing when the visual is missing", () => {
    const rows = toAdminRows(
      [
        { ...base, id: "a", visualType: "screenshot", thumbnailUrl: "/media/x.webp" },
        { ...base, id: "b", cardNumber: null, metaEn: null, sideEn: null },
      ],
      now,
    );
    expect(rows[0].visual).toEqual({ type: "screenshot", url: "/media/x.webp" });
    expect(rows[1]).toMatchObject({ position: 2, visual: null, meta: null });
  });

  it("counts published, drafts and groups", () => {
    const counts = projectCounts([
      { published: true, group: "panasonic" },
      { published: false, group: "web" },
      { published: true, group: "web" },
    ]);
    expect(counts).toEqual({
      total: 3,
      published: 2,
      drafts: 1,
      groups: { panasonic: 1, web: 2, ai: 0 },
    });
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
  it("uses the S-11 summary wording", () => {
    expect(adminStrings.projects.summary(7, 7, 0)).toBe("7 projects · 7 published · 0 drafts");
    expect(adminStrings.projects.summary(1, 0, 1)).toBe("1 project · 0 published · 1 draft");
  });

  it("uses the S-11 wording for the Selected work info", () => {
    expect(
      `${adminStrings.projects.selectedWork(5, 5)} ${adminStrings.projects.selectedWorkFull}`,
    ).toBe("Selected work on the homepage: 5 of 5. Turn one off before adding another.");
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
