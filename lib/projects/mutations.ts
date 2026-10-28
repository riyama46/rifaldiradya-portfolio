import { asc, desc, eq, gt, like, or, sql } from "drizzle-orm";
import { getDb, type Transaction } from "@/lib/db/client";
import { projects, type Project } from "@/lib/db/schema";
import { mediaUrl } from "@/lib/images/rules";
import { deleteImageIfUnused, getImage, lockImageForUse } from "@/lib/images/store";
import { getProjectById } from "./queries";
import { slugify, uniqueSlug } from "./slug";
import { messages, SHOW_ON_HOME_MAX, type ProjectInput, type ProjectInputRaw } from "./validation";

// Writes for API-03/04/05/08 (SDD section 4: DB access stays in lib/projects, lib/images, lib/auth).
//
// Positions (column sort_order) are always 1…n with no duplicates (DECISIONS T-18b): a new project
// takes position 1 and the others move back one, a deleted one closes its gap, and ↑/↓ swaps two
// neighbours. The form never sends a position.

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
    group: project.group,
    meta_en: project.metaEn,
    meta_id: project.metaId,
    side_en: project.sideEn,
    side_id: project.sideId,
    summary_en: project.summaryEn,
    summary_id: project.summaryId,
    show_on_home: project.showOnHome,
    case_is_en: project.caseIsEn,
    case_is_id: project.caseIsId,
    case_did_en: project.caseDidEn,
    case_did_id: project.caseDidId,
    tags: project.tags,
    status_en: project.statusEn,
    status_id: project.statusId,
    case_action: project.caseAction,
    live_url: project.liveUrl,
    demo_url: project.demoUrl,
    repo_url: project.repoUrl,
    visual_type: project.visualType,
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
    card_number: project.cardNumber,
    card_caption_en: project.cardCaptionEn,
    card_caption_id: project.cardCaptionId,
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

// The deprecated `featured` column (D-22) is never read or written: inserts take its default.
function toColumns(input: ProjectInput) {
  return {
    titleEn: input.title_en,
    titleId: input.title_id,
    group: input.group,
    metaEn: input.meta_en,
    metaId: input.meta_id,
    sideEn: input.side_en,
    sideId: input.side_id,
    summaryEn: input.summary_en,
    summaryId: input.summary_id,
    showOnHome: input.show_on_home,
    caseIsEn: input.case_is_en,
    caseIsId: input.case_is_id,
    caseDidEn: input.case_did_en,
    caseDidId: input.case_did_id,
    tags: input.tags,
    statusEn: input.status_en,
    statusId: input.status_id,
    caseAction: input.case_action,
    liveUrl: input.live_url,
    demoUrl: input.demo_url,
    repoUrl: input.repo_url,
    visualType: input.visual_type,
    thumbnailPublicId: input.thumbnail?.public_id ?? null,
    thumbnailUrl: input.thumbnail?.url ?? null,
    thumbnailWidth: input.thumbnail?.width ?? null,
    thumbnailHeight: input.thumbnail?.height ?? null,
    thumbnailAltEn: input.thumbnail_alt_en,
    thumbnailAltId: input.thumbnail_alt_id,
    cardNumber: input.card_number,
    cardCaptionEn: input.card_caption_en,
    cardCaptionId: input.card_caption_id,
    published: input.published,
  };
}

/** E-26: thrown when saving would put a 6th project in Selected work. API-03/04 answer 422. */
export class ShowOnHomeLimitError extends Error {
  constructor() {
    super(messages.showOnHomeFull);
    this.name = "ShowOnHomeLimitError";
  }
}

/**
 * E-26: at most 5 projects with show_on_home, drafts included. Runs inside the save transaction
 * with the rows locked, so two saves at once can't both take the 5th place. A project that is
 * already on may always be saved again.
 */
async function assertShowOnHomeRoom(tx: Transaction, input: ProjectInput, selfId?: string) {
  if (!input.show_on_home) return;
  const rows = await tx
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.showOnHome, true))
    .for("update");
  const others = rows.filter((row) => row.id !== selfId);
  if (others.length >= SHOW_ON_HOME_MAX) throw new ShowOnHomeLimitError();
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

/**
 * Moving a project is not an edit of its content: keep updated_at (shown on S-11, used for the
 * sitemap lastmod) instead of letting the schema's $onUpdateFn stamp every shifted row.
 */
