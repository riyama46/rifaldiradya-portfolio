import { expect, test, type Page } from "@playwright/test";

// T-28 acceptance (Delta APP_FLOW G2, O-01, O-04, S-04): the bar, the language and theme toggles
// at 375 and 1280 px, the footer back links, and no horizontal scroll from 320 to 1440 px.

const bar = (page: Page) => page.locator("header.site-bar");
const nav = (page: Page) => bar(page).getByRole("navigation", { name: "Main" });

// The cookie banner has its own spec; answer it so it never covers what is checked here.
test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: "consent", value: "denied", url: "http://localhost:3100" },
    { name: "lang_pref", value: "en", url: "http://localhost:3100" },
  ]);
});

for (const width of [375, 1280]) {
  test.describe(`bar at ${width} px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("name, links, language, theme and Email me", async ({ page }) => {
      await page.goto("/work");
      await page.waitForLoadState("networkidle");

      await expect(bar(page)).toHaveCSS("position", "fixed");
      await expect(bar(page).getByRole("link", { name: /Rifaldi/ })).toHaveAttribute("href", "/");

      const work = nav(page).getByRole("link", { name: "Work", exact: true });
      const about = nav(page).getByRole("link", { name: "About", exact: true });
      if (width < 768) {
        // Phones follow option-b.html: Work and About leave the bar.
        await expect(work).toBeHidden();
        await expect(about).toBeHidden();
      } else {
        await expect(work).toHaveAttribute("aria-current", "page");
        await expect(about).toHaveAttribute("href", "/#about");
      }

      const email = nav(page).getByRole("link", { name: "Email me" });
      await expect(email).toBeVisible();
      await expect(email).toHaveAttribute("href", /^mailto:/);
      await expect(email).toHaveAttribute("data-location", "bar");

      // Theme (O-04): the toggle names what a click does and flips data-theme.
      const html = page.locator("html");
      const before = await html.getAttribute("data-theme");
      const after = before === "dark" ? "light" : "dark";
      await nav(page)
        .getByRole("button", { name: `Switch to ${after} mode` })
        .click();
      await expect(html).toHaveAttribute("data-theme", after);

      // Language (O-01): ID goes to the counterpart page.
      await nav(page)
        .getByRole("group", { name: "Language" })
        .getByRole("link", { name: "ID" })
        .click();
      await expect(page).toHaveURL("/id/work");
      await expect(
        bar(page)
          .getByRole("navigation", { name: "Utama" })
          .getByRole("link", { name: "Kirim email" }),
      ).toBeVisible();
      await expect(html).toHaveAttribute("data-theme", after); // the choice survives navigation
    });

    test("every bar control is a 44 px target and fits the row", async ({ page }) => {
      await page.goto("/");
      const controls = bar(page).locator("a:visible, button:visible, [aria-current]:visible");
      for (const box of await controls.evaluateAll((elements) =>
        elements.map((element) => element.getBoundingClientRect().toJSON() as DOMRect),
      )) {
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.right).toBeLessThanOrEqual(width);
      }
    });
  });
}

test("skip link appears on Tab and moves focus to the content", async ({ page }) => {
  await page.goto("/work");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await skip.press("Enter");
  await expect(page.locator("#content")).toBeFocused();
});

test("footer: back to top on home, back to home on Work, none on Privacy and 404", async ({
  page,
}) => {
  const footer = page.locator("footer.site-foot");

  await page.goto("/");
  await expect(footer.getByRole("link", { name: "Back to top ↑" })).toHaveAttribute("href", "#top");
  await expect(footer.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");

  await page.goto("/id/work");
  await expect(footer.getByRole("link", { name: "Kembali ke beranda ↑" })).toHaveAttribute(
    "href",
    "/id",
  );

  for (const path of ["/privacy", "/does-not-exist"]) {
    await page.goto(path);
    await expect(footer).toBeVisible();
    await expect(footer.getByRole("link", { name: /↑/ })).toHaveCount(0);
  }
});

test("404 keeps the bar and its chapter depth layer stays out of the accessibility tree", async ({
  page,
}) => {
  const response = await page.goto("/id/nope");
  expect(response?.status()).toBe(404);
  await expect(bar(page)).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: "Halaman ini tidak ada" }),
  ).toBeVisible();
  await expect(page.locator(".chapter .depth")).toHaveAttribute("aria-hidden", "true");
});

test("no horizontal scroll from 320 to 1440 px", async ({ page }) => {
  for (const width of [320, 375, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    for (const path of ["/", "/work", "/privacy", "/id", "/does-not-exist"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} at ${width} px`).toBe(0);
    }
  }
});
