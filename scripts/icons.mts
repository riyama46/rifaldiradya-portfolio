// Renders the site icons from the "RR" initials in the accent colour (PRD launch checklist):
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
  div {
    width: ${size}px; height: ${size}px; display: grid; place-items: center;
    background: oklch(52% 0.15 50); color: #fff;
    border-radius: ${rounded ? "22%" : "0"};
    font: 600 ${Math.round(size * 0.5)}px/1 "Space Grotesk"; letter-spacing: -0.04em;
  }
</style></head><body><div>RR</div></body></html>`;

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

  const favicon = await Promise.all(
    [16, 32, 48].map(async (size) => ({ size, png: await render(size, true) })),
  );
  writeFileSync("app/favicon.ico", ico(favicon));
  writeFileSync("app/icon.png", await render(512, true));
  // iOS rounds the corners itself and shows transparency as black: square, filled.
  writeFileSync("app/apple-icon.png", await render(180, false));
  console.log("[icons] app/favicon.ico, app/icon.png, app/apple-icon.png");
} finally {
  await browser.close();
}
