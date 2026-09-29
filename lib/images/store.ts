import { and, eq, isNull, lt } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { images, imageVariants, projects, siteSettings, type Image } from "@/lib/db/schema";
import { AVATAR_WIDTHS, mediaUrl, pickVariantWidth, type ImageFormat } from "./rules";
import type { Variant } from "./upload";

// Image storage in MySQL (DECISIONS 2026-09-29) and the profile photo setting (S-14, T-18b).
// DB access for images stays in this file.

const PROFILE_PHOTO_KEY = "profile_photo";

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

/** Used by a project thumbnail or as the profile photo. */
export async function isImageInUse(id: string): Promise<boolean> {
  const db = getDb();
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.thumbnailPublicId, id))
    .limit(1);
  if (project) return true;
  return (await getProfilePhotoId()) === id;
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
  const candidates = await getDb()
    .select({ id: images.id })
    .from(images)
    .leftJoin(projects, eq(projects.thumbnailPublicId, images.id))
    .where(and(isNull(projects.id), lt(images.createdAt, cutoff)));
  const profilePhoto = await getProfilePhotoId();
  const orphans = candidates.filter(({ id }) => id !== profilePhoto);
  for (const { id } of orphans) await deleteImage(id);
  return orphans.length;
}

async function getProfilePhotoId(): Promise<string | null> {
  const [row] = await getDb()
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, PROFILE_PHOTO_KEY))
    .limit(1);
  return row?.value ?? null;
}

/** The current profile photo (S-14), or null while the initials are shown. */
export async function getProfilePhoto(): Promise<Image | null> {
  const id = await getProfilePhotoId();
  return id ? getImage(id) : null;
}

/**
 * Sets (or with null, clears) the profile photo. The previous photo is deleted once replaced,
 * unless something else uses it.
 */
export async function setProfilePhoto(id: string | null): Promise<void> {
  const previous = await getProfilePhotoId();
  await getDb()
    .insert(siteSettings)
    .values({ key: PROFILE_PHOTO_KEY, value: id })
    .onDuplicateKeyUpdate({ set: { value: id, updatedAt: new Date() } });
  if (previous && previous !== id) {
    await deleteImageIfUnused(previous).catch((error: Error) =>
      console.error("[images] old profile photo cleanup failed:", error.message),
    );
  }
}

export type PublicAvatar = { src: string; srcSet: string };

const isBuildPhase = () => process.env.NEXT_PHASE === "phase-production-build";

/**
 * For the public hero byline (static pages): src + srcset of the photo, or null for the initials.
 * Same rule as the project query (E-02): no DB during `next build` → initials; at runtime an error
 * is re-thrown so the last good static page keeps being served.
 */
export async function getPublicAvatar(): Promise<PublicAvatar | null> {
  let image: Image | null;
  try {
    image = await getProfilePhoto();
  } catch (error) {
    if (!isBuildPhase()) throw error;
    console.warn(
      `[images] database unavailable during build, showing initials: ${(error as Error).message}`,
    );
    return null;
  }
  if (!image) return null;
  return {
    src: mediaUrl(image.id, image.format, AVATAR_WIDTHS[1]),
    srcSet: AVATAR_WIDTHS.map((w) => `${mediaUrl(image.id, image.format, w)} ${w}w`).join(", "),
  };
}
