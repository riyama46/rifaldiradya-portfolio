import { describe, expect, it } from "vitest";
import { checkSourceFile, checkSourceSize } from "@/lib/images/compress";
import { inspectImage } from "@/lib/images/inspect";
import {
  cropFor,
  heightFor,
  MAX_VARIANT_BYTES,
  mediaUrl,
  parseMediaFile,
  pickVariantWidth,
  variantWidthsFor,
} from "@/lib/images/rules";
import { checkVariants } from "@/lib/images/upload";

// Minimal but valid file headers, enough for inspectImage (the rest of a real file is pixel data).
const u24 = (n: number) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff];
const u16le = (n: number) => [n & 0xff, (n >> 8) & 0xff];
const text = (s: string) => [...s].map((c) => c.charCodeAt(0));

function webpVp8x(width: number, height: number, padding = 0) {
  return new Uint8Array([
    ...text("RIFF"), 0, 0, 0, 0, ...text("WEBP"), ...text("VP8X"), 10, 0, 0, 0,
    0, 0, 0, 0, ...u24(width - 1), ...u24(height - 1), ...new Array(padding).fill(0),
  ]); // prettier-ignore
}

function webpLossy(width: number, height: number) {
  return new Uint8Array([
    ...text("RIFF"), 0, 0, 0, 0, ...text("WEBP"), ...text("VP8 "), 0, 0, 0, 0,
    0, 0, 0, 0x9d, 0x01, 0x2a, ...u16le(width), ...u16le(height), 0, 0,
  ]); // prettier-ignore
}

function jpeg(width: number, height: number) {
  return new Uint8Array([
    0xff, 0xd8,
    0xff, 0xe0, 0, 16, ...text("JFIF"), 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, // APP0
    0xff, 0xc0, 0, 17, 8, height >> 8, height & 0xff, width >> 8, width & 0xff, 3,
    1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1,
    0xff, 0xd9,
  ]); // prettier-ignore
}

describe("rules", () => {
  it("crops tall screenshots from the top and wide images from the centre, to 16:10", () => {
    expect(cropFor(1600, 9000)).toEqual({ x: 0, y: 0, width: 1600, height: 1000 });
    expect(cropFor(3200, 1000)).toEqual({ x: 800, y: 0, width: 1600, height: 1000 });
    expect(cropFor(1600, 1000)).toEqual({ x: 0, y: 0, width: 1600, height: 1000 });
  });

  it("stores the standard widths below the crop plus the crop itself, capped at 1600", () => {
    expect(variantWidthsFor(4000)).toEqual([640, 960, 1280, 1600]);
    expect(variantWidthsFor(1600)).toEqual([640, 960, 1280, 1600]);
    expect(variantWidthsFor(1440)).toEqual([640, 960, 1280, 1440]);
    expect(variantWidthsFor(1200)).toEqual([640, 960, 1200]);
  });

  it("builds and parses /media file names", () => {
    const id = "01JIMAGE000000000000000000";
    expect(mediaUrl(id, "webp")).toBe(`/media/${id}.webp`);
    expect(mediaUrl(id, "jpeg", 960)).toBe(`/media/${id}-960.jpg`);
    expect(parseMediaFile(`${id}-960.webp`)).toEqual({ id, width: 960, format: "webp" });
    expect(parseMediaFile(`${id}.jpg`)).toEqual({ id, width: null, format: "jpeg" });
    for (const bad of ["../x.webp", `${id}.png`, `${id}-96000.webp`, `${id.toLowerCase()}.webp`]) {
      expect(parseMediaFile(bad)).toBeNull();
    }
  });

  it("serves the smallest stored width that is wide enough", () => {
    expect(pickVariantWidth([640, 960, 1200], 1280)).toBe(1200);
    expect(pickVariantWidth([640, 960, 1280, 1600], 700)).toBe(960);
    expect(pickVariantWidth([640, 960, 1280, 1600], null)).toBe(1600);
  });
});

