import { describe, expect, it, vi } from "vitest";
import type { Project } from "@/lib/db/schema";
import { mediaLoader } from "@/lib/images/loader";
import {
  compareProjects,
  groupCounts,
  screenshotOf,
  selectSelectedWork,
  selectedWorkRanges,
  toPublicProject,
} from "@/lib/projects/public";

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: "01JABCDEF0000000000000000",
    slug: "bloom-studio",
    titleEn: "Bloom Studio",
    titleId: "Bloom Studio ID",
    summaryEn: "One-page site with menu and WhatsApp order button.",
    summaryId: "Situs satu halaman dengan menu dan tombol pesan WhatsApp.",
    liveUrl: "https://staging0.rifaldiradya.com",
    tags: ["Next.js", "Tailwind CSS"],
    thumbnailPublicId: "01JIMAGE000000000000000000",
    thumbnailUrl: "/media/01JIMAGE000000000000000000.webp",
    thumbnailWidth: 1600,
    thumbnailHeight: 1000,
    thumbnailAltEn: "Homepage of a florist site",
    thumbnailAltId: "Beranda situs toko bunga",
    sortOrder: 1,
    featured: false,
    group: "web",
    metaEn: "Website · Florist",
    metaId: "Website · Toko bunga",
    sideEn: "2025",
    sideId: "2025",
    caseIsEn: "A website for a florist.",
    caseIsId: "Website untuk toko bunga.",
    caseDidEn: ["Built the site."],
    caseDidId: ["Membangun situs."],
    statusEn: "Live, 2025",
    statusId: "Live, 2025",
    caseAction: "site",
    visualType: "screenshot",
    cardNumber: null,
    cardCaptionEn: null,
    cardCaptionId: null,
    showOnHome: true,
    published: true,
    createdAt: new Date("2026-09-01T00:00:00Z"),
    updatedAt: new Date("2026-09-01T00:00:00Z"),
    ...overrides,
  };
}

// A published v1 row after migration 0004: defaults only, no v2 text yet (E-27).
const v1Row = () =>
  project({
    metaEn: null,
    metaId: null,
    sideEn: null,
    sideId: null,
    caseIsEn: null,
    caseIsId: null,
    caseDidEn: null,
    caseDidId: null,
    statusEn: null,
    statusId: null,
    showOnHome: false,
  });

describe("toPublicProject (v2 DTO)", () => {
  it("picks the English fields for en", () => {
    expect(toPublicProject(project(), "en")).toEqual({
      id: "01JABCDEF0000000000000000",
      slug: "bloom-studio",
      group: "web",
      title: "Bloom Studio",
      meta: "Website · Florist",
      side: "2025",
      summary: "One-page site with menu and WhatsApp order button.",
      caseIs: "A website for a florist.",
      caseDid: ["Built the site."],
      stack: ["Next.js", "Tailwind CSS"],
      status: "Live, 2025",
      caseAction: "site",
      liveUrl: "https://staging0.rifaldiradya.com",
      visual: {
        type: "screenshot",
        url: "/media/01JIMAGE000000000000000000.webp",
        width: 1600,
        height: 1000,
        alt: "Homepage of a florist site",
      },
      showOnHome: true,
    });
  });

  it("picks the Indonesian fields for id", () => {
    const dto = toPublicProject(project(), "id");
    expect(dto).toMatchObject({
      title: "Bloom Studio ID",
      meta: "Website · Toko bunga",
      caseIs: "Website untuk toko bunga.",
      caseDid: ["Membangun situs."],
    });
    expect(screenshotOf(dto)?.alt).toBe("Beranda situs toko bunga");
  });

  it("E-27: a v1 row shows title and summary, with the empty case parts hidden", () => {
    const dto = toPublicProject(v1Row(), "en");
    expect(dto).toMatchObject({
      title: "Bloom Studio",
      summary: expect.stringMatching(/^One-page/),
      meta: null,
      side: null,
      caseIs: null,
      caseDid: [],
      status: null,
      caseAction: "site",
      showOnHome: false,
    });
    expect(dto.visual?.type).toBe("screenshot");
  });

  it("number card: number + caption per locale, null while incomplete", () => {
    const card = project({
      visualType: "number",
      cardNumber: "13",
      cardCaptionEn: "group companies",
      cardCaptionId: "perusahaan grup",
    });
    expect(toPublicProject(card, "id").visual).toEqual({
      type: "number",
      number: "13",
      caption: "perusahaan grup",
    });
    expect(screenshotOf(toPublicProject(card, "en"))).toBeNull();
    expect(toPublicProject(project({ visualType: "number" }), "en").visual).toBeNull();
  });

  it("returns a null visual when the screenshot is missing", () => {
    expect(toPublicProject(project({ thumbnailUrl: null }), "en").visual).toBeNull();
  });

  it("walkthrough projects keep their action without a URL", () => {
    const dto = toPublicProject(project({ caseAction: "walkthrough", liveUrl: null }), "en");
    expect(dto).toMatchObject({ caseAction: "walkthrough", liveUrl: null });
  });

  it("E-28: site without a usable URL becomes no button, with a server warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const liveUrl of [null, "", "http://insecure.example.com", "not a url"]) {
      const dto = toPublicProject(project({ liveUrl }), "en");
      expect(dto).toMatchObject({ caseAction: "none", liveUrl: null });
    }
    expect(warn).toHaveBeenCalledTimes(4);
    warn.mockRestore();
  });

  it("never renders a non-https URL, whatever the action (SDD section 6)", () => {
    const dto = toPublicProject(
      project({ caseAction: "none", liveUrl: "javascript:alert(1)" }),
      "en",
    );
    expect(dto.liveUrl).toBeNull();
  });

  it("keeps at most 6 Stack items", () => {
    const tags = ["a", "b", "c", "d", "e", "f", "g"];
    expect(toPublicProject(project({ tags }), "en").stack).toEqual(["a", "b", "c", "d", "e", "f"]);
  });

  it("does not expose admin-only or deprecated fields", () => {
    const dto = toPublicProject(project({ featured: true }), "en") as Record<string, unknown>;
    for (const key of ["published", "sortOrder", "thumbnailPublicId", "createdAt", "featured"]) {
      expect(dto).not.toHaveProperty(key);
    }
  });
});

