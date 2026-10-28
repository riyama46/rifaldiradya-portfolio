import { describe, expect, it } from "vitest";
import { MAX_JSON_BYTES, readJsonBody } from "@/lib/http/api";
import { slugify, uniqueSlug } from "@/lib/projects/slug";
import {
  fieldErrors,
  isValidLiveUrl,
  pickProjectFields,
  projectInputSchema,
} from "@/lib/projects/validation";

const thumbnail = {
  public_id: "img_01ABC",
  url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
  width: 1600,
  height: 1000,
};

// A complete published v2 project (CHANGE v2.0.0, S-12/S-13).
const valid = {
  title_en: "Bloom Studio",
  title_id: "Bloom Studio",
  group: "web",
  meta_en: "Website · Florist",
  meta_id: "Website · Toko bunga",
  side_en: "2025",
  side_id: "2025",
  summary_en: "One-page site with menu and location.",
  summary_id: "Situs satu halaman dengan menu dan lokasi.",
  show_on_home: true,
  case_is_en: "A website for a florist.",
  case_is_id: "Website untuk toko bunga.",
  case_did_en: ["Designed and built the site."],
  case_did_id: ["Mendesain dan membangun situs."],
  tags: ["Next.js", "Tailwind"],
  status_en: "Live, 2025",
  status_id: "Live, 2025",
  case_action: "site",
  live_url: "https://staging0.rifaldiradya.com",
  visual_type: "screenshot",
  thumbnail,
  thumbnail_alt_en: "Homepage of a florist site",
  thumbnail_alt_id: "Beranda situs toko bunga",
  published: true,
};

// An internal project: no site, walkthrough button, number card (HR System).
const internal = {
  ...valid,
  group: "panasonic",
  case_action: "walkthrough",
  live_url: null,
  visual_type: "number",
  thumbnail: null,
  thumbnail_alt_en: null,
  thumbnail_alt_id: null,
  card_number: "13",
  card_caption_en: "group companies on one HR system",
  card_caption_id: "perusahaan grup di satu sistem HR",
};

const errorsFor = (input: unknown) => {
  const result = projectInputSchema.safeParse(input);
  return result.success ? {} : fieldErrors(result.error);
};

describe("projectInputSchema: valid input", () => {
  it("accepts a complete published project and trims text", () => {
    const result = projectInputSchema.parse({ ...valid, title_en: "  Bloom  " });
    expect(result.title_en).toBe("Bloom");
    expect(result.published).toBe(true);
  });

  it("accepts an internal project without a live URL (D-12)", () => {
    expect(errorsFor(internal)).toEqual({});
    expect(projectInputSchema.parse(internal).live_url).toBeNull();
  });

  it("fills the v2 defaults for a new draft", () => {
    const draft = projectInputSchema.parse({
      title_en: "New",
      title_id: "Baru",
      summary_en: "Short.",
      summary_id: "Pendek.",
      live_url: "https://example.com",
    });
    expect(draft).toMatchObject({
      group: "web",
      case_action: "site",
      visual_type: "screenshot",
      show_on_home: false,
      published: false,
      tags: [],
      thumbnail: null,
      meta_en: null,
      side_id: null,
      case_did_en: null,
      card_number: null,
    });
  });

  it("stores empty optional text as null", () => {
    const draft = projectInputSchema.parse({
      ...valid,
      published: false,
      meta_en: "  ",
      side_id: "",
    });
    expect(draft.meta_en).toBeNull();
    expect(draft.side_id).toBeNull();
  });

  it("allows a draft without a thumbnail (E-17) and drops stray alt text", () => {
    const draft = projectInputSchema.parse({ ...valid, published: false, thumbnail: null });
    expect(draft.thumbnail).toBeNull();
    expect(draft.thumbnail_alt_en).toBeNull();
    expect(draft.thumbnail_alt_id).toBeNull();
  });

  it("keeps number card data next to a screenshot; visual_type decides (S-12)", () => {
    const both = projectInputSchema.parse({ ...valid, card_number: "5 → 1" });
    expect(both.card_number).toBe("5 → 1");
    expect(both.thumbnail).not.toBeNull();
  });
});

