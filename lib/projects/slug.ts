// Slug rules (App Flow section 9): kebab-case from title_en, unique, "-2", "-3"… on collision.
// The column is varchar(100); the base is capped lower so a numeric suffix always fits.
const BASE_MAX = 90;

export function slugify(title: string): string {
  const base = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // "Café" → "Cafe"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, BASE_MAX)
    .replace(/-+$/, "");
  return base || "project";
}

/** First free slug among base, base-2, base-3, … given the slugs already taken. */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
}
