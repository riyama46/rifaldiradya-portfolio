import { z } from "zod";

// No `new Function` probe: under the CSP (no 'unsafe-eval', T-20) the caught attempt is still
// reported as a violation in the admin form. The plain parser is plenty fast for one form.
z.config({ jitless: true });

// ProjectInput (App Flow section 10, v2: CHANGE v2.0.0 Delta APP_FLOW sections 6, 9, 10). Shared by
// the admin form (client, on blur) and API-03/04 (server), so it must not import anything
// server-only. The position (sort_order) is not part of it: it is changed only with the ↑/↓
// buttons on S-11 (API-08) and kept as 1…n by lib/projects/mutations.ts. The limit of 5
// show_on_home projects (E-26) needs the database, so it is checked in mutations.ts.
//
// Which rules apply when:
// - always: lengths, enums, URL shape, alt text whenever there is a screenshot, and a live URL
//   whenever the case button opens the site;
// - only to publish: the "publish" text fields of S-12 and the chosen visual (drafts may be
//   incomplete, E-17). A published v1 project without v2 fields stays valid until it is edited
//   (E-27): then the whole merged input is checked like any other save.

export const TITLE_MAX = 80;
export const SUMMARY_MAX = 160;
export const META_MAX = 40;
export const SIDE_MAX = 20;
export const CASE_IS_MAX = 220;
export const CASE_DID_LINES_MAX = 8;
export const CASE_DID_LINE_MAX = 160;
export const STATUS_MAX = 40;
export const LIVE_URL_MAX = 300;
export const TAGS_MAX = 6;
export const TAG_MAX = 24;
export const ALT_MAX = 140;
export const CARD_NUMBER_MAX = 12;
export const CARD_CAPTION_MAX = 60;
export const SHOW_ON_HOME_MAX = 5;

// Filter and Work sub order (D-43): HR automation first. `panasonic` is labelled "HR systems".
export const PROJECT_GROUPS = ["automation", "panasonic", "web", "ai"] as const;
export const CASE_ACTIONS = ["site", "walkthrough", "none"] as const;
export const VISUAL_TYPES = ["screenshot", "number"] as const;

export type ProjectGroup = (typeof PROJECT_GROUPS)[number];
export type CaseAction = (typeof CASE_ACTIONS)[number];
export type VisualType = (typeof VISUAL_TYPES)[number];

/** Request keys in on-screen order (S-12/S-13), with their admin labels. */
export const fieldLabels = {
  title_en: "Title (EN)",
  title_id: "Title (ID)",
  group: "Group",
  meta_en: "Meta line (EN)",
  meta_id: "Meta line (ID)",
  side_en: "Side (EN)",
  side_id: "Side (ID)",
  summary_en: "Short description (EN)",
  summary_id: "Short description (ID)",
  show_on_home: "Show in Selected work",
  case_is_en: "What it is (EN)",
  case_is_id: "What it is (ID)",
  case_did_en: "What I did (EN)",
  case_did_id: "What I did (ID)",
  tags: "Stack",
  status_en: "Status (EN)",
  status_id: "Status (ID)",
  case_action: "Case action",
  live_url: "Live URL",
  demo_url: "Demo video URL",
  repo_url: "Code repository URL",
  visual_type: "Visual type",
  thumbnail: "Screenshot",
  thumbnail_alt_en: "Screenshot alt (EN)",
  thumbnail_alt_id: "Screenshot alt (ID)",
  card_number: "Number",
  card_caption_en: "Caption (EN)",
  card_caption_id: "Caption (ID)",
  published: "Published",
} as const;

export type ProjectField = keyof typeof fieldLabels;

export const messages = {
  required: (field: ProjectField) => `${fieldLabels[field]} is required.`,
  tooLong: (max: number, current: number) => `Keep it under ${max} characters (${current} now).`,
  url: "URL must start with https:// and be a full address.",
  liveUrlForSite: "Add a live URL, or choose another button.",
  tooManyTags: `Use up to ${TAGS_MAX} items.`,
  duplicateTag: (tag: string) => `"${tag}" is already added. Each item must be unique.`,
  tooManyLines: `Use up to ${CASE_DID_LINES_MAX} lines.`,
  publishIncomplete:
    "Add a screenshot and alt text to publish, or turn off Published to save as draft.",
  showOnHomeFull: `Selected work already has ${SHOW_ON_HOME_MAX} projects. Turn one off first.`,
  invalid: (field: ProjectField) => `${fieldLabels[field]} is not valid.`,
} as const;

