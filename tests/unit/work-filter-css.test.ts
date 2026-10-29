import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PROJECT_GROUPS } from "@/lib/projects/validation";

// The Work filter only sets data-filter on the list; globals.css hides the other rows.
// A group without its rule shows every row when its button is pressed.
describe("Work filter CSS", () => {
  const css = readFileSync(join(process.cwd(), "styles/globals.css"), "utf8");

  it.each(PROJECT_GROUPS)("hides other rows for the %s filter", (group) => {
    expect(css).toContain(`.rows[data-filter="${group}"] .row:not([data-group="${group}"])`);
  });
});
