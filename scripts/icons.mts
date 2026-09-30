// Renders the site icons (PRD launch checklist), design "B · highlighter" chosen by Pal: white "RR"
// on the site's dark text colour with an amber highlighter stroke, like "Days" in the hero H1.
//   app/favicon.ico (16, 32, 48), app/icon.png (512), app/apple-icon.png (180).
// Next.js serves these file conventions and adds the <link> tags itself.
// Run after changing the design:  node scripts/icons.mts
// Uses the installed Microsoft Edge through Playwright (PW_CHANNEL to change it) and Google Fonts.
import { writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const html = (size: number, rounded: boolean) => `<!doctype html>
<html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600&display=block" rel="stylesheet">
<style>
  * { margin: 0; }
  html, body { width: ${size}px; height: ${size}px; background: transparent; }
  .tile {
    position: relative; overflow: hidden;
    width: ${size}px; height: ${size}px; display: grid; place-items: center;
    background: oklch(22% 0.02 60);
    border-radius: ${rounded ? "22%" : "0"};
  }
  /* The hero highlighter (.hl::before) on a dark tile: a brighter amber so it still reads at 16 px. */
  .stroke {
    position: absolute; left: 19%; top: 47%; width: 64%; height: 21%;
    border-radius: ${Math.max(1, size * 0.03)}px; background: oklch(74% 0.13 65);
    transform: skew(-10deg) rotate(-2deg);
  }
  .letters {
    position: relative; color: #fff;
    font: 600 ${Math.round(size * 0.5)}px/1 "Space Grotesk"; letter-spacing: -0.04em;
  }
</style></head><body><div class="tile"><div class="stroke"></div><div class="letters">RR</div></div></body></html>`;

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
