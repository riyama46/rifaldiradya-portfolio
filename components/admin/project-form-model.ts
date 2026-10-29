import type { UploadedImage } from "@/components/admin/ImageUploader";
import {
  CASE_DID_LINES_MAX,
  fieldErrors,
  fieldLabels,
  projectInputSchema,
  TAG_MAX,
  TAGS_MAX,
  messages,
  type CaseAction,
  type ProjectField,
  type ProjectGroup,
  type ProjectInputRaw,
  type VisualType,
} from "@/lib/projects/validation";

// Form state for S-12/S-13 (CHANGE v2.0.0 Delta APP_FLOW section 6) and its mapping to
// ProjectInput. Pure, so it is unit tested. Every field is sent on save; the shared schema trims
// text and turns "" into null, and drops blank "What I did" lines.

export type FormValues = {
  title_en: string;
  title_id: string;
  group: ProjectGroup;
  meta_en: string;
  meta_id: string;
  side_en: string;
  side_id: string;
  summary_en: string;
  summary_id: string;
  show_on_home: boolean;
  case_is_en: string;
  case_is_id: string;
  case_did_en: string[];
  case_did_id: string[];
  tags: string[];
  status_en: string;
  status_id: string;
  case_action: CaseAction;
  live_url: string;
  demo_url: string;
  repo_url: string;
  visual_type: VisualType;
  thumbnail: UploadedImage | null;
  thumbnail_alt_en: string;
  thumbnail_alt_id: string;
  card_number: string;
  card_caption_en: string;
  card_caption_id: string;
  published: boolean;
};

export type FieldErrors = Partial<Record<ProjectField, string>>;

/** UF-07 step 1: empty, Published off, not in Selected work (the server places it first). */
export const emptyValues: FormValues = {
  title_en: "",
  title_id: "",
  group: "web",
  meta_en: "",
  meta_id: "",
  side_en: "",
  side_id: "",
  summary_en: "",
  summary_id: "",
  show_on_home: false,
  case_is_en: "",
  case_is_id: "",
  case_did_en: [""],
  case_did_id: [""],
  tags: [],
  status_en: "",
  status_id: "",
  case_action: "site",
  live_url: "",
  demo_url: "",
  repo_url: "",
  visual_type: "screenshot",
  thumbnail: null,
  thumbnail_alt_en: "",
  thumbnail_alt_id: "",
  card_number: "",
  card_caption_en: "",
  card_caption_id: "",
  published: false,
};

/** Stored lines, or one empty line to type into. */
const lines = (value: string[] | null | undefined) => (value && value.length > 0 ? value : [""]);

