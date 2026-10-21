import { and, eq, inArray, isNull, lt } from "drizzle-orm";
import { getDb, type Transaction } from "@/lib/db/client";
import { isBuildPhase } from "@/lib/env";
import { images, imageVariants, projects, siteSettings, type Image } from "@/lib/db/schema";
import { AVATAR_WIDTHS, mediaUrl, pickVariantWidth, type ImageFormat } from "./rules";
import type { Variant } from "./upload";

// Image storage in MySQL (DECISIONS 2026-09-29) and the S-14 site settings: the profile photo
// (T-18b) and, since v2.0.0, the availability switch (D-16). DB access for both stays in this file.

const PROFILE_PHOTO_KEY = "profile_photo";
const AVAILABILITY_KEY = "availability_on";

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

/** Thrown inside a save transaction when the chosen image was deleted meanwhile. */
export class MissingImageError extends Error {
  constructor() {
    super("image no longer exists");
    this.name = "MissingImageError";
  }
}

/**
 * Inside a save that will point at this image: share-locks its row until the commit, so
 * deleteImageIfUnused can't remove it in between, and throws MissingImageError when it's gone.
 */
export async function lockImageForUse(tx: Transaction, id: string): Promise<void> {
  const [image] = await tx
    .select({ id: images.id })
    .from(images)
    .where(eq(images.id, id))
    .for("share");
  if (!image) throw new MissingImageError();
}

/**
 * Deletes an image (variants cascade) unless a project thumbnail or the profile photo uses it.
 * The row lock makes this wait for, and then respect, a save that is about to use the image.
 */
export async function deleteImageIfUnused(
  id: string | null,
): Promise<"deleted" | "in_use" | "not_found"> {
  if (!id) return "not_found";
  return getDb().transaction(async (tx) => {
    const [image] = await tx
      .select({ id: images.id })
      .from(images)
      .where(eq(images.id, id))
      .for("update");
    if (!image) return "not_found";
    const [project] = await tx
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.thumbnailPublicId, id))
      .limit(1);
    const [photo] = await tx
      .select({ key: siteSettings.key })
      .from(siteSettings)
      .where(and(eq(siteSettings.key, PROFILE_PHOTO_KEY), eq(siteSettings.value, id)))
      .limit(1);
    if (project || photo) return "in_use";
    await tx.delete(images).where(eq(images.id, id));
    return "deleted";
  });
}

/** Uploads older than ORPHAN_AFTER_MS that no project references. Returns how many were removed. */
export async function deleteOrphanImages(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - ORPHAN_AFTER_MS);
  const candidates = await getDb()
    .select({ id: images.id })
    .from(images)
    .leftJoin(projects, eq(projects.thumbnailPublicId, images.id))
    .where(and(isNull(projects.id), lt(images.createdAt, cutoff)));
  let removed = 0;
  for (const { id } of candidates) {
    if ((await deleteImageIfUnused(id)) === "deleted") removed++;
  }
  return removed;
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
 * One S-14 save (API-09): the photo and the availability switch are written in one transaction,
 * so a failed save changes neither. A field left undefined stays as it is. The replaced photo is
 * deleted only after the commit, unless something else uses it.
 */
export async function saveProfileSettings(settings: {
  photoId?: string | null;
  availability?: boolean;
}): Promise<void> {
  const { photoId, availability } = settings;
  const previous = photoId === undefined ? null : await getProfilePhotoId();
  const rows: { key: string; value: string | null }[] = [];
  if (availability !== undefined)
    rows.push({ key: AVAILABILITY_KEY, value: availability ? "1" : "0" });
  if (photoId !== undefined) rows.push({ key: PROFILE_PHOTO_KEY, value: photoId });
  if (rows.length === 0) return;

  await getDb().transaction(async (tx) => {
    if (photoId) await lockImageForUse(tx, photoId);
    for (const row of rows) {
      await tx
        .insert(siteSettings)
        .values(row)
        .onDuplicateKeyUpdate({ set: { value: row.value, updatedAt: new Date() } });
    }
  });

  if (previous && previous !== photoId) {
    await deleteImageIfUnused(previous).catch((error: Error) =>
      console.error("[images] old profile photo cleanup failed:", error.message),
    );
  }
}

/** The availability switch; on until it has been saved once (Delta APP_FLOW section 9). */
export async function getAvailability(): Promise<boolean> {
  const [row] = await getDb()
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, AVAILABILITY_KEY))
    .limit(1);
  return row?.value !== "0";
}

export type PublicAvatar = { src: string; srcSet: string };

/**
 * src + srcset of a profile photo. Only widths the photo really has: a 320 px photo from v1 stays
 * at 320 instead of advertising a 640 variant that doesn't exist (E-32).
 */
export function avatarSources(image: Pick<Image, "id" | "format" | "width">): PublicAvatar {
  const widths = AVATAR_WIDTHS.filter((w) => w <= image.width);
  const available = widths.length > 0 ? widths : [image.width];
  return {
    src: mediaUrl(image.id, image.format, available.at(-1)),
    srcSet: available.map((w) => `${mediaUrl(image.id, image.format, w)} ${w}w`).join(", "),
  };
}

export type SiteSettings = { avatar: PublicAvatar | null; availabilityOn: boolean };

/**
 * For the public pages (static, revalidated by API-09): the hero photo (null = initials) and the
 * availability switch, read in one query. Same rule as the project query (E-02): no DB during
 * `next build` → initials and the default; at runtime an error is re-thrown so the last good
 * static page keeps being served.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  let rows: { key: string; value: string | null }[];
  try {
    rows = await getDb()
      .select({ key: siteSettings.key, value: siteSettings.value })
      .from(siteSettings)
      .where(inArray(siteSettings.key, [PROFILE_PHOTO_KEY, AVAILABILITY_KEY]));
  } catch (error) {
    if (!isBuildPhase()) throw error;
    console.warn(
      `[images] database unavailable during build, using default settings: ${(error as Error).message}`,
    );
    return { avatar: null, availabilityOn: true };
  }
  const value = (key: string) => rows.find((row) => row.key === key)?.value ?? null;
  const photoId = value(PROFILE_PHOTO_KEY);
  const image = photoId ? await getImage(photoId) : null;
  return {
    avatar: image ? avatarSources(image) : null,
    availabilityOn: value(AVAILABILITY_KEY) !== "0",
  };
}