describe("compareProjects", () => {
  it("orders by sort_order, then newest first", () => {
    const older = { sortOrder: 10, createdAt: new Date("2026-01-01") };
    const newer = { sortOrder: 10, createdAt: new Date("2026-06-01") };
    const first = { sortOrder: 1, createdAt: new Date("2025-01-01") };
    expect([older, newer, first].sort(compareProjects)).toEqual([first, newer, older]);
  });
});

describe("selectSelectedWork (D-18)", () => {
  const list = (flags: boolean[]) => flags.map((showOnHome, id) => ({ id, showOnHome }));

  it("takes the show_on_home projects in the given order, at most 5", () => {
    const picked = selectSelectedWork(list([true, false, true, true, true, true, true]));
    expect(picked.map((p) => p.id)).toEqual([0, 2, 3, 4, 5]);
  });

  it("E-25: none switched on gives an empty list", () => {
    expect(selectSelectedWork(list([false, false]))).toEqual([]);
    expect(selectSelectedWork([])).toEqual([]);
  });
});

describe("selectedWorkRanges (pinned steps, option-b.html)", () => {
  it("5 steps match the mockup ranges", () => {
    expect(selectedWorkRanges(5)).toEqual([
      { r0: "-12.5%", r1: "12.5%" },
      { r0: "12.5%", r1: "37.5%" },
      { r0: "37.5%", r1: "62.5%" },
      { r0: "62.5%", r1: "87.5%" },
      { r0: "87.5%", r1: "112.5%" },
    ]);
  });

  it("2 and 3 steps centre on 0/100 and 0/50/100", () => {
    expect(selectedWorkRanges(2)).toEqual([
      { r0: "-50%", r1: "50%" },
      { r0: "50%", r1: "150%" },
    ]);
    expect(selectedWorkRanges(3).map((r) => r.r0)).toEqual(["-25%", "25%", "75%"]);
  });

  it("4 steps round to a clean percentage", () => {
    expect(selectedWorkRanges(4)[1]).toEqual({ r0: "16.667%", r1: "50%" });
  });

  it("one project (or none) is not pinned", () => {
    expect(selectedWorkRanges(1)).toEqual([]);
    expect(selectedWorkRanges(0)).toEqual([]);
  });
});

describe("groupCounts", () => {
  it("counts each group in the fixed order and drops empty groups", () => {
    const projects = [{ group: "web" }, { group: "panasonic" }, { group: "web" }] as const;
    expect(groupCounts(projects)).toEqual([
      { group: "panasonic", count: 1 },
      { group: "web", count: 2 },
    ]);
  });

  it("returns nothing for no projects", () => {
    expect(groupCounts([])).toEqual([]);
  });
});

describe("mediaLoader", () => {
  const src = "/media/01JIMAGE000000000000000000.webp";

  it("asks /media for the next stored width", () => {
    expect(mediaLoader({ src, width: 700 })).toBe("/media/01JIMAGE000000000000000000-960.webp");
    expect(mediaLoader({ src, width: 640 })).toBe("/media/01JIMAGE000000000000000000-640.webp");
  });

  it("caps the width at 1600 and keeps a JPEG extension", () => {
    expect(mediaLoader({ src: "/media/01JIMAGE000000000000000000.jpg", width: 3840 })).toBe(
      "/media/01JIMAGE000000000000000000-1600.jpg",
    );
  });

  it("leaves anything else untouched", () => {
    for (const other of ["/og/en.png", "https://example.com/a.jpg", "/media/../etc.webp"]) {
      expect(mediaLoader({ src: other, width: 640 })).toBe(other);
    }
  });
});
