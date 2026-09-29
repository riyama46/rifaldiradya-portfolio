import { z } from "zod";

// No `new Function` probe: under the CSP (no 'unsafe-eval', T-20) the caught attempt is still
// reported as a violation in the admin form. The plain parser is plenty fast for one form.
z.config({ jitless: true });

// ProjectInput (App Flow section 10) with the field rules of sections 6 and 9 and the admin error
// messages of section 11. Shared by the admin form (client, on blur) and API-03/04 (server), so it
// must not import anything server-only. The position (sort_order) is not part of it: it is changed
// only with the ↑/↓ buttons on S-11 (API-08) and kept as 1…n by lib/projects/mutations.ts.

export const TITLE_MAX = 80;
export const SUMMARY_MAX = 160;
export const LIVE_URL_MAX = 300;
export const TAGS_MAX = 4;
export const TAG_MAX = 24;
export const ALT_MAX = 140;

export const fieldLabels = {
  title_en: "Title (EN)",
  title_id: "Title (ID)",
  summary_en: "Summary (EN)",
  summary_id: "Summary (ID)",
  live_url: "Live URL",
  tags: "Tags",
  thumbnail: "Thumbnail",
  thumbnail_alt_en: "Thumbnail alt (EN)",
  thumbnail_alt_id: "Thumbnail alt (ID)",
  featured: "Featured",
  published: "Published",
} as const;

export type ProjectField = keyof typeof fieldLabels;

export const messages = {
  required: (field: ProjectField) => `${fieldLabels[field]} is required.`,
  tooLong: (max: number, current: number) => `Keep it under ${max} characters (${current} now).`,
  url: "URL must start with https:// and be a full address.",
  tooManyTags: `Use up to ${TAGS_MAX} tags.`,
  duplicateTag: (tag: string) => `"${tag}" is already added. Each tag must be unique.`,
  publishIncomplete:
    "Add a thumbnail and alt text to publish, or turn off Published to save as draft.",
  invalid: (field: ProjectField) => `${fieldLabels[field]} is not valid.`,
} as const;

function requiredText(field: ProjectField, max: number) {
  const required = messages.required(field);
  return z
    .string({ error: required })
    .trim()
    .min(1, required)
    .max(max, { error: (issue) => messages.tooLong(max, String(issue.input).length) });
}

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

const optionalAlt = () =>
  z
    .string()
    .trim()
    .max(ALT_MAX, { error: (issue) => messages.tooLong(ALT_MAX, String(issue.input).length) })
    .nullish()
    .transform((value) => value || null);

const tagsSchema = z
  .array(
    z
      .string({ error: messages.invalid("tags") })
      .trim()
      .min(1, messages.invalid("tags"))
      .max(TAG_MAX, { error: (issue) => messages.tooLong(TAG_MAX, String(issue.input).length) }),
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

const projectShape = {
  title_en: requiredText("title_en", TITLE_MAX),
  title_id: requiredText("title_id", TITLE_MAX),
  summary_en: requiredText("summary_en", SUMMARY_MAX),
  summary_id: requiredText("summary_id", SUMMARY_MAX),
  live_url: z
    .string({ error: messages.required("live_url") })
    .trim()
    .min(1, messages.required("live_url"))
    .max(LIVE_URL_MAX, {
      error: (issue) => messages.tooLong(LIVE_URL_MAX, String(issue.input).length),
    })
    .refine(isValidLiveUrl, messages.url),
  tags: tagsSchema.default([]),
  thumbnail: thumbnailSchema.nullish().transform((value) => value ?? null),
  thumbnail_alt_en: optionalAlt(),
  thumbnail_alt_id: optionalAlt(),
  featured: z.boolean({ error: messages.invalid("featured") }).default(false),
  published: z.boolean({ error: messages.invalid("published") }).default(false),
};

export const projectInputSchema = z
  .object(projectShape)
  .superRefine((input, ctx) => {
    // Alt text is required whenever there is an image (both languages).
    if (input.thumbnail) {
      for (const field of ["thumbnail_alt_en", "thumbnail_alt_id"] as const) {
        if (!input[field])
          ctx.addIssue({ code: "custom", path: [field], message: messages.required(field) });
      }
    }
    // E-16: publishing needs the image and its alt text; drafts may skip them (E-17).
    if (input.published && !input.thumbnail) {
      ctx.addIssue({ code: "custom", path: ["thumbnail"], message: messages.publishIncomplete });
    }
  })
  .transform((input) =>
    // Alt text without an image is meaningless; never store it.
    input.thumbnail ? input : { ...input, thumbnail_alt_en: null, thumbnail_alt_id: null },
  );

/**
 * API-04 accepts any subset of ProjectInput. The known keys are merged over the stored project and
 * the *whole* result is validated with projectInputSchema, so cross-field rules (publish needs an
 * image) still hold and defaults never overwrite stored values. Unknown keys are dropped.
 * Returns null when the body is not a JSON object.
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
