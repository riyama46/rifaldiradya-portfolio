import { expect, test, type Page } from "@playwright/test";
import { hasCredentials, missingCredentials } from "./helpers";
import { gotoFresh, published, withSelectedWork, type Created } from "./projects-fixture";

// T-31 acceptance (Delta APP_FLOW S-02): AC-3, AC-4, AC-5, the hash behaviour of step 4 and E-29.
// The Work page lists every published project, so assertions are scoped to the rows created here.

test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: "consent", value: "denied", url: "http://localhost:3100" },
    { name: "lang_pref", value: "en", url: "http://localhost:3100" },
  ]);
});

const row = (page: Page, project: Created) => page.locator(`#case-${project.slug}`);

/** The row sits just under the sticky bar (scroll-margin), not hidden behind it. */
async function expectUnderBar(page: Page, project: Created) {
  await expect(async () => {
    const top = await row(page, project).evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeGreaterThanOrEqual(60);
    expect(top).toBeLessThanOrEqual(120);
  }).toPass({ timeout: 5_000 });
}

/**
 * Two HR systems walkthrough cases and one website with a live link, a demo and code (D-42); only
 * the first is on home.
 */
const payloads = (run: string) => [
  published(`E2E HR ${run}`, { group: "panasonic", case_action: "walkthrough" }),
  published(`E2E SSO ${run}`, {
    group: "panasonic",
    case_action: "walkthrough",
    show_on_home: false,
    case_did_en: ["One login.", "No rewrites."],
    case_did_id: ["Satu login.", "Tanpa tulis ulang."],
    tags: ["ASP.NET", "SQL Server"],
  }),
  published(`E2E Site ${run}`, {
    group: "web",
    case_action: "site",
    live_url: "https://example.com/",
    demo_url: "https://example.com/demo",
    repo_url: "https://example.com/code",
    show_on_home: false,
  }),
];

