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

const valid = {
  title_en: "Coffee Shop Landing Page",
  title_id: "Landing Page Kedai Kopi",
  summary_en: "One-page site with menu and location.",
  summary_id: "Situs satu halaman dengan menu dan lokasi.",
  live_url: "https://staging0.rifaldiradya.com",
  tags: ["Next.js", "Tailwind"],
  thumbnail,
  thumbnail_alt_en: "Homepage of a coffee shop site",
  thumbnail_alt_id: "Beranda situs kedai kopi",
  featured: true,
  published: true,
};

const errorsFor = (input: unknown) => {
  const result = projectInputSchema.safeParse(input);
  return result.success ? {} : fieldErrors(result.error);
};

describe("projectInputSchema: valid input", () => {
  it("accepts a complete published project and trims text", () => {
    const result = projectInputSchema.parse({ ...valid, title_en: "  Coffee Shop  " });
    expect(result.title_en).toBe("Coffee Shop");
    expect(result.published).toBe(true);
  });

  it("fills the App Flow defaults for a new draft", () => {
    const draft = projectInputSchema.parse({
      ...valid,
      thumbnail: undefined,
      thumbnail_alt_en: undefined,
      thumbnail_alt_id: undefined,
      tags: undefined,
      featured: undefined,
      published: undefined,
    });
    expect(draft).toMatchObject({
      tags: [],
      thumbnail: null,
      featured: false,
      published: false,
    });
  });

  it("allows a draft without a thumbnail (E-17) and drops stray alt text", () => {
    const draft = projectInputSchema.parse({ ...valid, published: false, thumbnail: null });
    expect(draft.thumbnail).toBeNull();
    expect(draft.thumbnail_alt_en).toBeNull();
    expect(draft.thumbnail_alt_id).toBeNull();
  });
});

describe("projectInputSchema: App Flow section 11 messages", () => {
  it("requires every text field", () => {
    expect(errorsFor({})).toMatchObject({
      title_en: "Title (EN) is required.",
      title_id: "Title (ID) is required.",
      summary_en: "Summary (EN) is required.",
      summary_id: "Summary (ID) is required.",
      live_url: "Live URL is required.",
    });
    expect(errorsFor({ ...valid, title_en: "   " }).title_en).toBe("Title (EN) is required.");
  });

  it("reports the limit and the current length", () => {
    expect(errorsFor({ ...valid, title_en: "x".repeat(81) }).title_en).toBe(
      "Keep it under 80 characters (81 now).",
    );
    expect(errorsFor({ ...valid, summary_id: "x".repeat(170) }).summary_id).toBe(
      "Keep it under 160 characters (170 now).",
    );
    expect(errorsFor({ ...valid, thumbnail_alt_en: "x".repeat(141) }).thumbnail_alt_en).toBe(
      "Keep it under 140 characters (141 now).",
    );
    expect(errorsFor({ ...valid, title_en: "x".repeat(80) })).toEqual({});
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

  it("limits tags to 4 unique (case-insensitive) items of 1–24 characters", () => {
    expect(errorsFor({ ...valid, tags: ["a", "b", "c", "d", "e"] }).tags).toBe("Use up to 4 tags.");
    expect(errorsFor({ ...valid, tags: ["Next.js", "next.js"] }).tags).toMatch(/already added/);
    expect(errorsFor({ ...valid, tags: ["x".repeat(25)] }).tags).toBe(
      "Keep it under 24 characters (25 now).",
    );
    expect(errorsFor({ ...valid, tags: ["  "] }).tags).toBeDefined();
  });

  it("E-16: publishing needs a thumbnail", () => {
    expect(errorsFor({ ...valid, thumbnail: null }).thumbnail).toBe(
      "Add a thumbnail and alt text to publish, or turn off Published to save as draft.",
    );
  });

  it("requires both alt texts whenever there is a thumbnail, draft or not", () => {
    const errors = errorsFor({
      ...valid,
      published: false,
      thumbnail_alt_en: "",
      thumbnail_alt_id: null,
    });
    expect(errors).toMatchObject({
      thumbnail_alt_en: "Thumbnail alt (EN) is required.",
      thumbnail_alt_id: "Thumbnail alt (ID) is required.",
    });
  });

  it("shows every problem at once, not only the first", () => {
    const errors = errorsFor({ ...valid, title_id: "", live_url: "http://x.com", thumbnail: null });
    expect(Object.keys(errors).sort()).toEqual(["live_url", "thumbnail", "title_id"]);
  });

  it("ignores a position sent with the project (only API-08 changes it)", () => {
    const parsed = projectInputSchema.parse({ ...valid, sort_order: 1 });
    expect(parsed).not.toHaveProperty("sort_order");
    expect(pickProjectFields({ sort_order: 1, featured: false })).toEqual({ featured: false });
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

  it("rejects non-boolean switches", () => {
    expect(errorsFor({ ...valid, published: "true" }).published).toBeDefined();
    expect(errorsFor({ ...valid, featured: 1 }).featured).toBeDefined();
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
    expect(renamed).toMatchObject({ title_en: "New", featured: true });
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
});
