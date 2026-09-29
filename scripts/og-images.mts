// Renders the Open Graph images (1200 × 630) to public/og/en.png and public/og/id.png
// (SDD section 7). Same tokens, fonts, and highlighter as the homepage hero.
// Run after changing the headline:  node scripts/og-images.mts
// Uses the installed Microsoft Edge through Playwright (PW_CHANNEL to change it) and needs network
// access for Google Fonts.
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const copy = {
  en: {
    lang: "en",
    title:
      'Landing Pages That Launch in <span class="hl">Days</span>, <span class="dim">Not Weeks</span>',
    meta: "Available for new projects · Based in Indonesia",
  },
  id: {
    lang: "id",
    title:
      'Landing Page Siap Pakai dalam Hitungan <span class="hl">Hari</span>, <span class="dim">Bukan Minggu</span>',
    meta: "Menerima project baru · Berbasis di Indonesia",
  },
} as const;

const page = ({ lang, title, meta }: (typeof copy)[keyof typeof copy]) => `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500&family=Space+Grotesk:wght@600&display=block" rel="stylesheet">
<style>
  :root {
    --bg: oklch(98.5% 0.008 85); --border: oklch(88% 0.015 80); --text: oklch(22% 0.02 60);
    --muted: oklch(45% 0.02 60); --accent: oklch(52% 0.15 50); --soft: oklch(93% 0.05 75);
    --success: oklch(51% 0.13 150);
  }
  * { margin: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; }
  body {
    background: var(--bg); color: var(--text); font-family: "IBM Plex Sans", sans-serif;
    display: flex; flex-direction: column; justify-content: space-between; padding: 64px 72px;
    background-image:
      linear-gradient(color-mix(in oklab, var(--border) 55%, transparent) 1px, transparent 1px),
      linear-gradient(90deg, color-mix(in oklab, var(--border) 55%, transparent) 1px, transparent 1px);
    background-size: 48px 48px;
  }
  .byline { display: flex; align-items: center; gap: 18px; }
  .avatar {
    width: 76px; height: 76px; border-radius: 50%; display: grid; place-items: center;
    background: var(--soft); font: 600 28px "Space Grotesk";
    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--accent) 25%, transparent);
  }
  .name { font-size: 24px; font-weight: 500; }
  .role { font-size: 20px; color: var(--muted); margin-top: 2px; }
  h1 {
    font: 600 74px/1.05 "Space Grotesk"; letter-spacing: -0.03em; max-width: 15ch;
  }
  .hl { position: relative; z-index: 0; white-space: nowrap; }
  .hl::before {
    content: ""; position: absolute; z-index: -1; inset: 0.42em -0.1em 0.04em -0.08em;
    border-radius: 4px; background: var(--soft); transform: skew(-10deg) rotate(-1.2deg);
  }
  .dim { color: var(--muted); white-space: nowrap; }
  .footer { display: flex; align-items: center; justify-content: space-between; font-size: 22px; }
  .site { font: 600 26px "Space Grotesk"; color: var(--accent); }
  .meta { color: var(--muted); display: flex; align-items: center; gap: 12px; }
  .dot { width: 12px; height: 12px; border-radius: 50%; background: var(--success); }
</style></head>
<body>
  <div class="byline"><div class="avatar">RR</div>
    <div><p class="name">Rifaldi Radya Pratama</p><p class="role">Web Developer</p></div></div>
  <h1>${title}</h1>
  <div class="footer"><p class="site">rifaldiradya.com</p>
    <p class="meta"><span class="dot"></span>${meta}</p></div>
</body></html>`;

mkdirSync("public/og", { recursive: true });
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? "msedge" });
try {
  const tab = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (const [locale, content] of Object.entries(copy)) {
    await tab.setContent(page(content), { waitUntil: "networkidle" });
    await tab.evaluate(() => document.fonts.ready);
    await tab.screenshot({ path: `public/og/${locale}.png` });
    console.log(`[og] public/og/${locale}.png`);
  }
} finally {
  await browser.close();
}