describe("projectInputSchema: lengths and enums", () => {
  it("requires title and short description, draft or not", () => {
    expect(errorsFor({ published: false })).toMatchObject({
      title_en: "Title (EN) is required.",
      title_id: "Title (ID) is required.",
      summary_en: "Short description (EN) is required.",
      summary_id: "Short description (ID) is required.",
    });
    expect(errorsFor({ ...valid, title_en: "   " }).title_en).toBe("Title (EN) is required.");
  });

  it.each([
    ["title_en", 80],
    ["summary_id", 160],
    ["meta_en", 40],
    ["side_id", 20],
    ["case_is_en", 220],
    ["status_id", 40],
    ["thumbnail_alt_en", 140],
    ["card_number", 12],
    ["card_caption_id", 60],
  ] as const)("%s: up to %i characters, reporting the current length", (field, max) => {
    expect(errorsFor({ ...valid, [field]: "x".repeat(max) })).toEqual({});
    expect(errorsFor({ ...valid, [field]: "x".repeat(max + 1) })[field]).toBe(
      `Keep it under ${max} characters (${max + 1} now).`,
    );
  });

  it.each([
    ["group", "hr"],
    ["case_action", "link"],
    ["visual_type", "video"],
  ] as const)("rejects an unknown %s", (field, value) => {
    expect(errorsFor({ ...valid, [field]: value })[field]).toMatch(/is not valid\.$/);
  });

  it("limits Stack to 6 unique (case-insensitive) items of 1–24 characters", () => {
    expect(errorsFor({ ...valid, tags: ["a", "b", "c", "d", "e", "f"] })).toEqual({});
    expect(errorsFor({ ...valid, tags: ["a", "b", "c", "d", "e", "f", "g"] }).tags).toBe(
      "Use up to 6 items.",
    );
    expect(errorsFor({ ...valid, tags: ["Next.js", "next.js"] }).tags).toMatch(/already added/);
    expect(errorsFor({ ...valid, tags: ["x".repeat(25)] }).tags).toBe(
      "Keep it under 24 characters (25 now).",
    );
    expect(errorsFor({ ...valid, tags: ["  "] }).tags).toBeDefined();
  });

  it("rejects non-boolean switches", () => {
    expect(errorsFor({ ...valid, published: "true" }).published).toBeDefined();
    expect(errorsFor({ ...valid, show_on_home: 1 }).show_on_home).toBeDefined();
  });
});

describe("projectInputSchema: What I did lines", () => {
  it("drops blank lines and trims the rest", () => {
    const parsed = projectInputSchema.parse({
      ...valid,
      case_did_en: ["  Built the API. ", "", "   ", "Wrote tests."],
    });
    expect(parsed.case_did_en).toEqual(["Built the API.", "Wrote tests."]);
  });

  it("stores no lines as null", () => {
    const parsed = projectInputSchema.parse({ ...valid, published: false, case_did_id: ["", " "] });
    expect(parsed.case_did_id).toBeNull();
  });

  it("allows 1–8 lines of up to 160 characters; blank lines don't count", () => {
    expect(errorsFor({ ...valid, case_did_en: Array(8).fill("Line") })).toEqual({});
    expect(errorsFor({ ...valid, case_did_en: Array(9).fill("Line") }).case_did_en).toBe(
      "Use up to 8 lines.",
    );
    expect(errorsFor({ ...valid, case_did_id: ["x".repeat(161)] }).case_did_id).toBe(
      "Keep it under 160 characters (161 now).",
    );
    expect(errorsFor({ ...valid, case_did_en: [...Array(8).fill("Line"), "", ""] })).toEqual({});
  });

  it("rejects anything that is not a list of strings", () => {
    expect(errorsFor({ ...valid, case_did_en: "Built it." }).case_did_en).toBeDefined();
    expect(errorsFor({ ...valid, case_did_en: [1] }).case_did_en).toBeDefined();
  });
});

describe("projectInputSchema: case action and live URL", () => {
  it("AC-8: site without a live URL is rejected, published or draft", () => {
    for (const published of [true, false]) {
      for (const live_url of [null, "", "   ", undefined]) {
        expect(errorsFor({ ...valid, published, live_url }).live_url).toBe(
          "Add a live URL, or choose another button.",
        );
      }
    }
  });

  it("walkthrough and none need no URL, but a given URL must still be valid", () => {
    for (const case_action of ["walkthrough", "none"]) {
      expect(errorsFor({ ...valid, case_action, live_url: null })).toEqual({});
      expect(errorsFor({ ...valid, case_action, live_url: "http://x.com" }).live_url).toBe(
        "URL must start with https:// and be a full address.",
      );
    }
  });

  it.each([
    "http://example.com",
    "example.com",
    "https://localhost",
    "https://user:pass@example.com",
    "javascript:alert(1)",
    "https://",
  ])("rejects the live URL %s", (live_url) => {
    expect(errorsFor({ ...valid, live_url }).live_url).toBe(
      "URL must start with https:// and be a full address.",
    );
  });

  it("rejects a live URL over 300 characters", () => {
    const live_url = `https://example.com/${"a".repeat(290)}`;
    expect(errorsFor({ ...valid, live_url }).live_url).toMatch(/^Keep it under 300/);
  });
});

