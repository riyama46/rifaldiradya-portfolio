import {
  ACCEPTED_TYPES,
  cropFor,
  heightFor,
  KINDS,
  MAX_SOURCE_BYTES,
  MAX_VARIANT_BYTES,
  variantWidthsFor,
  type ImageFormat,
  type ImageKind,
} from "./rules";

// Browser-only: turns the file the admin picked into the widths stored in MySQL (16:10 thumbnail
// or 1:1 avatar). Drawing
// through a canvas also drops EXIF metadata (camera, GPS). No library, no server CPU.

export type SourceProblem =
  | { kind: "type" }
  | { kind: "size"; megabytes: number }
  | { kind: "width"; width: number; minimum: number }
  | { kind: "short"; height: number }
  | { kind: "unreadable" }
  | { kind: "tooLarge" };

export type CompressedImage = {
  format: ImageFormat;
  variants: { width: number; height: number; blob: Blob }[];
};

/** Checks that need no decoding: type and size (App Flow S-12 field 7). */
export function checkSourceFile(file: { type: string; size: number }): SourceProblem | null {
  if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) return { kind: "type" };
  if (file.size > MAX_SOURCE_BYTES) {
    return { kind: "size", megabytes: Math.round((file.size / 1024 / 1024) * 10) / 10 };
  }
  return null;
}

/**
 * Checks on the decoded size: wide enough for the kind (1200 px thumbnail, 640 px avatar), and tall
 * enough that the crop keeps that width.
 */
export function checkSourceSize(
  width: number,
  height: number,
  kind: ImageKind = "thumbnail",
): SourceProblem | null {
  const minimum = KINDS[kind].minSourceWidth;
  if (width < minimum) return { kind: "width", width, minimum };
  if (cropFor(width, height, kind).width < minimum) return { kind: "short", height };
  return null;
}

type Canvas = HTMLCanvasElement | OffscreenCanvas;

function makeCanvas(width: number, height: number): Canvas {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function encode(canvas: Canvas, type: string, quality: number): Promise<Blob> {
  if ("convertToBlob" in canvas) return canvas.convertToBlob({ type, quality });
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("encode failed"))),
      type,
      quality,
    ),
  );
}

const QUALITY = { webp: 0.8, jpeg: 0.82 } as const;
const MIME = { webp: "image/webp", jpeg: "image/jpeg" } as const;

export async function compressImage(
  file: File,
  kind: ImageKind = "thumbnail",
): Promise<CompressedImage | SourceProblem> {
  const fileProblem = checkSourceFile(file);
  if (fileProblem) return fileProblem;

  let bitmap: ImageBitmap;
  try {
    // Applies the EXIF orientation, so phone photos are not sideways.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return { kind: "unreadable" };
  }

  try {
    const sizeProblem = checkSourceSize(bitmap.width, bitmap.height, kind);
    if (sizeProblem) return sizeProblem;

    const crop = cropFor(bitmap.width, bitmap.height, kind);
    const widths = variantWidthsFor(crop.width, kind).reverse(); // largest first

    // Largest variant straight from the source; each smaller one from the previous canvas, so no
    // single step shrinks too much (a big one-step downscale looks jagged).
    const canvases: { width: number; height: number; canvas: Canvas }[] = [];
    let previous: { source: CanvasImageSource; x: number; y: number; w: number; h: number } = {
      source: bitmap,
      x: crop.x,
      y: crop.y,
      w: crop.width,
      h: crop.height,
    };
    for (const width of widths) {
      const height = heightFor(width, kind);
      const canvas = makeCanvas(width, height);
      const context = canvas.getContext("2d") as
        CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
      if (!context) return { kind: "unreadable" };
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(
        previous.source,
        previous.x,
        previous.y,
        previous.w,
        previous.h,
        0,
        0,
        width,
        height,
      );
      canvases.push({ width, height, canvas });
      previous = { source: canvas, x: 0, y: 0, w: width, h: height };
    }

    // WebP where the browser can encode it (Chrome, Edge, Firefox, recent Safari); JPEG otherwise.
    const probe = await encode(canvases[0].canvas, MIME.webp, QUALITY.webp);
    const format: ImageFormat = probe.type === MIME.webp ? "webp" : "jpeg";

    const variants = [];
    for (const [index, { width, height, canvas }] of canvases.entries()) {
      let blob =
        index === 0 && format === "webp"
          ? probe
          : await encode(canvas, MIME[format], QUALITY[format]);
      if (blob.size > MAX_VARIANT_BYTES) blob = await encode(canvas, MIME[format], 0.65);
      if (blob.size > MAX_VARIANT_BYTES) return { kind: "tooLarge" };
      variants.push({ width, height, blob });
    }
    return { format, variants: variants.reverse() };
  } finally {
    bitmap.close();
  }
}

export const isSourceProblem = (result: CompressedImage | SourceProblem): result is SourceProblem =>
  "kind" in result;
