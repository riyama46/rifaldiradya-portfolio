import { expect, test, type Page } from "@playwright/test";

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

test("events: email and project clicks are tracked after consent", async ({ page, context }) => {
  await watchGtag(page);
  await context.addCookies([{ name: "consent", value: "granted", url: "http://localhost:3100" }]);
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // mailto would open a mail app; keep the click but stop the navigation.
  await page.evaluate(() =>
    document.addEventListener("click", (event) => {
      if ((event.target as Element).closest("a[href^='mailto:']")) event.preventDefault();
    }),
  );
  await page.locator("#top").getByRole("link", { name: "Email me" }).click();
  expect(await events(page)).toContainEqual([
    "contact_email_click",
    { location: "hero", method: "mailto", language: "en" },
  ]);

  // Project links open the live site in a new tab; keep the click, stop the tab.
  await page.goto("/work");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() =>
    document.addEventListener("click", (event) => {
      if ((event.target as Element).closest("a[target=_blank]")) event.preventDefault();
    }),
  );
  await page.locator("article a[data-placement=card]:not([aria-hidden])").first().click();
  const projectClick = (await events(page)).find(([name]) => name === "project_link_click");
  expect(projectClick?.[1]).toMatchObject({ page: "work", placement: "card", language: "en" });
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
