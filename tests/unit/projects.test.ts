import { describe, expect, it } from "vitest";
import type { Project } from "@/lib/db/schema";
import { mediaLoader } from "@/lib/images/loader";
import {
  compareProjects,
  gridColumnsClass,
  selectHomepageProjects,
  toPublicProject,
} from "@/lib/projects/public";

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: "01JABCDEF0000000000000000",
    slug: "coffee-shop-landing",
    titleEn: "Coffee Shop Landing Page",
    titleId: "Landing Page Coffee Shop",
    summaryEn: "One-page site with menu and WhatsApp order button.",
    summaryId: "Situs satu halaman dengan menu dan tombol pesan WhatsApp.",
    liveUrl: "https://staging0.rifaldiradya.com",
    tags: ["Next.js", "Tailwind CSS"],
    thumbnailPublicId: "01JIMAGE000000000000000000",
    thumbnailUrl: "/media/01JIMAGE000000000000000000.webp",
    thumbnailWidth: 1600,
    thumbnailHeight: 1000,
    thumbnailAltEn: "Homepage of a coffee shop site",
    thumbnailAltId: "Beranda situs coffee shop",
    sortOrder: 100,
    featured: false,
    published: true,
    createdAt: new Date("2026-09-01T00:00:00Z"),
    updatedAt: new Date("2026-09-01T00:00:00Z"),
    ...overrides,
  };
}

describe("toPublicProject", () => {
  it("picks the English fields for en", () => {
    const dto = toPublicProject(project(), "en");
    expect(dto.title).toBe("Coffee Shop Landing Page");
    expect(dto.summary).toMatch(/^One-page/);
    expect(dto.thumbnail?.alt).toBe("Homepage of a coffee shop site");
    expect(dto.liveHost).toBe("staging0.rifaldiradya.com");
  });

  it("picks the Indonesian fields for id", () => {
    const dto = toPublicProject(project(), "id");
    expect(dto.title).toBe("Landing Page Coffee Shop");
    expect(dto.thumbnail?.alt).toBe("Beranda situs coffee shop");
  });

  it("returns a null thumbnail when the image is missing", () => {
    expect(toPublicProject(project({ thumbnailUrl: null }), "en").thumbnail).toBeNull();
  });

  it("keeps at most 4 tags", () => {
    const tags = ["a", "b", "c", "d", "e"];
    expect(toPublicProject(project({ tags }), "en").tags).toEqual(["a", "b", "c", "d"]);
  });

  it("does not expose admin-only fields", () => {
    const dto = toPublicProject(project(), "en") as Record<string, unknown>;
    for (const key of ["published", "sortOrder", "thumbnailPublicId", "createdAt"]) {
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

describe("selectHomepageProjects", () => {
  const list = (featuredFlags: boolean[]) =>
    featuredFlags.map((featured, index) => ({ id: index, featured }));

  it("takes the first 3 featured for the hero panel (E-03)", () => {
    const { heroPanel } = selectHomepageProjects(list([true, false, true, true, true]));
    expect(heroPanel.map((p) => p.id)).toEqual([0, 2, 3]);
  });

  it("takes the first 6 published for the grid, regardless of featured", () => {
    const { grid, total } = selectHomepageProjects(list(Array(8).fill(false)));
    expect(grid).toHaveLength(6);
    expect(total).toBe(8);
  });

  it("handles no projects and no featured projects (E-01, E-21)", () => {
    expect(selectHomepageProjects([])).toEqual({ heroPanel: [], grid: [], total: 0 });
    expect(selectHomepageProjects(list([false, false])).heroPanel).toEqual([]);
  });
});

describe("gridColumnsClass", () => {
  it.each([
    [1, "md:grid-cols-2"],
    [2, "md:grid-cols-2"],
    [3, "md:grid-cols-2 xl:grid-cols-3"],
    [6, "md:grid-cols-2 xl:grid-cols-3"],
  ])("%i cards -> %s", (count, expected) => {
    expect(gridColumnsClass(count)).toBe(expected);
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