test.describe("Work page", () => {
  test.skip(!hasCredentials, missingCredentials);

  test("S-02 structure, AC-4 filter, AC-5 walkthrough mail, case contents", async ({
    page,
  }, testInfo) => {
    const run = `${testInfo.project.name} ${Date.now()}`;
    await withSelectedWork(page, payloads(run), async ([hr, sso, site]) => {
      await gotoFresh(page, "/work", (page) => row(page, site));
      const rows = page.locator("#cases > li");
      const total = await rows.count();

      // Step 1: H1 with the published count; step 5: closing Contact; footer back to home.
      await expect(page.locator("h1")).toHaveText(`Work${total}`);
      await expect(page.locator("h1 sup")).toHaveText(String(total));
      await expect(page.locator("#more h2")).toHaveText("Have a project like these?");
      await expect(page.locator("#more a[href^='mailto:']")).toHaveCount(2);
      await expect(page.getByRole("link", { name: "Back to home ↑" })).toHaveAttribute("href", "/");

      // Rows: title · meta · side, closed by default.
      await expect(row(page, sso).locator("summary")).toContainText(`E2E SSO ${run}`);
      await expect(row(page, sso).locator(".row-m")).toHaveText("E2E client");
      await expect(row(page, sso)).not.toHaveAttribute("open");

      // AC-4: HR systems shows only HR systems rows, the button is pressed.
      const filters = page.getByRole("group", { name: "Filter projects" });
      const hrSystems = filters.getByRole("button", { name: /^HR systems \d+$/ });
      await hrSystems.click();
      await expect(hrSystems).toHaveAttribute("aria-pressed", "true");
      await expect(filters.getByRole("button", { name: /^All \d+$/ })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      await expect(row(page, hr)).toBeVisible();
      await expect(row(page, sso)).toBeVisible();
      await expect(row(page, site)).toBeHidden();
      for (const item of await rows.all()) {
        if (await item.isVisible()) await expect(item).toHaveAttribute("data-group", "panasonic");
      }
      await filters.getByRole("button", { name: /^All \d+$/ }).click();
      await expect(row(page, site)).toBeVisible();

      // Case contents and the button per case action.
      await row(page, sso).locator("summary").click();
      await expect(row(page, sso)).toHaveAttribute("open");
      const body = row(page, sso).locator(".cols");
      await expect(body).toContainText("A test project.");
      await expect(body.locator("li")).toHaveText(["One login.", "No rewrites."]);
      await expect(body).toContainText("ASP.NET · SQL Server");

      // AC-5: the walkthrough mailto names the project, with the English body.
      const walk = body.getByRole("link", { name: "Email to ask for a walkthrough" });
      const href = decodeURIComponent((await walk.getAttribute("href"))!);
      expect(href).toContain(`subject=Walkthrough: E2E SSO ${run}`);
      expect(href).toContain("The HR process you want to automate:");
      await expect(walk).toHaveAttribute("data-location", "case");

      await row(page, site).locator("summary").click();
      const live = row(page, site).getByRole("link", { name: "Open the live site ↗" });
      await expect(live).toHaveAttribute("href", "https://example.com/");
      await expect(live).toHaveAttribute("target", "_blank");
      await expect(row(page, site).locator("a[href^='mailto:']")).toHaveCount(0);
      // D-42: demo, then code, after the case button; same new-tab rules.
      await expect(row(page, site).locator(".case-acts a")).toHaveText([
        "Open the live site ↗",
        "Watch the demo ↗",
        "View the code ↗",
      ]);
      for (const [name, href, link] of [
        ["Watch the demo ↗", "https://example.com/demo", "demo"],
        ["View the code ↗", "https://example.com/code", "code"],
      ]) {
        const anchor = row(page, site).getByRole("link", { name });
        await expect(anchor).toHaveAttribute("href", href);
        await expect(anchor).toHaveAttribute("rel", "noopener noreferrer");
        await expect(anchor).toHaveAttribute("data-link", link);
      }

      // No horizontal scroll with rows open.
      for (const width of [320, 375, 1280, 1440]) {
        await page.setViewportSize({ width, height: 800 });
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          `${width}px`,
        ).toBe(true);
      }

      // AC-5 in Indonesian: same subject, Indonesian body.
      await gotoFresh(page, "/id/work", (page) => row(page, site));
      await expect(page.locator("h1")).toHaveText(`Karya${total}`);
      await row(page, sso).locator("summary").click();
      const walkId = row(page, sso).getByRole("link", { name: "Email untuk minta walkthrough" });
      const hrefId = decodeURIComponent((await walkId.getAttribute("href"))!);
      expect(hrefId).toContain(`subject=Walkthrough: E2E SSO ${run} ID`);
      expect(hrefId).toContain("Posisi yang dibuka:");
    });
  });

  test("step 4 / AC-3: #case-<slug> opens, resets the filter, focuses; E-29 unknown slug", async ({
    page,
  }, testInfo) => {
    const run = `${testInfo.project.name} ${Date.now()}`;
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await withSelectedWork(page, payloads(run), async ([hr, , site]) => {
      // AC-3: the home title opens the case on the Work page, open and focused.
      await gotoFresh(page, "/", (page) =>
        page.locator(`#work .wt-a[href="/work#case-${hr.slug}"]`),
      );
      await gotoFresh(page, "/work", (page) => row(page, site));
      await page.goto("/");
      await page.locator("#work .wt-a").first().click();
      await expect(page).toHaveURL(`/work#case-${hr.slug}`);
      await expect(row(page, hr)).toHaveAttribute("open");
      await expect(row(page, hr).locator("summary")).toBeFocused();
      await expectUnderBar(page, hr);

      // A filter that hides the target goes back to All.
      await page
        .getByRole("group", { name: "Filter projects" })
        .getByRole("button", { name: /^HR systems \d+$/ })
        .click();
      await expect(row(page, site)).toBeHidden();
      await page.evaluate((slug) => (location.hash = `#case-${slug}`), site.slug);
      await expect(row(page, site)).toBeVisible();
      await expect(row(page, site)).toHaveAttribute("open");
      await expect(row(page, site).locator("summary")).toBeFocused();
      await expect(page.getByRole("button", { name: /^All \d+$/ })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expectUnderBar(page, site);

      // E-29: opening the page with an unknown slug leaves it at the top, no row open, no error.
      // (From another page: a goto that only changes the hash keeps the scroll position.)
      await page.goto("/privacy");
      await page.goto("/work#case-does-not-exist");
      await expect(page.locator("h1")).toBeVisible();
      expect(await page.evaluate(() => scrollY)).toBe(0);
      await expect(page.locator("#cases details[open]")).toHaveCount(0);
      expect(errors).toEqual([]);
    });
  });

  test("AC-4 / E-07: without JS no filter, every row shows and opens", async ({
    browser,
    page,
  }, testInfo) => {
    const run = `${testInfo.project.name} ${Date.now()}`;
    await withSelectedWork(page, payloads(run), async ([hr, sso, site]) => {
      const context = await browser.newContext({
        javaScriptEnabled: false,
        viewport: page.viewportSize()!,
      });
      try {
        const noJs = await context.newPage();
        await gotoFresh(noJs, "/work", (page) => row(page, site));
        await expect(noJs.locator(".filters")).toBeHidden();
        for (const project of [hr, sso, site]) await expect(row(noJs, project)).toBeVisible();
        await row(noJs, sso).locator("summary").click();
        await expect(row(noJs, sso)).toHaveAttribute("open");
        await expect(row(noJs, sso).locator(".cols")).toContainText("A test project.");
      } finally {
        await context.close();
      }
    });
  });
});
