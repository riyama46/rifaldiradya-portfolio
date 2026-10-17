// Image rules shared by the admin browser (compression) and the server (API-06, /media).
// No server-only imports here. See DECISIONS 2026-09-29 (MySQL image storage) and T-18b (avatar).

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_SOURCE_BYTES = 5 * 1024 * 1024; // App Flow S-12 field 7

/** next/image widths (next.config deviceSizes) and the widths stored per thumbnail upload. */
export const IMAGE_WIDTHS = [640, 960, 1280, 1600] as const;
export const MAX_WIDTH = IMAGE_WIDTHS.at(-1)!;

/** Upper bound for one compressed variant; a 1600 × 1000 WebP at q≈0.8 is usually 60–250 KB. */
export const MAX_VARIANT_BYTES = 1024 * 1024;

/**
 * thumbnail: project image, 16:10 like the cards and the hero panel.
 * avatar: the hero photo (S-14), a small square, stored at 320 and 640 px since v2.0.0 (Delta SDD
 * section 3). Photos stored at 160/320 by v1 keep being served until replaced (E-32).
 */
export type ImageKind = "thumbnail" | "avatar";

export const KINDS = {
  thumbnail: { aspect: { width: 16, height: 10 }, minSourceWidth: 1200 },
  avatar: { aspect: { width: 1, height: 1 }, minSourceWidth: 640 },
} as const satisfies Record<ImageKind, unknown>;

export const AVATAR_WIDTHS = [320, 640] as const;

export const isImageKind = (value: unknown): value is ImageKind =>
  value === "thumbnail" || value === "avatar";

export type ImageFormat = "webp" | "jpeg";
export const extensionFor = (format: ImageFormat) => (format === "webp" ? "webp" : "jpg");

export function heightFor(width: number, kind: ImageKind = "thumbnail") {
  const { aspect } = KINDS[kind];
  return Math.round((width * aspect.height) / aspect.width);
}

/**
 * Crop of a source image to the kind's aspect ratio. Thumbnails: taller images (full-page
 * screenshots) keep the top, where a site's hero is; wider ones are cropped from the centre.
 * Avatars: a centred square.
 */
export function cropFor(width: number, height: number, kind: ImageKind = "thumbnail") {
  const { aspect } = KINDS[kind];
  const target = aspect.width / aspect.height;
  if (width / height > target) {
    const cropWidth = Math.round(height * target);
    return { x: Math.floor((width - cropWidth) / 2), y: 0, width: cropWidth, height };
  }
  const cropHeight = Math.round(width / target);
  const y = kind === "avatar" ? Math.floor((height - cropHeight) / 2) : 0;
  return { x: 0, y, width, height: cropHeight };
}

/** Stored widths for a crop. Thumbnails: standard widths below it plus the crop (max 1600). */
export function variantWidthsFor(cropWidth: number, kind: ImageKind = "thumbnail"): number[] {
  if (kind === "avatar") return [...AVATAR_WIDTHS];
  const largest = Math.min(cropWidth, MAX_WIDTH);
  return [...IMAGE_WIDTHS.filter((width) => width < largest), largest];
}

/** Public URL of an image (its largest variant); the loader appends a width for smaller ones. */
export function mediaUrl(id: string, format: ImageFormat, width?: number): string {
  return `/media/${id}${width ? `-${width}` : ""}.${extensionFor(format)}`;
}

const MEDIA_FILE = /^([0-9A-Z]{26})(?:-(\d{3,4}))?\.(webp|jpg)$/;

/** Parses the file part of /media/<id>[-<width>].<ext>; null when it can't be one of ours. */
export function parseMediaFile(file: string) {
  const match = MEDIA_FILE.exec(file);
  if (!match) return null;
  return {
    id: match[1],
    width: match[2] ? Number(match[2]) : null,
    format: (match[3] === "webp" ? "webp" : "jpeg") as ImageFormat,
  };
}

/** The variant to serve for a requested width: the smallest one that is wide enough. */
export function pickVariantWidth(available: readonly number[], requested: number | null): number {
  const sorted = [...available].sort((a, b) => a - b);
  if (requested === null) return sorted.at(-1)!;
  return sorted.find((width) => width >= requested) ?? sorted.at(-1)!;
}
