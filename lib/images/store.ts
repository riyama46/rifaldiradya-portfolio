import { and, eq, isNull, lt } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { images, imageVariants, projects, type Image } from "@/lib/db/schema";
import { pickVariantWidth, type ImageFormat } from "./rules";
import type { Variant } from "./upload";

// Image storage in MySQL (DECISIONS 2026-09-29). DB access for images stays in this file.

/** Uploads not attached to any project after this long are removed (closed tab, abandoned form). */
export const ORPHAN_AFTER_MS = 24 * 60 * 60 * 1000;

export async function saveImage(format: ImageFormat, variants: Variant[]): Promise<Image> {
  const largest = variants.at(-1)!;
  return getDb().transaction(async (tx) => {
    const [{ id }] = await tx
      .insert(images)
      .values({ format, width: largest.width, height: largest.height })
      .$returningId();
    // One row per statement keeps each packet well under MySQL's max_allowed_packet.
    for (const variant of variants) {
      await tx.insert(imageVariants).values({
        imageId: id,
        width: variant.width,
        height: variant.height,
        bytes: Buffer.from(variant.bytes),
      });
    }
    const [image] = await tx.select().from(images).where(eq(images.id, id));
    return image;
  });
}

export async function getImage(id: string): Promise<Image | null> {
  const [image] = await getDb().select().from(images).where(eq(images.id, id)).limit(1);
  return image ?? null;
}

/** Bytes of the best stored width for a request, or null when the image doesn't exist. */
export async function getVariant(id: string, requestedWidth: number | null) {
  const db = getDb();
  const [image] = await db
    .select({ format: images.format })
    .from(images)
    .where(eq(images.id, id))
    .limit(1);
  if (!image) return null;

  const widths = await db
    .select({ width: imageVariants.width })
    .from(imageVariants)
    .where(eq(imageVariants.imageId, id));
  if (widths.length === 0) return null;

  const width = pickVariantWidth(
    widths.map((row) => row.width),
    requestedWidth,
  );
  const [variant] = await db
    .select({ bytes: imageVariants.bytes })
    .from(imageVariants)
    .where(and(eq(imageVariants.imageId, id), eq(imageVariants.width, width)))
    .limit(1);
  return variant ? { format: image.format, width, bytes: variant.bytes } : null;
}

export async function isImageInUse(id: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.thumbnailPublicId, id))
    .limit(1);
  return row !== undefined;
}

/** Deletes an image (variants cascade). Returns false when it did not exist. */
export async function deleteImage(id: string): Promise<boolean> {
  const [result] = await getDb().delete(images).where(eq(images.id, id));
  return result.affectedRows > 0;
}

/** After a thumbnail is replaced or its project deleted: remove the old image unless still used. */
export async function deleteImageIfUnused(id: string | null): Promise<void> {
  if (!id || (await isImageInUse(id))) return;
  await deleteImage(id);
}

/** Uploads older than ORPHAN_AFTER_MS that no project references. Returns how many were removed. */
export async function deleteOrphanImages(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - ORPHAN_AFTER_MS);
  const orphans = await getDb()
    .select({ id: images.id })
    .from(images)
    .leftJoin(projects, eq(projects.thumbnailPublicId, images.id))
    .where(and(isNull(projects.id), lt(images.createdAt, cutoff)));
  for (const { id } of orphans) await deleteImage(id);
  return orphans.length;
}
