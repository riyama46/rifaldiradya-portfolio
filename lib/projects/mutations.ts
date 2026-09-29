import { eq, like, or } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { projects, type Project } from "@/lib/db/schema";
import { getProjectById } from "./queries";
import { slugify, uniqueSlug } from "./slug";
import type { ProjectInput, ProjectInputRaw } from "./validation";

// Writes for API-03/04 (SDD section 4: DB access stays in lib/projects and lib/auth).

/** Stored project → ProjectInput shape, the base that API-04 merges a partial body over. */
export function toProjectInput(project: Project): ProjectInputRaw {
  const hasThumbnail =
    project.thumbnailPublicId !== null &&
    project.thumbnailUrl !== null &&
    project.thumbnailWidth !== null &&
    project.thumbnailHeight !== null;

  return {
    title_en: project.titleEn,
    title_id: project.titleId,
    summary_en: project.summaryEn,
    summary_id: project.summaryId,
    live_url: project.liveUrl,
    tags: project.tags,
    thumbnail: hasThumbnail
      ? {
          public_id: project.thumbnailPublicId!,
          url: project.thumbnailUrl!,
          width: project.thumbnailWidth!,
          height: project.thumbnailHeight!,
        }
      : null,
    thumbnail_alt_en: project.thumbnailAltEn,
    thumbnail_alt_id: project.thumbnailAltId,
    sort_order: project.sortOrder,
    featured: project.featured,
    published: project.published,
  };
}

/** API response shape: ProjectInput fields plus the server-owned ones. */
export function toProjectJson(project: Project) {
  return {
    id: project.id,
    slug: project.slug,
    ...toProjectInput(project),
    created_at: project.createdAt.toISOString(),
    updated_at: project.updatedAt.toISOString(),
  };
}

function toColumns(input: ProjectInput) {
  return {
    titleEn: input.title_en,
    titleId: input.title_id,
    summaryEn: input.summary_en,
    summaryId: input.summary_id,
    liveUrl: input.live_url,
    tags: input.tags,
    thumbnailPublicId: input.thumbnail?.public_id ?? null,
    thumbnailUrl: input.thumbnail?.url ?? null,
    thumbnailWidth: input.thumbnail?.width ?? null,
    thumbnailHeight: input.thumbnail?.height ?? null,
    thumbnailAltEn: input.thumbnail_alt_en,
    thumbnailAltId: input.thumbnail_alt_id,
    sortOrder: input.sort_order,
    featured: input.featured,
    published: input.published,
  };
}

async function freeSlug(title: string): Promise<string> {
  const base = slugify(title);
  const rows = await getDb()
    .select({ slug: projects.slug })
    .from(projects)
    // base only contains [a-z0-9-], so it has no LIKE wildcards to escape.
    .where(or(eq(projects.slug, base), like(projects.slug, `${base}-%`)));
  return uniqueSlug(
    base,
    rows.map((row) => row.slug),
  );
}

const isDuplicateKey = (error: unknown) =>
  (error as { cause?: { code?: string }; code?: string })?.cause?.code === "ER_DUP_ENTRY" ||
  (error as { code?: string })?.code === "ER_DUP_ENTRY";

/**
 * API-03. The slug is created once from title_en and then kept, so links and analytics labels
 * stay stable when the title is edited. Two saves racing for the same slug retry with the next one.
 */
export async function createProject(input: ProjectInput): Promise<Project> {
  for (let attempt = 1; ; attempt++) {
    const slug = await freeSlug(input.title_en);
    try {
      const [{ id }] = await getDb()
        .insert(projects)
        .values({ ...toColumns(input), slug })
        .$returningId();
      return (await getProjectById(id))!;
    } catch (error) {
      if (attempt >= 3 || !isDuplicateKey(error)) throw error;
    }
  }
}

/** API-04: the caller has already merged and validated the full input. null = project is gone. */
export async function updateProject(id: string, input: ProjectInput): Promise<Project | null> {
  await getDb().update(projects).set(toColumns(input)).where(eq(projects.id, id));
  return getProjectById(id);
}
