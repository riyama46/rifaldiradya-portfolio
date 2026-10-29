// Renders the Open Graph images (1200 × 630) to public/og/en.png and public/og/id.png
// (Delta SDD section 7): the hero in the v2 dark theme, Archivo, copy read from the dictionaries
// so the card always says what the homepage says.
// Run after changing the hero copy:  node scripts/og-images.mts
// Uses the installed Microsoft Edge through Playwright (PW_CHANNEL to change it) and needs network
// access for Google Fonts.
import { mkdirSync, readFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { siteConfig } from "../lib/site-config.ts";

type Hero = { role: string; loc: string; l1: string; l2: string };
const hero = (lang: "en" | "id"): Hero =>
  JSON.parse(readFileSync(`i18n/${lang}.json`, "utf8")).hero as Hero;

// Dark theme tokens of Delta PRD section 8 (the site's default theme).
const TOKENS =
  "--bg: #0b0b0b; --ink: #f1f1ef; --soft: rgba(241, 241, 239, 0.62); --accent: #7b93ff;";
// Same stack line as the hero (CHANGE v2.2.0).
const STACK = siteConfig.stack;

// The dictionary marks the accent word with <em>; the card renders it like em.ac on the site.
const accent = (line: string) => line.replace(/<em>(.*?)<\/em>/g, '<em class="ac">$1</em>');

const page = (lang: "en" | "id", { role, loc, l1, l2 }: Hero) => `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;0,600;1,600&display=block" rel="stylesheet">
<style>
  :root { ${TOKENS} }
  * { margin: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; }
  body {
    background: var(--bg); color: var(--ink); font-family: "Archivo", sans-serif;
    display: flex; flex-direction: column; justify-content: space-between; padding: 60px 72px 56px;
  }
  .me { font-size: 24px; font-weight: 600; letter-spacing: -0.01em; }
  .label {
    margin-top: 10px; font-size: 15px; font-weight: 500; letter-spacing: 0.14em;
    text-transform: uppercase; color: var(--soft);
  }
  h1 { font-size: 112px; line-height: 0.98; letter-spacing: -0.035em; font-weight: 600; }
  h1 span { display: block; white-space: nowrap; }
  em.ac { font-style: italic; color: var(--accent); }
  .foot {
    display: flex; justify-content: space-between; align-items: baseline; margin-top: 40px;
    font-size: 20px; color: var(--soft);
  }
  .foot b { color: var(--ink); font-weight: 600; }
  .foot i { font-style: normal; margin: 0 10px; opacity: 0.6; }
</style></head>
<body>
  <header><p class="me">Rifaldi Radya Pratama</p><p class="label">${role} · ${loc}</p></header>
  <div>
    <h1><span>${accent(l1)}</span><span>${accent(l2)}</span></h1>
    <p class="foot"><span>${STACK.join("<i>·</i>")}</span><b>rifaldiradya.com</b></p>
  </div>
</body></html>`;

mkdirSync("public/og", { recursive: true });
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? "msedge" });
try {
  const tab = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (const lang of ["en", "id"] as const) {
    await tab.setContent(page(lang, hero(lang)), { waitUntil: "networkidle" });
    await tab.evaluate(() => document.fonts.ready);
    // Longer headlines (ID) shrink until both lines fit the card's width.
    await tab.evaluate(() => {
      const h1 = document.querySelector("h1")!;
      let size = 112;
      while (h1.scrollWidth > h1.clientWidth && size > 64) h1.style.fontSize = `${(size -= 2)}px`;
    });
    await tab.screenshot({ path: `public/og/${lang}.png` });
    console.log(`[og] public/og/${lang}.png`);
  }
} finally {
  await browser.close();
}
