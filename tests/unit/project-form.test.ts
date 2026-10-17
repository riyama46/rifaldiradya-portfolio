import { describe, expect, it } from "vitest";
import {
  addLine,
  addTags,
  canAddLine,
  emptyValues,
  filledLines,
  firstErrorField,
  isDirty,
  removeLine,
  toPayload,
  validate,
  valuesFromInput,
  visualFields,
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

/** Every "required to publish" field filled in, with a number card as the visual. */
const complete: FormValues = {
  ...filled,
  meta_en: "Concept · Café",
  meta_id: "Konsep · Kafe",
  case_is_en: "A one-page site for a coffee shop.",
  case_is_id: "Situs satu halaman untuk kedai kopi.",
  case_did_en: ["Design and build.", ""],
  case_did_id: ["Desain dan pembuatan."],
  status_en: "Live, 2026",
  status_id: "Berjalan, 2026",
  visual_type: "number",
  card_number: "1",
  card_caption_en: "page",
  card_caption_id: "halaman",
  published: true,
};

describe("project form model", () => {
  it("starts as App Flow UF-07 step 1: empty, draft, not on the homepage, no position", () => {
    expect(emptyValues).toMatchObject({
      published: false,
      show_on_home: false,
      tags: [],
      group: "web",
      case_action: "site",
      visual_type: "screenshot",
      case_did_en: [""],
    });
    expect(emptyValues).not.toHaveProperty("sort_order");
  });

  it("a filled draft is valid; publishing it reports every missing publish field", () => {
    expect(validate(filled)).toEqual({});
    expect(Object.keys(validate({ ...filled, published: true })).sort()).toEqual(
      ["case_did_en", "case_did_id", "case_is_en", "case_is_id"]
        .concat(["meta_en", "meta_id", "status_en", "status_id", "thumbnail"])
        .sort(),
    );
  });

  it("publishes once every section is complete (blank lines don't count)", () => {
    expect(validate(complete)).toEqual({});
    expect(validate({ ...complete, case_did_en: ["", " "] })).toHaveProperty("case_did_en");
  });

  it("checks only the chosen visual", () => {
    expect(validate({ ...complete, card_caption_id: "" })).toHaveProperty("card_caption_id");
    expect(validate({ ...complete, visual_type: "screenshot" })).toHaveProperty("thumbnail");
    expect(validate({ ...complete, visual_type: "screenshot", thumbnail })).toMatchObject({
      thumbnail_alt_en: "Screenshot alt (EN) is required.",
    });
  });

  it("an empty live URL is reported with the case button wording (AC-8)", () => {
    expect(validate({ ...filled, live_url: "" }).live_url).toBe(
      "Add a live URL, or choose another button.",
    );
    expect(validate({ ...complete, live_url: "", case_action: "walkthrough" })).toEqual({});
    expect(validate({ ...complete, live_url: "", case_action: "none" })).toEqual({});
  });

  it("reports the first error in on-screen order", () => {
    const errors = validate(emptyValues);
    expect(firstErrorField(errors)).toBe("title_en");
    expect(firstErrorField({ thumbnail: "bad", live_url: "bad" })).toBe("live_url");
    expect(firstErrorField({ case_did_id: "bad", meta_en: "bad" })).toBe("meta_en");
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
    const values = valuesFromInput(toPayload(complete));
    expect(values).toEqual(complete);
    expect(isDirty(values, { ...values })).toBe(false);
    expect(isDirty(values, { ...values, show_on_home: true })).toBe(true);
  });

  it("gives a v1 project without v2 fields one empty line to type into (E-27)", () => {
    const values = valuesFromInput({ ...toPayload(filled), case_did_en: null, case_did_id: [] });
    expect(values.case_did_en).toEqual([""]);
    expect(values.case_did_id).toEqual([""]);
  });

  it("knows which fields belong to each visual pane", () => {
    expect(visualFields.number).toEqual(["card_number", "card_caption_en", "card_caption_id"]);
    expect(visualFields.screenshot).toEqual(["thumbnail", "thumbnail_alt_en", "thumbnail_alt_id"]);
  });
});

describe("What I did lines (LinesInput)", () => {
  it("adds lines up to 8", () => {
    expect(addLine(["a"])).toEqual(["a", ""]);
    const eight = Array<string>(8).fill("x");
    expect(canAddLine(eight)).toBe(false);
    expect(addLine(eight)).toBe(eight);
  });

  it("removes a line and always leaves one field", () => {
    expect(removeLine(["a", "b", "c"], 1)).toEqual(["a", "c"]);
    expect(removeLine(["a"], 0)).toEqual([""]);
  });

  it("counts only the lines that will be saved", () => {
    expect(filledLines(["a", " ", "", "b"])).toBe(2);
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
