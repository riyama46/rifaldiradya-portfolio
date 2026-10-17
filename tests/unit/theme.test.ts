import { describe, expect, it } from "vitest";
import { resolveTheme, themeScript } from "@/lib/theme";

describe("resolveTheme (D-23 order)", () => {
  it("prefers ?theme= over everything", () => {
    expect(resolveTheme("light", "dark", false)).toBe("light");
    expect(resolveTheme("dark", "light", true)).toBe("dark");
  });

  it("then the saved choice", () => {
    expect(resolveTheme(null, "light", false)).toBe("light");
    expect(resolveTheme("bogus", "dark", true)).toBe("dark");
  });

  it("then the device setting, else dark", () => {
    expect(resolveTheme(null, null, true)).toBe("light");
    expect(resolveTheme(null, "bogus", false)).toBe("dark");
  });
});

type Env = { search?: string; stored?: string | null; storageThrows?: boolean; light?: boolean };

/** Runs the exact inline script against a fake browser and returns the theme it set. */
function runScript({ search = "", stored = null, storageThrows = false, light = false }: Env) {
  const documentElement = { dataset: {} as Record<string, string> };
  const localStorage = {
    getItem: () => {
      if (storageThrows) throw new Error("SecurityError");
      return stored;
    },
  };
  const matchMedia = () => ({ matches: light });
  new Function("document", "location", "localStorage", "matchMedia", themeScript)(
    { documentElement },
    { search },
    localStorage,
    matchMedia,
  );
  return documentElement.dataset.theme;
}

describe("themeScript (inline, before paint)", () => {
  it("applies the same order as resolveTheme", () => {
    expect(runScript({ search: "?theme=light", stored: "dark" })).toBe("light");
    expect(runScript({ stored: "light" })).toBe("light");
    expect(runScript({ light: true })).toBe("light");
    expect(runScript({})).toBe("dark");
  });

  it("falls back to the device setting when storage throws (E-31)", () => {
    expect(runScript({ storageThrows: true, light: true })).toBe("light");
    expect(runScript({ storageThrows: true })).toBe("dark");
  });
});
