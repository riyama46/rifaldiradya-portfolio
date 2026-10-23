import { gzipSync } from "node:zlib";
import { expect, test, type Page, type Response } from "@playwright/test";
import { hasCredentials, missingCredentials } from "./helpers";
import { gotoFresh, published, uploadScreenshot, withSelectedWork } from "./projects-fixture";

// T-39 acceptance (CHANGE v2.1.0 O-05, D-31..D-35): AC-1..AC-5, E-34 and the JS budget (Delta PRD
// section 10: at most 3 KB gzip, loaded only on mouse devices).

test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: "consent", value: "denied", url: "http://localhost:3100" },
    { name: "lang_pref", value: "en", url: "http://localhost:3100" },
  ]);
});

const html = (page: Page) => page.locator("html");
const frames = (page: Page) =>
  page.evaluate(() => (window as Window & { frames$?: number }).frames$);
/** Selected work is a pinned stage: jump (the site scrolls smoothly) to the project's step mark. */
const toStep = (page: Page, step: number) =>
  page.evaluate(
    (id) => document.getElementById(id)?.scrollIntoView({ behavior: "instant" }),
    `w${step}`,
  );

/** JS responses that contain the layer's markup: only the PointerLayer chunk does. */
function layerChunks(page: Page) {
  const found: Buffer[] = [];
  page.on("response", async (response: Response) => {
    if (!/\.js(\?|$)/.test(response.url())) return;
    const body = await response.body().catch(() => null);
    if (body?.includes("cur-ring")) found.push(body);
  });
  return found;
}

/** Moves the mouse to the middle of an element, once the layer listens (its effect has run). */
async function hover(page: Page, selector: string) {
  await expect(page.locator("html")).toHaveClass(/has-cursor/);
  const box = await page.locator(selector).first().boundingBox();
  if (!box) throw new Error(`${selector} has no box`);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
}

test.describe("touch screens (AC-2)", () => {
  test("no PointerLayer chunk and no cursor elements", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "touch only");
    const chunks = layerChunks(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.goto("/work");
    await page.waitForLoadState("networkidle");
    expect(chunks).toHaveLength(0);
    await expect(page.locator(".cur-ring, .cur-dot, .spot")).toHaveCount(0);
    await expect(page.locator(".peek")).toBeHidden();
  });
});

test.describe("mouse", () => {
  test.skip(!hasCredentials, missingCredentials);
  test.skip(({ isMobile }) => isMobile, "mouse only");

  test("AC-1, AC-3..AC-5, E-34, zones, Work rows and the JS budget", async ({ page }, testInfo) => {
    const run = `${testInfo.project.name} ${Date.now()}`;
    const payloads = async (page: Page) => {
      const shot = await uploadScreenshot(page);
      return [
        published(`E2E HR System ${run}`, {
          card_number: "13",
          card_caption_en: "group companies on one HR system",
        }),
        published(`E2E Site ${run}`, {
          case_action: "site",
          live_url: "https://example.com/",
          visual_type: "screenshot",
          thumbnail: shot,
          thumbnail_alt_en: "E2E landing page",
          thumbnail_alt_id: "Halaman E2E",
        }),
      ];
    };

    await withSelectedWork(page, payloads, async ([hr, site]) => {
      // Count animation frames the page asks for (AC-3).
      await page.addInitScript(() => {
        const w = window as Window & { frames$?: number };
        w.frames$ = 0;
        const raf = window.requestAnimationFrame.bind(window);
        window.requestAnimationFrame = (callback) => {
          w.frames$ = (w.frames$ ?? 0) + 1;
          return raf(callback);
        };
      });
      const chunks = layerChunks(page);
      await gotoFresh(page, "/", (p) => p.locator(`[data-preview="${hr.slug}"]`));

      // AC-1: the ring says Read and the number card shows next to the cursor.
      const title = `[data-preview="${hr.slug}"]`;
      await toStep(page, 1);
      await hover(page, title);
      await expect(html(page)).toHaveClass(/cur-on/);
      await expect(html(page)).toHaveClass(/cur-label/);
      await expect(page.locator(".cur-ring b")).toHaveText("Read");
      await expect(html(page)).toHaveClass(/peek-on/);
      const card = page.locator(`.peek [data-k="${hr.slug}"]`);
      await expect(card).toHaveClass(/on/);
      await expect(card).toHaveText("13group companies on one HR system");

      // Budget: one separate chunk, at most 3 KB gzip.
      expect(chunks).toHaveLength(1);
      expect(gzipSync(chunks[0]).length).toBeLessThanOrEqual(3 * 1024);

      // The light follows the chapter in the middle of the screen (D-33).
      await expect(html(page)).toHaveAttribute("data-zone", "work");

      // AC-3: once the mouse rests, the loop stops.
      await page.waitForTimeout(1_500);
      const before = await frames(page);
      await page.waitForTimeout(2_000);
      expect(await frames(page)).toBe(before);

      // Tilt on the screenshot, Visit label.
      const shot = `.shot[data-slug="${site.slug}"]`;
      await toStep(page, 2);
      await hover(page, shot);
      await expect(page.locator(".cur-ring b")).toHaveText("Visit");
      await expect
        .poll(() => page.locator(shot).evaluate((el) => el.style.getPropertyValue("--ry")))
        .not.toBe("");

      // E-34: a touch hides the layer; the next mouse move brings it back.
      await page.evaluate(() =>
        window.dispatchEvent(new PointerEvent("pointermove", { pointerType: "touch" })),
      );
      await expect(html(page)).not.toHaveClass(/cur-on/);
      await hover(page, shot);
      await expect(html(page)).toHaveClass(/cur-on/);

      // AC-5: Tab brings the system cursor back and the focus ring shows.
      await page.keyboard.press("Tab");
      await expect(html(page)).not.toHaveClass(/cur-on/);
      await expect(page.locator(":focus-visible")).toHaveCount(1);

      // Work rows preview their project too, also after a client-side navigation from home (the
      // layer lives in the layout and must pick up the new page's .peek and zones).
      await page.locator(".site-bar-nav a.bar-link").first().click();
      await expect(page).toHaveURL(/\/work$/);
      const row = `summary[data-preview="${hr.slug}"]`;
      await page.locator(row).scrollIntoViewIfNeeded();
      await hover(page, row);
      await expect(page.locator(`.peek [data-k="${hr.slug}"]`)).toHaveClass(/on/);
      await expect(html(page)).toHaveAttribute("data-zone", "all");

      // AC-4: reduced motion: no lag, no tilt, links still work.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");
      await toStep(page, 2);
      await hover(page, shot);
      await expect(page.locator(shot)).not.toHaveAttribute("style", /--ry/);
      const at = (selector: string) =>
        page.locator(selector).evaluate((el) => (el as HTMLElement).style.transform);
      await expect.poll(() => at(".cur-ring")).toBe(await at(".cur-dot"));
      await toStep(page, 1);
      await page.locator(title).click();
      await expect(page).toHaveURL(new RegExp(`/work#case-${hr.slug}$`));
    });
  });
});