describe("projectInputSchema: demo and code links (D-42)", () => {
  it("are optional, published or draft, and empty becomes null", () => {
    for (const published of [true, false]) {
      for (const link of [null, "", "   ", undefined]) {
        const parsed = projectInputSchema.parse({
          ...valid,
          published,
          demo_url: link,
          repo_url: link,
        });
        expect(parsed).toMatchObject({ demo_url: null, repo_url: null });
      }
    }
  });

  it("keep valid https links, beside any case action", () => {
    const demo_url = "https://drive.google.com/file/d/abc/view";
    const repo_url = "https://github.com/riyama46/hr-onboarding-automation";
    for (const case_action of ["site", "walkthrough", "none"]) {
      expect(projectInputSchema.parse({ ...valid, case_action, demo_url, repo_url })).toMatchObject(
        { demo_url, repo_url },
      );
    }
  });

  it.each(["demo_url", "repo_url"])("%s follows the live URL rules", (field) => {
    for (const bad of ["http://example.com", "example.com", "https://user:pass@example.com"]) {
      expect(errorsFor({ ...valid, [field]: bad })[field as "demo_url"]).toBe(
        "URL must start with https:// and be a full address.",
      );
    }
    const long = `https://example.com/${"a".repeat(290)}`;
    expect(errorsFor({ ...valid, [field]: long })[field as "demo_url"]).toMatch(
      /^Keep it under 300/,
    );
  });
});

describe("projectInputSchema: groups (D-43)", () => {
  it("accepts the automation group", () => {
    expect(projectInputSchema.parse({ ...valid, group: "automation" }).group).toBe("automation");
  });
});

describe("projectInputSchema: publish rules", () => {
  const emptyCase = {
    meta_en: null,
    meta_id: "",
    case_is_en: undefined,
    case_is_id: "  ",
    case_did_en: [],
    case_did_id: [""],
    status_en: null,
    status_id: null,
  };

  it("publishing needs meta, What it is, What I did and status in both languages", () => {
    expect(errorsFor({ ...valid, ...emptyCase })).toEqual({
      meta_en: "Meta line (EN) is required.",
      meta_id: "Meta line (ID) is required.",
      case_is_en: "What it is (EN) is required.",
      case_is_id: "What it is (ID) is required.",
      case_did_en: "What I did (EN) is required.",
      case_did_id: "What I did (ID) is required.",
      status_en: "Status (EN) is required.",
      status_id: "Status (ID) is required.",
    });
    expect(errorsFor({ ...valid, ...emptyCase, published: false })).toEqual({});
  });

  it("side and Stack stay optional when publishing", () => {
    expect(errorsFor({ ...valid, side_en: null, side_id: null, tags: [] })).toEqual({});
  });

  it("E-16: a published screenshot project needs the screenshot", () => {
    expect(errorsFor({ ...valid, thumbnail: null }).thumbnail).toBe(
      "Add a screenshot and alt text to publish, or turn off Published to save as draft.",
    );
  });

  it("a published number card needs the number and both captions; drafts don't", () => {
    expect(
      errorsFor({ ...internal, card_number: "", card_caption_en: null, card_caption_id: " " }),
    ).toEqual({
      card_number: "Number is required.",
      card_caption_en: "Caption (EN) is required.",
      card_caption_id: "Caption (ID) is required.",
    });
    expect(errorsFor({ ...internal, card_number: null, published: false })).toEqual({});
  });

  it("requires both alt texts whenever there is a screenshot, draft or not", () => {
    const errors = errorsFor({
      ...valid,
      published: false,
      thumbnail_alt_en: "",
      thumbnail_alt_id: null,
    });
    expect(errors).toMatchObject({
      thumbnail_alt_en: "Screenshot alt (EN) is required.",
      thumbnail_alt_id: "Screenshot alt (ID) is required.",
    });
  });

  it("shows every problem at once, not only the first", () => {
    const errors = errorsFor({ ...valid, title_id: "", live_url: "http://x.com", thumbnail: null });
    expect(Object.keys(errors).sort()).toEqual(["live_url", "thumbnail", "title_id"]);
  });

  it("E-27: a published v1 project without v2 fields must be completed when saved", () => {
    const v1 = {
      title_en: "Coffee",
      title_id: "Kopi",
      summary_en: "Menu.",
      summary_id: "Menu.",
      live_url: "https://example.com",
      tags: [],
      thumbnail,
      thumbnail_alt_en: "a",
      thumbnail_alt_id: "b",
      published: true,
    };
    expect(Object.keys(errorsFor(v1)).sort()).toEqual(Object.keys(emptyCase).sort());
    expect(errorsFor({ ...v1, published: false })).toEqual({});
  });
});

