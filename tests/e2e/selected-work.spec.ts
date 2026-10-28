import { expect, test, type Page } from "@playwright/test";
import { hasCredentials, missingCredentials } from "./helpers";
import { published, uploadScreenshot, withSelectedWork } from "./projects-fixture";

// T-30 acceptance (Delta APP_FLOW S-01 bab 2): AC-2, AC-3 (home side), E-25 and the plain-list
// fallback (E-30). Every test starts from an empty Selected work (projects-fixture).

test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: "consent", value: "denied", url: "http://localhost:3100" },
    { name: "lang_pref", value: "en", url: "http://localhost:3100" },
  ]);
});

test.describe("Selected work", () => {
  test.skip(!hasCredentials, missingCredentials);

  test("AC-2 / AC-3: five projects in admin order, counter, rail, links to the case", async ({
    page,
  }, testInfo) => {
    const run = `${testInfo.project.name} ${Date.now()}`;
    const payloads = async (page: Page) => {
      const shot = await uploadScreenshot(page);
      return [
        published(`E2E One ${run}`),
        published(`E2E Two ${run}`),
        published(`E2E Three ${run}`),
        published(`E2E Four ${run}`, {
          case_action: "site",
          live_url: "https://example.com/",
          visual_type: "screenshot",
          thumbnail: shot,
          thumbnail_alt_en: "E2E landing page",
          thumbnail_alt_id: "Halaman E2E",
        }),
        published(`E2E Five ${run}`, {
          case_action: "walkthrough",
          demo_url: "https://example.com/demo",
          repo_url: "https://example.com/code",
        }),
      ];
    };

    await withSelectedWork(page, payloads, async (created) => {
      await page.goto("/");
      const work = page.locator("#work");
      const ids = await page
        .locator("main > section")
        .evaluateAll((sections) => sections.map((section) => section.id));
      expect(ids).toEqual(["top", "work", "about", "highlight", "contact"]);
      await expect(page.locator("#top .hero-scroll")).toHaveAttribute("href", "#work");

      // AC-2: exactly five, in admin order, numbered 01/05 … 05/05.
      await expect(work.locator("h3.wt")).toHaveText(created.map((project) => `${project.title}→`));
      await expect(work.locator(".cn b")).toHaveText(["01", "02", "03", "04", "05"]);
      await expect(work.locator(".work-count")).toContainText("/ 05");
      await expect(work.locator(".proj-label").first()).toHaveText("01 / 05 · E2E client · 2026");
      await expect(work.locator(".rail a")).toHaveText(created.map((project) => project.title));
      await expect(work.locator(".marks i")).toHaveCount(5);

      // Pinned (Edge/Chromium support scroll-driven animations): one project per scroll step.
      for (const step of [1, 3]) {
        await page.evaluate((id) => document.getElementById(id)?.scrollIntoView(), `w${step}`);
        await expect(work.locator("h3.wt").nth(step - 1)).toBeVisible();
        await expect(work.locator(".cn b").nth(step - 1)).toBeVisible();
      }
      await expect(work.locator("h3.wt").nth(1)).toBeHidden();
      await expect(work.getByRole("link", { name: "See all work →" })).toHaveAttribute(
        "href",
        "/work",
      );

      // AC-3 (home side, D-06): the title opens the case on the Work page.
      for (const [index, project] of created.entries()) {
        await expect(work.locator(".wt-a").nth(index)).toHaveAttribute(
          "href",
          `/work#case-${project.slug}`,
        );
      }
      await expect(work.locator(".wt-a[data-cursor=read]")).toHaveCount(5);

      // Only the site project has the live link and the (lazy) screenshot; the demo project shows
      // "Watch the demo" and keeps its code link for the case row (D-42).
      const site = work.locator(".proj").nth(3);
      await expect(site.locator(".proj-links a")).toHaveAttribute("href", "https://example.com/");
      await expect(site.locator(".shot[data-cursor=visit] img")).toHaveAttribute("loading", "lazy");
      const demo = work.locator(".proj").nth(4).locator(".proj-links a");
      await expect(demo).toHaveText("Watch the demo ↗");
      await expect(demo).toHaveAttribute("href", "https://example.com/demo");
      await expect(demo).toHaveAttribute("data-link", "demo");
      await expect(work.locator(".proj-links a")).toHaveCount(2);
      await expect(work.locator(".shot")).toHaveCount(1);

      // No horizontal scroll from the large titles.
      for (const width of [320, 375, 1280, 1440]) {
        await page.setViewportSize({ width, height: 800 });
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          `${width}px`,
        ).toBe(true);
      }

      // Indonesian titles link to the Indonesian Work page.
      await page.goto("/id");
      const first = page.locator("#work .wt-a").first();
      await expect(first).toHaveText(`${created[0].title} ID→`);
      await expect(first).toHaveAttribute("href", `/id/work#case-${created[0].slug}`);
    });
  });

  test("E-30: with reduced motion every project is a plain list item, all visible", async ({
    page,
  }, testInfo) => {
    const run = `${testInfo.project.name} ${Date.now()}`;
    await withSelectedWork(
      page,
      [published(`E2E A ${run}`), published(`E2E B ${run}`), published(`E2E C ${run}`)],
      async () => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto("/");
        const items = page.locator("#work .proj");
        await expect(items).toHaveCount(3);
        for (const item of await items.all()) {
          await item.scrollIntoViewIfNeeded();
          await expect(item).toBeVisible();
          expect(await item.evaluate((el) => getComputedStyle(el).position)).toBe("static");
        }
        // The rail steers the pinned steps only; the plain list keeps its own labels.
        await expect(page.locator("#work .rail")).toBeHidden();
        await expect(page.locator("#work .pn").first()).toBeVisible();
      },
    );
  });

  test("E-25: no project in Selected work → no chapter, Scroll ↓ goes to About", async ({
    page,
  }) => {
    await withSelectedWork(page, [], async () => {
      // Pages are revalidated on admin saves; switching off in SQL needs one to show.
      const origin = new URL(page.url()).origin;
      const response = await page.request.post("/api/admin/projects", {
        headers: { Origin: origin },
        data: { ...published("E2E E-25"), show_on_home: false, published: false },
      });
      const { project } = await response.json();
      try {
        await expect(async () => {
          await page.goto("/");
          await expect(page.locator("#work")).toHaveCount(0, { timeout: 1_000 });
        }).toPass({ timeout: 30_000 });
        await expect(page.locator("#top .hero-scroll")).toHaveAttribute("href", "#about");
      } finally {
        await page.request.delete(`/api/admin/projects/${project.id}`, {
          headers: { Origin: origin },
        });
      }
    });
  });
});