const keepUpdatedAt = { updatedAt: sql`${projects.updatedAt}` };

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
      const id = await getDb().transaction(async (tx) => {
        if (input.thumbnail) await lockImageForUse(tx, input.thumbnail.public_id);
        await assertShowOnHomeRoom(tx, input);
        await tx
          .update(projects)
          .set({ sortOrder: sql`${projects.sortOrder} + 1`, ...keepUpdatedAt });
        const [row] = await tx
          .insert(projects)
          .values({ ...toColumns(input), slug, sortOrder: 1 })
          .$returningId();
        return row.id;
      });
      return (await getProjectById(id))!;
    } catch (error) {
      if (attempt >= 3 || !isDuplicateKey(error)) throw error;
    }
  }
}

/**
 * The client only chooses *which* uploaded image to use (public_id). Its URL and size always come
 * from the images table, never from the request. null = that image doesn't exist (anymore).
 */
export async function withStoredThumbnail(input: ProjectInput): Promise<ProjectInput | null> {
  if (!input.thumbnail) return input;
  const image = await getImage(input.thumbnail.public_id);
  if (!image) return null;
  return {
    ...input,
    thumbnail: {
      public_id: image.id,
      url: mediaUrl(image.id, image.format),
      width: image.width,
      height: image.height,
    },
  };
}

/**
 * API-04: the caller has already merged and validated the full input. null = project is gone.
 * A replaced or removed thumbnail is deleted only after the new data is saved (App Flow S-12).
 */
export async function updateProject(
  existing: Project,
  input: ProjectInput,
): Promise<Project | null> {
  await getDb().transaction(async (tx) => {
    if (input.thumbnail) await lockImageForUse(tx, input.thumbnail.public_id);
    await assertShowOnHomeRoom(tx, input, existing.id);
    await tx.update(projects).set(toColumns(input)).where(eq(projects.id, existing.id));
  });
  const updated = await getProjectById(existing.id);

  const previous = existing.thumbnailPublicId;
  if (updated && previous && previous !== updated.thumbnailPublicId) {
    await deleteImageIfUnused(previous).catch((error: Error) =>
      console.error("[images] old thumbnail cleanup failed:", error.message),
    );
  }
  return updated;
}

/** API-05: removes the project, then its image (App Flow UF-09). false = it was already gone. */
export async function deleteProject(existing: Project): Promise<boolean> {
  const deleted = await getDb().transaction(async (tx) => {
    const [result] = await tx.delete(projects).where(eq(projects.id, existing.id));
    if (result.affectedRows === 0) return false;
    await tx
      .update(projects)
      .set({ sortOrder: sql`${projects.sortOrder} - 1`, ...keepUpdatedAt })
      .where(gt(projects.sortOrder, existing.sortOrder));
    return true;
  });
  if (!deleted) return false;
  await deleteImageIfUnused(existing.thumbnailPublicId).catch((error: Error) =>
    console.error("[images] thumbnail cleanup after delete failed:", error.message),
  );
  return true;
}

export type MoveDirection = "up" | "down";

/**
 * API-08: swaps a project with its neighbour above or below. Every position is rewritten as 1…n in
 * the current order at the same time, so any older gaps or duplicates heal on the first move.
 * Returns the new position (unchanged at the top/bottom edge), or null when the project is gone.
 */
export async function moveProject(id: string, direction: MoveDirection): Promise<number | null> {
  return getDb().transaction(async (tx) => {
    const rows = await tx
      .select({ id: projects.id, sortOrder: projects.sortOrder })
      .from(projects)
      .orderBy(asc(projects.sortOrder), desc(projects.createdAt))
      .for("update");
    const index = rows.findIndex((row) => row.id === id);
    if (index === -1) return null;

    const target = direction === "up" ? index - 1 : index + 1;
    const order = [...rows];
    if (target >= 0 && target < order.length) {
      [order[index], order[target]] = [order[target], order[index]];
    }
    for (const [position, row] of order.entries()) {
      if (row.sortOrder !== position + 1) {
        await tx
          .update(projects)
          .set({ sortOrder: position + 1, ...keepUpdatedAt })
          .where(eq(projects.id, row.id));
      }
    }
    return order.findIndex((row) => row.id === id) + 1;
  });
}
