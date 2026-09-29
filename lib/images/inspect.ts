import type { ImageFormat } from "./rules";

// Reads the real format and pixel size from the file bytes (never from the name or the MIME type
// the client sent). Only the two formats the admin browser produces are accepted: WebP and JPEG.

export type ImageInfo = { format: ImageFormat; width: number; height: number };

const ascii = (bytes: Uint8Array, start: number, length: number) =>
  String.fromCharCode(...bytes.subarray(start, start + length));

const u16be = (b: Uint8Array, i: number) => (b[i] << 8) | b[i + 1];
const u16le = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8);
const u24le = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);

function inspectWebp(b: Uint8Array): ImageInfo | null {
  if (b.length < 30 || ascii(b, 0, 4) !== "RIFF" || ascii(b, 8, 4) !== "WEBP") return null;
  const chunk = ascii(b, 12, 4);

  if (chunk === "VP8 ") {
    // Lossy: frame tag (3 bytes) + start code 9d 01 2a, then 14-bit width and height.
    if (b[23] !== 0x9d || b[24] !== 0x01 || b[25] !== 0x2a) return null;
    return { format: "webp", width: u16le(b, 26) & 0x3fff, height: u16le(b, 28) & 0x3fff };
  }
  if (chunk === "VP8L") {
    // Lossless: signature 0x2f, then 14-bit (width - 1) and (height - 1).
    if (b[20] !== 0x2f) return null;
    const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
    return { format: "webp", width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8X") {
    // Extended: 24-bit (canvas width - 1) and (canvas height - 1).
    return { format: "webp", width: u24le(b, 24) + 1, height: u24le(b, 27) + 1 };
  }
  return null;
}

function inspectJpeg(b: Uint8Array): ImageInfo | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8 || b[2] !== 0xff) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    if (marker === 0xff) {
      i += 1; // fill byte
      continue;
    }
    const length = u16be(b, i + 2);
    // SOF0–SOF15 carry the frame size; C4 (DHT), C8 (JPG) and CC (DAC) are not frames.
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { format: "jpeg", height: u16be(b, i + 5), width: u16be(b, i + 7) };
    }
    if (marker === 0xda || length < 2) return null; // image data started without a frame header
    i += 2 + length;
  }
  return null;
}

export function inspectImage(bytes: Uint8Array): ImageInfo | null {
  const info = inspectWebp(bytes) ?? inspectJpeg(bytes);
  return info && info.width > 0 && info.height > 0 ? info : null;
}