const tooLong = (max: number) => ({
  error: (issue: { input?: unknown }) => messages.tooLong(max, String(issue.input).length),
});

function requiredText(field: ProjectField, max: number) {
  const required = messages.required(field);
  return z.string({ error: required }).trim().min(1, required).max(max, tooLong(max));
}

/** Text that may be empty while drafting: trimmed, "" and missing are stored as null. */
function optionalText(field: ProjectField, max: number) {
  return z
    .string({ error: messages.invalid(field) })
    .trim()
    .max(max, tooLong(max))
    .nullish()
    .transform((value) => value || null);
}

/** What I did: blank lines are dropped on save, then 1–8 lines of 1–160. Empty is stored as null. */
function caseLines(field: ProjectField) {
  return z
    .array(z.string({ error: messages.invalid(field) }), { error: messages.invalid(field) })
    .nullish()
    .transform((lines) => (lines ?? []).map((line) => line.trim()).filter(Boolean))
    .pipe(
      z
        .array(z.string().max(CASE_DID_LINE_MAX, tooLong(CASE_DID_LINE_MAX)))
        .max(CASE_DID_LINES_MAX, messages.tooManyLines),
    )
    .transform((lines) => (lines.length > 0 ? lines : null));
}

const enumField = <T extends readonly [string, ...string[]]>(
  values: T,
  field: ProjectField,
  fallback: T[number],
) => z.enum(values, { error: messages.invalid(field) }).default(fallback);

const booleanField = (field: ProjectField) =>
  z.boolean({ error: messages.invalid(field) }).default(false);

/** https only, a real host with a dot, and no credentials in the URL. */
export function isValidLiveUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.includes(".") &&
      !url.hostname.endsWith(".") &&
      url.username === "" &&
      url.password === ""
    );
  } catch {
    return false;
  }
}

