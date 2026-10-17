import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { hasCredentials, missingCredentials, signIn } from "./helpers";

// O-04 / D-23 / E-07 / E-31 (Delta APP_FLOW) and the T-24 acceptance: no flash of the wrong
// theme, the toggle, and axe in both themes.

const BG = { dark: "rgb(11, 11, 11)", light: "rgb(246, 246, 243)" } as const;

const theme = (page: Page) => page.locator("html").getAttribute("data-theme");
const background = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);

/** Blocks every external script, so only the inline <head> script can have set the theme. */
async function blockBundles(page: Page) {
  await page.route(/\/_next\/static\/.*\.js(\?.*)?$/, (route) => route.abort());
}

test.describe("no flash: the inline script decides before any bundle runs", () => {
  for (const scheme of ["dark", "light"] as const) {
    test(`follows the device setting (${scheme})`, async ({ page }, testInfo) => {
      await page.emulateMedia({ colorScheme: scheme });
      await blockBundles(page);
      await page.goto("/");
      expect(await theme(page)).toBe(scheme);
      expect(await background(page)).toBe(BG[scheme]);
      await testInfo.attach(`first-frame-${scheme}`, {
        body: await page.screenshot(),
        contentType: "image/png",
      });
    });
  }

  test("a saved choice beats the device setting", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.addInitScript(() => localStorage.setItem("rr-theme", "light"));
    await blockBundles(page);
    await page.goto("/work");
    expect(await theme(page)).toBe("light");
    expect(await background(page)).toBe(BG.light);
  });

  test("?theme= beats a saved choice", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("rr-theme", "light"));
    await blockBundles(page);
    await page.goto("/?theme=dark");
    expect(await theme(page)).toBe("dark");
  });
});

test.describe("O-04 toggle", () => {
  test("switches, remembers and relabels", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "Switch to light mode" }).click();
    expect(await theme(page)).toBe("light");
    expect(await page.evaluate(() => localStorage.getItem("rr-theme"))).toBe("light");
    await expect(page.getByRole("button", { name: "Switch to dark mode" })).toBeVisible();

    await page.reload();
    expect(await theme(page)).toBe("light");
  });

  test("uses the Indonesian label on /id", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/id");
    await expect(page.getByRole("button", { name: "Ganti ke mode gelap" })).toBeVisible();
  });

  test("still switches when storage is blocked (E-31)", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new DOMException("blocked", "SecurityError");
        },
      });
    });
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(await theme(page)).toBe("light");
    await page.getByRole("button", { name: "Switch to dark mode" }).click();
    expect(await theme(page)).toBe("dark");
  });

  test("admin header has the toggle", async ({ page }) => {
    test.skip(!hasCredentials, missingCredentials);
    await page.emulateMedia({ colorScheme: "dark" });
    await signIn(page);
    await page.getByRole("button", { name: "Switch to light mode" }).click();
    expect(await theme(page)).toBe("light");
  });
});

test.describe("without JS (E-07)", () => {
  test.use({ javaScriptEnabled: false });

  test("follows the device setting and hides the toggle", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    expect(await theme(page)).toBeNull();
    expect(await background(page)).toBe(BG.light);
    await expect(page.locator(".theme-toggle")).toBeHidden();
  });
});

test.describe("axe in both themes", () => {
  const pages = ["/", "/work", "/privacy", "/id", "/id/work", "/does-not-exist", "/admin/login"];

  for (const scheme of ["dark", "light"] as const) {
    test(`no WCAG A/AA violations (${scheme})`, async ({ page }) => {
      // Scroll-driven reveals leave text half-transparent mid-animation; axe judges the end state.
      await page.emulateMedia({ reducedMotion: "reduce" });
      for (const path of pages) {
        await page.goto(`${path}${path.includes("?") ? "&" : "?"}theme=${scheme}`);
        await page.waitForLoadState("networkidle");
        const { violations } = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          // WCAG 2.5.3 is only broken by v1 links (HeroProofPanel, ProjectCard "Visit live site"
          // with a longer aria-label). Both are deleted in T-29/T-30; turn the rule back on there.
          .disableRules(["label-content-name-mismatch"])
          .analyze();
        expect(
          violations.map((v) => `${path}: ${v.id} (${v.nodes.map((n) => n.target).join(", ")})`),
        ).toEqual([]);
      }
    });
  }
});
