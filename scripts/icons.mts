// Renders the site icons (D-38), design "cobalt RR" chosen by Pal: "RR" in Archivo, accent colour on
// the dark v2 ground. Colours are read from the dark theme tokens in styles/globals.css so they never drift from the site.
//   app/favicon.ico (16, 32, 48), app/icon.png (512), app/apple-icon.png (180).
// Next.js serves these file conventions and adds the <link> tags itself.
// Run after changing the design:  node scripts/icons.mts
// Uses the installed Microsoft Edge through Playwright (PW_CHANNEL to change it) and Google Fonts.
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const css = readFileSync("styles/globals.css", "utf8");
const darkStart = css.indexOf(':root[data-theme="dark"]');
const dark = css.slice(darkStart, css.indexOf("}", darkStart));
const token = (name: string) => {
  const value = dark.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1];
  if (!value) throw new Error(`[icons] token ${name} not found in the dark theme block`);
  return value.trim();
};
const bg = token("--bg");
const accent = token("--accent");

const html = (size: number, rounded: boolean) => `<!doctype html>
<html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600&display=block" rel="stylesheet">
<style>
  * { margin: 0; }
  html, body { width: ${size}px; height: ${size}px; background: transparent; }
  .tile {
    position: relative; overflow: hidden;
    width: ${size}px; height: ${size}px; display: grid; place-items: center;
    background: ${bg};
    border-radius: ${rounded ? "22%" : "0"};
  }
  .letters {
    color: ${accent};
    font: 600 ${Math.round(size * 0.52)}px/1 "Archivo"; letter-spacing: -0.04em;
  }
</style></head><body><div class="tile"><div class="letters">RR</div></div></body></html>`;

/** An .ico holding PNG images (supported by every current browser). */
function ico(images: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map(({ png }) => png)]);
}

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? "msedge" });
try {
  const render = async (size: number, rounded: boolean) => {
    const tab = await browser.newPage({ viewport: { width: size, height: size } });
    await tab.setContent(html(size, rounded), { waitUntil: "networkidle" });
    await tab.evaluate(() => document.fonts.ready);
    const png = await tab.screenshot({ omitBackground: true });
    await tab.close();
    return png;
  };

  // Small sizes are scaled down from one 512 px render in a canvas (halving steps). Rendering text
  // straight at 16–48 px picks up ClearType colour fringes on Windows.
  const scaler = await browser.newPage();
  const downscale = async (png: Buffer, size: number) => {
    const dataUrl = await scaler.evaluate(
      async ({ src, size }) => {
        const image = new Image();
        image.src = src;
        await image.decode();
        let canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        canvas.getContext("2d")!.drawImage(image, 0, 0);
        while (canvas.width > size) {
          const next = document.createElement("canvas");
          next.width = next.height = Math.max(size, Math.floor(canvas.width / 2));
          const context = next.getContext("2d")!;
          context.imageSmoothingQuality = "high";
          context.drawImage(canvas, 0, 0, next.width, next.height);
          canvas = next;
        }
        return canvas.toDataURL("image/png");
      },
      { src: `data:image/png;base64,${png.toString("base64")}`, size },
    );
    return Buffer.from(dataUrl.split(",")[1], "base64");
  };

  const rounded = await render(512, true);
  const favicon = await Promise.all(
    [16, 32, 48].map(async (size) => ({ size, png: await downscale(rounded, size) })),
  );
  writeFileSync("app/favicon.ico", ico(favicon));
  writeFileSync("app/icon.png", rounded);
  // iOS rounds the corners itself and shows transparency as black: square, filled.
  writeFileSync("app/apple-icon.png", await downscale(await render(512, false), 180));
  console.log("[icons] app/favicon.ico, app/icon.png, app/apple-icon.png");
} finally {
  await browser.close();
}
