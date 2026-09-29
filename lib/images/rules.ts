// Image rules shared by the admin browser (compression) and the server (API-06, /media).
// No server-only imports here. See DECISIONS 2026-09-29 (MySQL image storage).

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_SOURCE_BYTES = 5 * 1024 * 1024; // App Flow S-12 field 7
export const MIN_SOURCE_WIDTH = 1200;

/** next/image widths (next.config deviceSizes) and the widths stored per upload. */
export const IMAGE_WIDTHS = [640, 960, 1280, 1600] as const;
export const MAX_WIDTH = IMAGE_WIDTHS.at(-1)!;

/** Every stored thumbnail is 16:10, the frame used by cards and the hero panel. */
export const ASPECT = { width: 16, height: 10 } as const;

/** Upper bound for one compressed variant; a 1600 × 1000 WebP at q≈0.8 is usually 60–250 KB. */
export const MAX_VARIANT_BYTES = 1024 * 1024;

export type ImageFormat = "webp" | "jpeg";
export const extensionFor = (format: ImageFormat) => (format === "webp" ? "webp" : "jpg");

export const heightFor = (width: number) => Math.round((width * ASPECT.height) / ASPECT.width);

/**
 * 16:10 crop of a source image. Taller images (full-page screenshots) keep the top, where a
 * site's hero is; wider images are cropped from the centre.
 */
export function cropFor(width: number, height: number) {
  const target = ASPECT.width / ASPECT.height;
  if (width / height > target) {
    const cropWidth = Math.round(height * target);
    return { x: Math.floor((width - cropWidth) / 2), y: 0, width: cropWidth, height };
  }
  return { x: 0, y: 0, width, height: Math.round(width / target) };
}

/** Stored widths for a crop: the standard widths below it, plus the crop itself up to 1600. */
export function variantWidthsFor(cropWidth: number): number[] {
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
