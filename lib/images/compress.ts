import {
  ACCEPTED_TYPES,
  cropFor,
  heightFor,
  MAX_SOURCE_BYTES,
  MAX_VARIANT_BYTES,
  MIN_SOURCE_WIDTH,
  variantWidthsFor,
  type ImageFormat,
} from "./rules";

// Browser-only: turns the file the admin picked into the 16:10 widths stored in MySQL. Drawing
// through a canvas also drops EXIF metadata (camera, GPS). No library, no server CPU.

export type SourceProblem =
  | { kind: "type" }
  | { kind: "size"; megabytes: number }
  | { kind: "width"; width: number }
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

/** Checks on the decoded size: at least 1200 px wide, and tall enough for a 1200 px 16:10 crop. */
export function checkSourceSize(width: number, height: number): SourceProblem | null {
  if (width < MIN_SOURCE_WIDTH) return { kind: "width", width };
  if (cropFor(width, height).width < MIN_SOURCE_WIDTH) return { kind: "short", height };
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

export async function compressImage(file: File): Promise<CompressedImage | SourceProblem> {
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
    const sizeProblem = checkSourceSize(bitmap.width, bitmap.height);
    if (sizeProblem) return sizeProblem;

    const crop = cropFor(bitmap.width, bitmap.height);
    const widths = variantWidthsFor(crop.width).reverse(); // largest first

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
      const height = heightFor(width);
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
