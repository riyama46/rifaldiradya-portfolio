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
  it("starts as App Flow UF-07 step 1: empty, draft, not on the homepage, no position", () => {
    expect(emptyValues).toMatchObject({ published: false, show_on_home: false, tags: [] });
    expect(emptyValues).not.toHaveProperty("sort_order");
  });

  it("a filled draft is valid; publishing it without an image is not (E-16)", () => {
    expect(validate(filled)).toEqual({});
    expect(validate({ ...filled, published: true })).toHaveProperty("thumbnail");
  });

  it("until T-26, publishing reports the v2 case fields this form doesn't have yet", () => {
    const errors = validate({
      ...filled,
      published: true,
      thumbnail,
      thumbnail_alt_en: "a",
      thumbnail_alt_id: "b",
    });
    expect(Object.keys(errors).sort()).toEqual(
      ["case_did_en", "case_did_id", "case_is_en", "case_is_id"]
        .concat(["meta_en", "meta_id", "status_en", "status_id"])
        .sort(),
    );
  });

  it("an empty live URL is reported with the case button wording (AC-8)", () => {
    expect(validate({ ...filled, live_url: "" }).live_url).toBe(
      "Add a live URL, or choose another button.",
    );
  });

  it("reports the first error in on-screen order", () => {
    const errors = validate(emptyValues);
    expect(firstErrorField(errors)).toBe("title_en");
    expect(firstErrorField({ thumbnail: "bad", live_url: "bad" })).toBe("live_url");
    expect(firstErrorField({})).toBeNull();
  });

  it("never sends a position (it only changes with ↑/↓ on the list)", () => {
    expect(toPayload(filled)).not.toHaveProperty("sort_order");
  });

  it("drops alt text when there is no image", () => {
    const payload = toPayload({ ...filled, thumbnail_alt_en: "left over" });
    expect(payload.thumbnail_alt_en).toBeNull();
  });

  it("round-trips a stored project and detects changes", () => {
    const values = valuesFromInput(toPayload(filled));
    expect(values).toEqual(filled);
    expect(isDirty(values, { ...values })).toBe(false);
    expect(isDirty(values, { ...values, show_on_home: true })).toBe(true);
  });
});

describe("addTags (chip input)", () => {
  it("adds trimmed tags, including several separated by commas", () => {
    expect(addTags([], " Next.js , Tailwind ")).toEqual({
      tags: ["Next.js", "Tailwind"],
      error: null,
    });
  });

  it("refuses duplicates (case-insensitive), a 7th item, and items over 24 characters", () => {
    expect(addTags(["Next.js"], "next.js").error).toMatch(/already added/);
    expect(addTags(["a", "b", "c", "d", "e", "f"], "g")).toEqual({
      tags: ["a", "b", "c", "d", "e", "f"],
      error: "Use up to 6 items.",
    });
    expect(addTags([], "x".repeat(25)).error).toBe("Keep it under 24 characters (25 now).");
  });

  it("ignores empty input", () => {
    expect(addTags(["a"], " , ")).toEqual({ tags: ["a"], error: null });
  });
});
