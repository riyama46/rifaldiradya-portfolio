import { expect, test, type Page } from "@playwright/test";

// UF-02 (O-02 language suggestion) and UF-04 (O-01 toggle). Public pages only; no admin needed.

const langPref = async (page: Page) =>
  (await page.context().cookies()).find((cookie) => cookie.name === "lang_pref")?.value;

/** Carrying the #hash needs the hydrated toggle; before that the link still works, without the hash. */
const ready = (page: Page) => page.waitForLoadState("networkidle");

const banner = (page: Page) => page.getByRole("region", { name: "Also available in Indonesian." });

// These flows are about language only: answer the cookie banner up front (it has its own spec),
// otherwise on phones O-02 correctly waits for it.
test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "consent", value: "denied", url: "http://localhost:3100" }]);
});

test.describe("UF-04: language toggle", () => {
  test("switches to the counterpart page, keeps the #anchor, stores the choice", async ({
    page,
  }) => {
    await page.goto("/#work");
    await ready(page);
    await page.getByRole("group", { name: "Language" }).getByRole("link", { name: "ID" }).click();
    await expect(page).toHaveURL("/id#work");
    await expect(page.locator("html")).toHaveAttribute("lang", "id");
    expect(await langPref(page)).toBe("id");

    await ready(page);
    await page.getByRole("group", { name: "Bahasa" }).getByRole("link", { name: "EN" }).click();
    await expect(page).toHaveURL("/#work");
    expect(await langPref(page)).toBe("en");
  });

  test("maps /work to /id/work and back", async ({ page }) => {
    await page.goto("/work");
    await page.getByRole("group", { name: "Language" }).getByRole("link", { name: "ID" }).click();
    await expect(page).toHaveURL("/id/work");
  });
});

test.describe("UF-02: suggestion for Indonesian browsers", () => {
  test.use({ locale: "id-ID" });

  test("appears on English pages without moving the page, and leads to /id", async ({ page }) => {
    await page.goto("/");
    const heading = page.getByRole("heading", { level: 1 });
    const before = await heading.boundingBox();
    await expect(banner(page)).toBeVisible();
    expect(await heading.boundingBox()).toEqual(before); // overlay, no layout shift

    await banner(page).getByRole("link", { name: "Lihat versi Indonesia" }).click();
    await expect(page).toHaveURL("/id");
    expect(await langPref(page)).toBe("id");

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(banner(page)).toHaveCount(0); // choice remembered
  });

  test("dismiss stores English and does not ask again", async ({ page }) => {
    await page.goto("/work");
    await banner(page).getByRole("button", { name: "Dismiss" }).click();
    await expect(banner(page)).toHaveCount(0);
    expect(await langPref(page)).toBe("en");
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(banner(page)).toHaveCount(0);
  });

  test("never appears on Indonesian pages", async ({ page }) => {
    await page.goto("/id");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(banner(page)).toHaveCount(0);
  });
});

test.describe("UF-01: other browsers", () => {
  test.use({ locale: "en-US" });

  test("see no suggestion", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(banner(page)).toHaveCount(0);
  });
});

test("the current language is marked but is not a link; every link can be crawled", async ({
  page,
}) => {
  for (const path of ["/", "/id/work", "/privacy"]) {
    await page.goto(path);
    const group = page.getByRole("group", { name: path.startsWith("/id") ? "Bahasa" : "Language" });
    await expect(group.getByRole("link")).toHaveCount(1);
    await expect(group.locator("[aria-current=true]")).toHaveCount(1);
    // Lighthouse SEO "Links are not crawlable": no <a> without a real href.
    const uncrawlable = await page
      .locator("a:not([href]), a[href=''], a[href^='javascript:']")
      .count();
    expect(uncrawlable, path).toBe(0);
  }
});
