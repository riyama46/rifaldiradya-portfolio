import { describe, expect, it } from "vitest";
import {
  addTags,
  emptyValues,
  firstErrorField,
  isDirty,
  toPayload,
  validate,
  valuesFromInput,
  type FormValues,
} from "@/components/admin/project-form-model";

const thumbnail = {
  public_id: "01JIMAGE000000000000000000",
  url: "/media/01JIMAGE000000000000000000.webp",
  width: 1600,
  height: 1000,
};

const filled: FormValues = {
  ...emptyValues,
  title_en: "Coffee Shop",
  title_id: "Kedai Kopi",
  summary_en: "Menu and location.",
  summary_id: "Menu dan lokasi.",
  live_url: "https://staging0.rifaldiradya.com",
  tags: ["Next.js"],
};

describe("project form model", () => {
  it("starts as App Flow UF-07 step 1: empty, draft, not featured, sort order 100", () => {
    expect(emptyValues).toMatchObject({
      published: false,
      featured: false,
      sort_order: "100",
      tags: [],
    });
  });

  it("a filled draft is valid; publishing it without an image is not (E-16)", () => {
    expect(validate(filled)).toEqual({});
    expect(validate({ ...filled, published: true })).toHaveProperty("thumbnail");
    expect(
      validate({
        ...filled,
        published: true,
        thumbnail,
        thumbnail_alt_en: "a",
        thumbnail_alt_id: "b",
      }),
    ).toEqual({});
  });

  it("reports the first error in on-screen order", () => {
    const errors = validate({ ...emptyValues, sort_order: "x" });
    expect(firstErrorField(errors)).toBe("title_en");
    expect(firstErrorField({ sort_order: "bad", live_url: "bad" })).toBe("live_url");
    expect(firstErrorField({})).toBeNull();
  });

  it("only turns plain digits into a sort order", () => {
    expect(toPayload({ ...filled, sort_order: " 20 " }).sort_order).toBe(20);
    expect(validate({ ...filled, sort_order: "12a" }).sort_order).toBe(
      "Use a whole number from 0 to 999.",
    );
    expect(validate({ ...filled, sort_order: "" }).sort_order).toBeDefined();
    expect(validate({ ...filled, sort_order: "1000" }).sort_order).toBeDefined();
  });

  it("drops alt text when there is no image", () => {
    const payload = toPayload({ ...filled, thumbnail_alt_en: "left over" });
    expect(payload.thumbnail_alt_en).toBeNull();
  });

  it("round-trips a stored project and detects changes", () => {
    const values = valuesFromInput({ ...toPayload(filled), sort_order: 10 });
    expect(values.sort_order).toBe("10");
    expect(isDirty(values, { ...values })).toBe(false);
    expect(isDirty(values, { ...values, featured: true })).toBe(true);
  });
});

describe("addTags (chip input)", () => {
  it("adds trimmed tags, including several separated by commas", () => {
    expect(addTags([], " Next.js , Tailwind ")).toEqual({
      tags: ["Next.js", "Tailwind"],
      error: null,
    });
  });

  it("refuses duplicates (case-insensitive), a 5th tag, and tags over 24 characters", () => {
    expect(addTags(["Next.js"], "next.js").error).toMatch(/already added/);
    expect(addTags(["a", "b", "c", "d"], "e")).toEqual({
      tags: ["a", "b", "c", "d"],
      error: "Use up to 4 tags.",
    });
    expect(addTags([], "x".repeat(25)).error).toBe("Keep it under 24 characters (25 now).");
  });

  it("ignores empty input", () => {
    expect(addTags(["a"], " , ")).toEqual({ tags: ["a"], error: null });
  });
});