export function valuesFromInput(input: ProjectInputRaw): FormValues {
  return {
    title_en: input.title_en ?? "",
    title_id: input.title_id ?? "",
    group: input.group ?? "web",
    meta_en: input.meta_en ?? "",
    meta_id: input.meta_id ?? "",
    side_en: input.side_en ?? "",
    side_id: input.side_id ?? "",
    summary_en: input.summary_en ?? "",
    summary_id: input.summary_id ?? "",
    show_on_home: input.show_on_home ?? false,
    case_is_en: input.case_is_en ?? "",
    case_is_id: input.case_is_id ?? "",
    case_did_en: lines(input.case_did_en),
    case_did_id: lines(input.case_did_id),
    tags: input.tags ?? [],
    status_en: input.status_en ?? "",
    status_id: input.status_id ?? "",
    case_action: input.case_action ?? "site",
    live_url: input.live_url ?? "",
    demo_url: input.demo_url ?? "",
    repo_url: input.repo_url ?? "",
    visual_type: input.visual_type ?? "screenshot",
    thumbnail: input.thumbnail ?? null,
    thumbnail_alt_en: input.thumbnail_alt_en ?? "",
    thumbnail_alt_id: input.thumbnail_alt_id ?? "",
    card_number: input.card_number ?? "",
    card_caption_en: input.card_caption_en ?? "",
    card_caption_id: input.card_caption_id ?? "",
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

/** Order of fields on screen (S-12 table order), for "focus the first error" and the summary. */
export const fieldOrder = Object.keys(fieldLabels) as ProjectField[];

export const firstErrorField = (errors: FieldErrors) =>
  fieldOrder.find((field) => errors[field] !== undefined) ?? null;

export const isDirty = (initial: FormValues, current: FormValues) =>
  JSON.stringify(initial) !== JSON.stringify(current);

/** Fields that belong to each Visual type; the other type's pane is hidden unless it has errors. */
export const visualFields: Record<VisualType, ProjectField[]> = {
  screenshot: ["thumbnail", "thumbnail_alt_en", "thumbnail_alt_id"],
  number: ["card_number", "card_caption_en", "card_caption_id"],
};

/** "What I did" (LinesInput): add a line at the end, up to 8. */
export const canAddLine = (current: string[]) => current.length < CASE_DID_LINES_MAX;

export const addLine = (current: string[]) => (canAddLine(current) ? [...current, ""] : current);

/** Removing the last remaining line leaves one empty line, so there is always a field to type in. */
export function removeLine(current: string[], index: number) {
  const next = current.filter((_, position) => position !== index);
  return next.length > 0 ? next : [""];
}

/**
 * Pasting several lines into one "What I did" field: an <input> would drop the line breaks and
 * join them, so each pasted line becomes its own line, starting at the cursor. Blank pasted lines
 * are skipped. More than 8 lines are kept and flagged by validation instead of being cut off.
 * Returns null for a single-line paste (the input handles it).
 */
export function pasteLines(
  current: string[],
  index: number,
  text: string,
  selectionStart: number,
  selectionEnd: number,
): { lines: string[]; focus: number } | null {
  const pasted = text.split(/\r\n|\r|\n/).filter((line) => line.trim() !== "");
  if (pasted.length < 2) return null;

  const line = current[index] ?? "";
  const before = line.slice(0, selectionStart);
  const after = line.slice(selectionEnd);
  const inserted = pasted.map((part, position) =>
    [position === 0 ? before : "", part, position === pasted.length - 1 ? after : ""].join(""),
  );
  return {
    lines: [...current.slice(0, index), ...inserted, ...current.slice(index + 1)],
    focus: index + inserted.length - 1,
  };
}

/** Lines that will be saved (blank ones are dropped), for the "n lines, max 8" counter. */
export const filledLines = (current: string[]) =>
  current.filter((line) => line.trim() !== "").length;

/** Chip input (S-12 Stack): Enter or comma adds; 0–6 unique items of 1–24 characters. */
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

export type PreviewLanguage = "en" | "id";

export type ProjectPreviewData = {
  label: string;
  title: string;
  summary: string;
  visual:
    | { type: "number"; number: string; caption: string }
    | { type: "screenshot"; url: string; width: number; height: number }
    | null;
};

/**
 * S-12/S-13 preview panel (v2.1.0): what Selected work and the cursor preview (O-05) would show for
 * the current, unsaved values, with the same rules as the site (toPublicProject): the label is
 * "meta · side", and an incomplete visual shows nothing (E-33).
 */
export function previewOf(values: FormValues, lang: PreviewLanguage): ProjectPreviewData {
  const pick = (en: string, id: string) => (lang === "id" ? id : en).trim();
  const number = values.card_number.trim();
  const caption = pick(values.card_caption_en, values.card_caption_id);
  const image = values.thumbnail;
  const visual: ProjectPreviewData["visual"] =
    values.visual_type === "number"
      ? number && caption
        ? { type: "number", number, caption }
        : null
      : image
        ? { type: "screenshot", url: image.url, width: image.width, height: image.height }
        : null;
  return {
    label: [pick(values.meta_en, values.meta_id), pick(values.side_en, values.side_id)]
      .filter(Boolean)
      .join(" · "),
    title: pick(values.title_en, values.title_id),
    summary: pick(values.summary_en, values.summary_id),
    visual,
  };
}
