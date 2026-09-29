import type { UploadedImage } from "@/components/admin/ImageUploader";
import {
  fieldErrors,
  projectInputSchema,
  TAG_MAX,
  TAGS_MAX,
  messages,
  type ProjectField,
  type ProjectInputRaw,
} from "@/lib/projects/validation";

// Form state for S-12/S-13 and its mapping to ProjectInput. Pure, so it is unit tested.

export type FormValues = {
  title_en: string;
  title_id: string;
  summary_en: string;
  summary_id: string;
  live_url: string;
  tags: string[];
  thumbnail: UploadedImage | null;
  thumbnail_alt_en: string;
  thumbnail_alt_id: string;
  featured: boolean;
  published: boolean;
};

export type FieldErrors = Partial<Record<ProjectField, string>>;

/** UF-07 step 1: empty, Published off, Featured off (the server places a new project first). */
export const emptyValues: FormValues = {
  title_en: "",
  title_id: "",
  summary_en: "",
  summary_id: "",
  live_url: "",
  tags: [],
  thumbnail: null,
  thumbnail_alt_en: "",
  thumbnail_alt_id: "",
  featured: false,
  published: false,
};

export function valuesFromInput(input: ProjectInputRaw): FormValues {
  return {
    title_en: input.title_en ?? "",
    title_id: input.title_id ?? "",
    summary_en: input.summary_en ?? "",
    summary_id: input.summary_id ?? "",
    live_url: input.live_url ?? "",
    tags: input.tags ?? [],
    thumbnail: input.thumbnail ?? null,
    thumbnail_alt_en: input.thumbnail_alt_en ?? "",
    thumbnail_alt_id: input.thumbnail_alt_id ?? "",
    featured: input.featured ?? false,
    published: input.published ?? false,
  };
}

export function toPayload(values: FormValues): ProjectInputRaw {
  return {
    ...values,
    thumbnail_alt_en: values.thumbnail ? values.thumbnail_alt_en : null,
    thumbnail_alt_id: values.thumbnail ? values.thumbnail_alt_id : null,
  };
}

/** Same schema as the server (App Flow: client validation on blur + server validation on submit). */
export function validate(values: FormValues): FieldErrors {
  const result = projectInputSchema.safeParse(toPayload(values));
  return result.success ? {} : fieldErrors(result.error);
}

/** Order of fields on screen, for "focus the first error". */
export const fieldOrder: ProjectField[] = [
  "title_en",
  "title_id",
  "summary_en",
  "summary_id",
  "live_url",
  "tags",
  "thumbnail",
  "thumbnail_alt_en",
  "thumbnail_alt_id",
  "featured",
  "published",
];

export const firstErrorField = (errors: FieldErrors) =>
  fieldOrder.find((field) => errors[field] !== undefined) ?? null;

export const isDirty = (initial: FormValues, current: FormValues) =>
  JSON.stringify(initial) !== JSON.stringify(current);

/** Chip input (App Flow S-12 field 6): Enter or comma adds; 0–4 unique tags of 1–24 characters. */
export function addTags(tags: string[], raw: string): { tags: string[]; error: string | null } {
  let next = [...tags];
  for (const part of raw.split(",")) {
    const tag = part.trim();
    if (!tag) continue;
    if (next.some((existing) => existing.toLocaleLowerCase("en") === tag.toLocaleLowerCase("en"))) {
      return { tags: next, error: messages.duplicateTag(tag) };
    }
    if (tag.length > TAG_MAX) return { tags: next, error: messages.tooLong(TAG_MAX, tag.length) };
    if (next.length >= TAGS_MAX) return { tags: next, error: messages.tooManyTags };
    next = [...next, tag];
  }
  return { tags: next, error: null };
}
