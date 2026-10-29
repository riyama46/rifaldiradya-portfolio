import { expect, test, type Page } from "@playwright/test";
import { hasCredentials, missingCredentials } from "./helpers";
import { published, withSelectedWork } from "./projects-fixture";

// UF-05 (O-03 + GA4). The build uses the test ID G-E2ETEST1 (playwright.config.ts). Requests to
// Google are intercepted: nothing leaves the machine, and the test sees exactly when gtag.js is
// requested. The stub records gtag commands so events can be checked.

const GTAG_STUB = "window.__gtagLoaded = true;";

async function watchGtag(page: Page) {
  const requests: string[] = [];
  await page.route("https://www.googletagmanager.com/**", (route) => {
    requests.push(route.request().url());
    return route.fulfill({ contentType: "text/javascript", body: GTAG_STUB });
  });
  await page.route("https://*.google-analytics.com/**", (route) => route.abort());
  return requests;
}

const banner = (page: Page) => page.getByRole("region", { name: "Cookie choice" });
const cookie = async (page: Page, name: string) =>
  (await page.context().cookies()).find((c) => c.name === name)?.value;
const events = (page: Page) =>
  page.evaluate(() =>
    (window.dataLayer ?? [])
      .map((entry) => Array.from(entry as ArrayLike<unknown>))
      .filter((args) => args[0] === "event")
      .map((args) => [args[1], args[2]]),
  );

test("nothing loads before a choice; Accept loads GA4 and counts the page", async ({ page }) => {
  const gtag = await watchGtag(page);
  await page.goto("/");
  await expect(banner(page)).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(gtag).toHaveLength(0);
  expect(await cookie(page, "_ga")).toBeUndefined();

  await banner(page).getByRole("button", { name: "Accept" }).click();
  await expect(banner(page)).toHaveCount(0);
  expect(await cookie(page, "consent")).toBe("granted");
  await expect.poll(() => gtag.length).toBe(1);
  expect(gtag[0]).toContain("id=G-E2ETEST1");

  const commands = await page.evaluate(() =>
    (window.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>).slice(0, 2)),
  );
  expect(commands).toContainEqual(["consent", "default"]);
  expect(commands).toContainEqual(["consent", "update"]);
  expect(commands).toContainEqual(["config", "G-E2ETEST1"]);

  // Next page: no banner, GA4 starts on load.
  await page.goto("/work");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(banner(page)).toHaveCount(0);
  await expect.poll(() => gtag.length).toBe(2);
});

test("Reject: no GA4; ignoring the banner asks again on the next page", async ({ page }) => {
  const gtag = await watchGtag(page);
  await page.goto("/");
  await page.goto("/work"); // ignored on the first page
  await expect(banner(page)).toBeVisible();

  await banner(page).getByRole("button", { name: "Reject" }).click();
  expect(await cookie(page, "consent")).toBe("denied");
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(banner(page)).toHaveCount(0);
  expect(gtag).toHaveLength(0);
});