describe("projectInputSchema: other input", () => {
  it("ignores a position and the deprecated featured flag (D-22)", () => {
    const parsed = projectInputSchema.parse({ ...valid, sort_order: 1, featured: true });
    expect(parsed).not.toHaveProperty("sort_order");
    expect(parsed).not.toHaveProperty("featured");
    expect(pickProjectFields({ sort_order: 1, featured: true, show_on_home: false })).toEqual({
      show_on_home: false,
    });
  });

  it.each([
    { ...thumbnail, url: "http://insecure.example.com/a.jpg" },
    { ...thumbnail, url: "//evil.example.com/a.jpg" },
    { ...thumbnail, url: "javascript:alert(1)" },
    { ...thumbnail, width: 0 },
    { ...thumbnail, public_id: "" },
    "not-an-object",
  ])("rejects a malformed thumbnail %#", (bad) => {
    expect(errorsFor({ ...valid, thumbnail: bad }).thumbnail).toBeDefined();
  });

  it("accepts a same-site image path for the MySQL image storage", () => {
    expect(errorsFor({ ...valid, thumbnail: { ...thumbnail, url: "/images/01ABC.webp" } })).toEqual(
      {},
    );
  });
});

describe("pickProjectFields (API-04 merge)", () => {
  it("keeps only known fields", () => {
    expect(
      pickProjectFields({ published: false, id: "x", slug: "y", created_at: "z", __proto__: {} }),
    ).toEqual({ published: false });
  });

  it("rejects anything that is not an object", () => {
    for (const body of [undefined, null, [], "text", 1]) expect(pickProjectFields(body)).toBeNull();
  });

  it("a partial patch keeps stored values and still enforces the publish rule", () => {
    const stored = { ...valid, published: false, thumbnail: null };
    const merged = projectInputSchema.safeParse({
      ...stored,
      ...pickProjectFields({ published: true }),
    });
    expect(merged.success).toBe(false);

    const renamed = projectInputSchema.parse({
      ...valid,
      ...pickProjectFields({ title_en: "New" }),
    });
    expect(renamed).toMatchObject({ title_en: "New", show_on_home: true, group: "web" });
  });
});

describe("isValidLiveUrl", () => {
  it("accepts ordinary https sites", () => {
    expect(isValidLiveUrl("https://staging0.rifaldiradya.com")).toBe(true);
    expect(isValidLiveUrl("https://example.com/path?q=1#top")).toBe(true);
  });
});

describe("slugify / uniqueSlug", () => {
  it.each([
    ["Coffee Shop Landing Page", "coffee-shop-landing-page"],
    ["  Café & Bistro — Menu!  ", "cafe-bistro-menu"],
    ["Next.js + Tailwind", "next-js-tailwind"],
    ["日本語", "project"],
    ["---", "project"],
  ])("%s → %s", (title, slug) => {
    expect(slugify(title)).toBe(slug);
  });

  it("caps the base so a suffix still fits the 100-character column", () => {
    const slug = slugify("word ".repeat(40));
    expect(slug.length).toBeLessThanOrEqual(90);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("adds -2, -3… on collision", () => {
    expect(uniqueSlug("coffee", [])).toBe("coffee");
    expect(uniqueSlug("coffee", ["coffee"])).toBe("coffee-2");
    expect(uniqueSlug("coffee", ["coffee", "coffee-2", "coffee-3"])).toBe("coffee-4");
  });
});

describe("readJsonBody", () => {
  const post = (body: string, headers: Record<string, string> = {}) =>
    new Request("https://rifaldiradya.com/api/admin/projects", { method: "POST", body, headers });

  it("parses JSON", async () => {
    await expect(readJsonBody(post('{"a":1}'))).resolves.toEqual({ a: 1 });
  });

  it("returns undefined for invalid, empty, or oversized bodies", async () => {
    await expect(readJsonBody(post("{nope"))).resolves.toBeUndefined();
    await expect(readJsonBody(post(""))).resolves.toBeUndefined();
    await expect(
      readJsonBody(post(JSON.stringify({ a: "x".repeat(MAX_JSON_BYTES) }))),
    ).resolves.toBeUndefined();
  });

  it("stops reading a chunked body (no Content-Length) once it is too large", async () => {
    const chunk = new TextEncoder().encode("x".repeat(1024));
    let pulled = 0;
    // Never ends: reading it whole would hang the test.
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled++;
        controller.enqueue(chunk);
      },
    });
    const request = new Request("https://rifaldiradya.com/api/admin/login", {
      method: "POST",
      body,
      duplex: "half",
    } as RequestInit);
    await expect(readJsonBody(request)).resolves.toBeUndefined();
    expect(pulled).toBeLessThan(MAX_JSON_BYTES / 1024 + 5);
  });
});