/** Where a stored thumbnail may live: an https URL or a same-site path (never protocol-relative). */
function isImageLocation(value: string): boolean {
  if (value.startsWith("/")) return !value.startsWith("//") && !value.includes("\\");
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

const thumbnailSchema = z.object(
  {
    public_id: z.string().trim().min(1).max(255),
    url: z.string().trim().min(1).max(500).refine(isImageLocation),
    width: z.number().int().min(1).max(10_000),
    height: z.number().int().min(1).max(10_000),
  },
  { error: messages.invalid("thumbnail") },
);

const tagsSchema = z
  .array(
    z
      .string({ error: messages.invalid("tags") })
      .trim()
      .min(1, messages.invalid("tags"))
      .max(TAG_MAX, tooLong(TAG_MAX)),
    { error: messages.invalid("tags") },
  )
  .max(TAGS_MAX, messages.tooManyTags)
  .superRefine((tags, ctx) => {
    const seen = new Set<string>();
    for (const tag of tags) {
      const key = tag.toLocaleLowerCase("en");
      if (seen.has(key)) {
        ctx.addIssue({ code: "custom", message: messages.duplicateTag(tag) });
        return;
      }
      seen.add(key);
    }
  });

/** An optional https link (live site, demo video, code repository): "" and missing are null. */
const linkSchema = (field: ProjectField) =>
  z
    .string({ error: messages.invalid(field) })
    .trim()
    .max(LIVE_URL_MAX, tooLong(LIVE_URL_MAX))
    .refine((value) => value === "" || isValidLiveUrl(value), messages.url)
    .nullish()
    .transform((value) => value || null);

const projectShape = {
  title_en: requiredText("title_en", TITLE_MAX),
  title_id: requiredText("title_id", TITLE_MAX),
  group: enumField(PROJECT_GROUPS, "group", "web"),
  meta_en: optionalText("meta_en", META_MAX),
  meta_id: optionalText("meta_id", META_MAX),
  side_en: optionalText("side_en", SIDE_MAX),
  side_id: optionalText("side_id", SIDE_MAX),
  summary_en: requiredText("summary_en", SUMMARY_MAX),
  summary_id: requiredText("summary_id", SUMMARY_MAX),
  show_on_home: booleanField("show_on_home"),
  case_is_en: optionalText("case_is_en", CASE_IS_MAX),
  case_is_id: optionalText("case_is_id", CASE_IS_MAX),
  case_did_en: caseLines("case_did_en"),
  case_did_id: caseLines("case_did_id"),
  tags: tagsSchema.default([]),
  status_en: optionalText("status_en", STATUS_MAX),
  status_id: optionalText("status_id", STATUS_MAX),
  case_action: enumField(CASE_ACTIONS, "case_action", "site"),
  live_url: linkSchema("live_url"),
  demo_url: linkSchema("demo_url"),
  repo_url: linkSchema("repo_url"),
  visual_type: enumField(VISUAL_TYPES, "visual_type", "screenshot"),
  thumbnail: thumbnailSchema.nullish().transform((value) => value ?? null),
  thumbnail_alt_en: optionalText("thumbnail_alt_en", ALT_MAX),
  thumbnail_alt_id: optionalText("thumbnail_alt_id", ALT_MAX),
  card_number: optionalText("card_number", CARD_NUMBER_MAX),
  card_caption_en: optionalText("card_caption_en", CARD_CAPTION_MAX),
  card_caption_id: optionalText("card_caption_id", CARD_CAPTION_MAX),
  published: booleanField("published"),
};

/** S-12 fields marked "required to publish" (besides the always-required title and summary). */
const PUBLISH_REQUIRED = [
  "meta_en",
  "meta_id",
  "case_is_en",
  "case_is_id",
  "case_did_en",
  "case_did_id",
  "status_en",
  "status_id",
] as const;

export const projectInputSchema = z
  .object(projectShape)
  .superRefine((input, ctx) => {
    const require = (field: ProjectField, message = messages.required(field)) =>
      ctx.addIssue({ code: "custom", path: [field], message });

    // AC-8: the case button can only open the site when there is one, draft or not.
    if (input.case_action === "site" && !input.live_url) {
      require("live_url", messages.liveUrlForSite);
    }
    // Alt text is required whenever there is an image (both languages).
    if (input.thumbnail) {
      for (const field of ["thumbnail_alt_en", "thumbnail_alt_id"] as const) {
        if (!input[field]) require(field);
      }
    }
    if (!input.published) return;

    for (const field of PUBLISH_REQUIRED) if (!input[field]) require(field);
    // E-16 (v2): publishing needs the chosen visual; the other one may stay stored.
    if (input.visual_type === "screenshot" && !input.thumbnail) {
      require("thumbnail", messages.publishIncomplete);
    }
    if (input.visual_type === "number") {
      for (const field of ["card_number", "card_caption_en", "card_caption_id"] as const) {
        if (!input[field]) require(field);
      }
    }
  })
  .transform((input) =>
    // Alt text without an image is meaningless; never store it.
    input.thumbnail ? input : { ...input, thumbnail_alt_en: null, thumbnail_alt_id: null },
  );

/**
 * API-04 accepts any subset of ProjectInput. The known keys are merged over the stored project and
 * the *whole* result is validated with projectInputSchema, so cross-field rules (publish needs an
 * image) still hold and defaults never overwrite stored values. Unknown keys, including the
 * deprecated `featured` (D-22), are dropped. Returns null when the body is not a JSON object.
 */
export function pickProjectFields(body: unknown): Record<string, unknown> | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  return Object.fromEntries(
    Object.entries(body).filter(([key]) => Object.hasOwn(fieldLabels, key)),
  );
}

export type ProjectInput = z.output<typeof projectInputSchema>;
export type ProjectInputRaw = z.input<typeof projectInputSchema>;

/** One message per field (the first), keyed like the request body, for `error.fields`. */
export function fieldErrors(error: z.ZodError): Partial<Record<ProjectField, string>> {
  const fields: Partial<Record<ProjectField, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && key in fieldLabels && !(key in fields)) {
      fields[key as ProjectField] = issue.message;
    }
  }
  return fields;
}