test("Cookie settings reopens the banner with the choice marked; switching to Reject removes _ga", async ({
  page,
  context,
}) => {
  await watchGtag(page);
  await context.addCookies([
    { name: "consent", value: "granted", url: "http://localhost:3100" },
    { name: "_ga", value: "GA1.1.123", url: "http://localhost:3100" },
    { name: "_ga_E2ETEST1", value: "GS1.1", url: "http://localhost:3100" },
  ]);
  await page.goto("/privacy");
  await expect(banner(page)).toHaveCount(0);

  const settings = page.getByRole("contentinfo").getByRole("button", { name: "Cookie settings" });
  await settings.click();
  await expect(banner(page)).toBeVisible();
  const accept = banner(page).getByRole("button", { name: "Accept" });
  await expect(accept).toHaveAttribute("aria-pressed", "true");
  await expect(accept).toBeFocused();

  await banner(page).getByRole("button", { name: "Reject" }).click();
  await expect(banner(page)).toHaveCount(0);
  await expect(settings).toBeFocused(); // focus returns to the opener
  expect(await cookie(page, "consent")).toBe("denied");
  expect(await cookie(page, "_ga")).toBeUndefined();
  expect(await cookie(page, "_ga_E2ETEST1")).toBeUndefined();

  // The privacy page has its own button too (S-03).
  await page.getByRole("main").getByRole("button", { name: "Cookie settings" }).click();
  await expect(banner(page).getByRole("button", { name: "Reject" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("events: email kinds, CV, and project clicks are tracked after consent", async ({
  page,
  context,
}) => {
  test.skip(!hasCredentials, missingCredentials); // the Work part creates projects
  await watchGtag(page);
  await context.addCookies([{ name: "consent", value: "granted", url: "http://localhost:3100" }]);
  // mailto would open a mail app, a CV link would download, a live site would open a tab: keep the
  // clicks (and their events), stop the navigation.
  await page.addInitScript(() =>
    document.addEventListener("click", (event) => {
      const link = (event.target as Element).closest("a");
      if (link?.matches("[href^='mailto:'], [download], [target=_blank]")) event.preventDefault();
    }),
  );
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.locator("#top").getByRole("link", { name: "Email me" }).click();
  await page
    .locator("#contact")
    .getByRole("link", { name: "Email about a full-time role" })
    .click();
  await page.locator("#about").getByRole("link", { name: "Download CV (PDF)" }).click();
  expect(await events(page)).toEqual(
    expect.arrayContaining([
      [
        "contact_email_click",
        { kind: "general", location: "hero", method: "mailto", language: "en" },
      ],
      [
        "contact_email_click",
        { kind: "role", location: "contact", method: "mailto", language: "en" },
      ],
      ["cv_download", { location: "about", language: "en" }],
    ]),
  );

  // Work: opening a row, its live site, and a walkthrough email (with the project slug).
  await withSelectedWork(
    page,
    [
      published("E2E Site", { case_action: "site", live_url: "https://example.com" }),
      published("E2E Walk", { case_action: "walkthrough" }),
    ],
    async ([site, walk]) => {
      await page.goto("/work");
      await page.waitForLoadState("networkidle");
      const siteCase = page.locator(`#case-${site.slug}`);
      await siteCase.locator("summary").click();
      await siteCase.locator("a[data-placement=case]").click();
      const walkCase = page.locator(`#case-${walk.slug}`);
      await walkCase.locator("summary").click();
      await walkCase.locator("a[data-kind=walkthrough]").click();

      const sent = await events(page);
      expect(sent).toContainEqual([
        "project_link_click",
        { project_slug: site.slug, page: "work", placement: "case", link: "site", language: "en" },
      ]);
      expect(sent.filter(([name]) => name === "case_open")).toHaveLength(2);
      expect(sent).toContainEqual([
        "contact_email_click",
        {
          kind: "walkthrough",
          location: "case",
          method: "mailto",
          language: "en",
          project_slug: walk.slug,
        },
      ]);
    },
  );
});

test.describe("phones", () => {
  test.use({ viewport: { width: 375, height: 667 }, locale: "id-ID" });

  test("the banner stays compact and leaves the hero CTA visible; O-02 waits for it", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "phone layout only");
    await watchGtag(page);
    await page.goto("/");
    await expect(banner(page)).toBeVisible();

    const box = (await banner(page).boundingBox())!;
    const cta = (await page.locator("#top").getByRole("link", { name: "Email me" }).boundingBox())!;
    expect(box.height).toBeLessThanOrEqual(130);
    expect(cta.y + cta.height).toBeLessThanOrEqual(box.y);

    const language = page.getByRole("region", { name: "Also available in Indonesian." });
    await expect(language).toHaveCount(0); // O-02 waits on phones
    await banner(page).getByRole("button", { name: "Reject" }).click();
    await expect(language).toBeVisible();
  });
});

test.describe("laptops", () => {
  test.use({ viewport: { width: 1366, height: 768 } });

  test("keyboard focus under the banner is scrolled above it (WCAG 2.4.11)", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "desktop layout only");
    await watchGtag(page);
    await page.goto("/");
    await expect(banner(page)).toBeVisible();

    const cta = page.locator("#top").getByRole("link", { name: "Email me" });
    await cta.focus();
    const cover = (await banner(page).boundingBox())!;
    const control = (await cta.boundingBox())!;
    const overlaps =
      control.y + control.height > cover.y &&
      control.x + control.width > cover.x &&
      control.x < cover.x + cover.width;
    expect(overlaps).toBe(false);
  });
});
