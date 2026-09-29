import { inspectImage } from "./inspect";
import {
  heightFor,
  KINDS,
  MAX_VARIANT_BYTES,
  variantWidthsFor,
  type ImageFormat,
  type ImageKind,
} from "./rules";

// API-06 body check: the browser sends every width it made from one source image. The server
// trusts nothing about them: format and size are read from the bytes, and the set of widths and
// the shape (16:10 thumbnail, 1:1 avatar) must be exactly what the admin compression produces.

export type Variant = { width: number; height: number; bytes: Uint8Array };

export type UploadCheck =
  | { ok: true; format: ImageFormat; variants: Variant[] }
  | {
      ok: false;
      status: 413 | 415 | 422;
      code: "FILE_TOO_LARGE" | "UNSUPPORTED_TYPE" | "IMAGE_TOO_SMALL" | "VALIDATION_FAILED";
      message: string;
    };

export const uploadMessages = {
  tooLarge: "This image is too large after compression. Try a smaller image.",
  type: "Use a JPG, PNG, or WebP image.",
  tooSmall: (width: number, minimum: number) =>
    `This image is ${width} px wide. Use one at least ${minimum} px wide.`,
  malformed: "Upload failed. Check your connection and try again.",
} as const;

export function checkVariants(
  parts: readonly Uint8Array[],
  kind: ImageKind = "thumbnail",
): UploadCheck {
  const malformed = {
    ok: false,
    status: 422,
    code: "VALIDATION_FAILED",
    message: uploadMessages.malformed,
  } as const;
  if (parts.length === 0 || parts.length > 4) return malformed;

  const variants: Variant[] = [];
  let format: ImageFormat | null = null;
  for (const bytes of parts) {
    if (bytes.byteLength > MAX_VARIANT_BYTES) {
      return { ok: false, status: 413, code: "FILE_TOO_LARGE", message: uploadMessages.tooLarge };
    }
    const info = inspectImage(bytes);
    if (!info || (format && info.format !== format)) {
      return { ok: false, status: 415, code: "UNSUPPORTED_TYPE", message: uploadMessages.type };
    }
    format = info.format;
    variants.push({ width: info.width, height: info.height, bytes });
  }

  variants.sort((a, b) => a.width - b.width);
  const largest = variants.at(-1)!;
  const { minSourceWidth } = KINDS[kind];
  // The largest stored width equals the crop (thumbnail, max 1600) or 320 (avatar).
  if (largest.width < minSourceWidth) {
    return {
      ok: false,
      status: 422,
      code: "IMAGE_TOO_SMALL",
      message: uploadMessages.tooSmall(largest.width, minSourceWidth),
    };
  }

  const expected = variantWidthsFor(largest.width, kind);
  const widthsMatch =
    expected.length === variants.length && expected.every((w, i) => variants[i].width === w);
  const shapesMatch = variants.every((v) => Math.abs(v.height - heightFor(v.width, kind)) <= 1);
  if (!widthsMatch || !shapesMatch) return malformed;

  return { ok: true, format: format!, variants };
}