describe("inspectImage (format and size from the bytes)", () => {
  it("reads WebP (extended and lossy) and JPEG headers", () => {
    expect(inspectImage(webpVp8x(1600, 1000))).toEqual({
      format: "webp",
      width: 1600,
      height: 1000,
    });
    expect(inspectImage(webpLossy(640, 400))).toEqual({ format: "webp", width: 640, height: 400 });
    expect(inspectImage(jpeg(1280, 800))).toEqual({ format: "jpeg", width: 1280, height: 800 });
  });

  it("rejects anything else", () => {
    const png = new Uint8Array([
      0x89,
      0x50,
      0x4e,
      0x47,
      0x0d,
      0x0a,
      0x1a,
      0x0a,
      ...new Array(40).fill(0),
    ]);
    const html = new TextEncoder().encode("<svg onload=alert(1)></svg>".padEnd(64, " "));
    for (const bytes of [png, html, new Uint8Array(0), webpVp8x(1600, 1000).subarray(0, 20)]) {
      expect(inspectImage(bytes)).toBeNull();
    }
  });
});

describe("checkVariants (API-06)", () => {
  const set = (widths: number[], make = webpVp8x) => widths.map((w) => make(w, heightFor(w)));

  it("accepts the exact set the browser produces", () => {
    const result = checkVariants(set([1600, 640, 1280, 960]));
    expect(result.ok && result.variants.map((v) => v.width)).toEqual([640, 960, 1280, 1600]);
    expect(checkVariants(set([640, 960, 1200])).ok).toBe(true);
  });

  it("rejects images under 1200 px (422 IMAGE_TOO_SMALL)", () => {
    expect(checkVariants(set([640, 960, 1100]))).toMatchObject({
      status: 422,
      code: "IMAGE_TOO_SMALL",
    });
  });

  it("rejects non-images and mixed formats (415)", () => {
    const fake = new TextEncoder().encode("not an image at all, just text".padEnd(64));
    expect(checkVariants([fake])).toMatchObject({ status: 415, code: "UNSUPPORTED_TYPE" });
    const mixed = [...set([640, 960, 1280]), jpeg(1600, 1000)];
    expect(checkVariants(mixed)).toMatchObject({ status: 415 });
  });

  it("rejects an oversized variant (413)", () => {
    const huge = webpVp8x(1600, 1000, MAX_VARIANT_BYTES);
    expect(checkVariants([...set([640, 960, 1280]), huge])).toMatchObject({
      status: 413,
      code: "FILE_TOO_LARGE",
    });
  });

  it("rejects wrong width sets, wrong shapes, and bad part counts", () => {
    expect(checkVariants(set([1600])).ok).toBe(false); // missing smaller widths
    expect(checkVariants(set([640, 960, 1280, 1280, 1600])).ok).toBe(false); // 5 parts
    expect(checkVariants([]).ok).toBe(false);
    const square = [...set([640, 960, 1280]), webpVp8x(1600, 1600)];
    expect(checkVariants(square).ok).toBe(false);
  });
});

describe("source file checks (browser, before compressing)", () => {
  it("accepts JPG, PNG, and WebP up to 5 MB", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      expect(checkSourceFile({ type, size: 5 * 1024 * 1024 })).toBeNull();
    }
  });

  it("reports the App Flow problems", () => {
    expect(checkSourceFile({ type: "image/gif", size: 10 })).toEqual({ kind: "type" });
    expect(checkSourceFile({ type: "image/svg+xml", size: 10 })).toEqual({ kind: "type" });
    expect(checkSourceFile({ type: "image/png", size: 7.34 * 1024 * 1024 })).toEqual({
      kind: "size",
      megabytes: 7.3,
    });
    expect(checkSourceSize(1100, 2000)).toEqual({ kind: "width", width: 1100 });
    expect(checkSourceSize(2400, 700)).toEqual({ kind: "short", height: 700 });
    expect(checkSourceSize(1920, 1080)).toBeNull();
  });
});
