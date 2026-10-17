import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// T-24 "grep token v1 bersih" (Delta SDD section 8): the v1 tokens and rich-text markers are gone
// from the code and the dictionaries.
const ROOTS = ["app", "components", "lib", "i18n", "styles"];
const EXTENSIONS = /\.(tsx?|css|json)$/;

const V1_PATTERNS = [
  /accent-soft/,
  /font-display\b/,
  /--font-space-grotesk|--font-plex-sans|Space_Grotesk|IBM_Plex/,
  /shadow-card/,
  /--slide-ms/,
  /ease-pulse/,
  /surface-raised/,
  /\bhl-on-(load|view)\b|mark-on-view|status-dot/,
  /<(hl|dim|mark)>/,
];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return EXTENSIONS.test(name) ? [path] : [];
  });
}

describe("v1 design tokens", () => {
  it("are not referenced anywhere", () => {
    const hits = ROOTS.flatMap(files).flatMap((path) => {
      const text = readFileSync(path, "utf8");
      return V1_PATTERNS.filter((pattern) => pattern.test(text)).map((p) => `${path}: ${p}`);
    });
    expect(hits).toEqual([]);
  });

  it("v2 theme tokens exist for both themes", () => {
    const css = readFileSync("styles/globals.css", "utf8");
    for (const selector of [':root[data-theme="dark"]', ':root[data-theme="light"]']) {
      expect(css).toContain(selector);
    }
    for (const value of ["#0b0b0b", "#f6f6f3", "#7b93ff", "#2f4fe0", "#d2bf9f", "#8a7152"]) {
      expect(css).toContain(value);
    }
  });
});
