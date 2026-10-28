import { expect, test, type Page } from "@playwright/test";
import { siteConfig } from "../../lib/site-config";

// T-29 acceptance (Delta APP_FLOW S-01 bab 1/3/4/5): Hero, About, Highlight and Contact, the four
// mailto kinds, Download CV, the GMT+7 clock, and the static end state of every chapter (E-30).

const hero = (page: Page) => page.locator("#top");
const contact = (page: Page) => page.locator("#contact");

test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: "consent", value: "denied", url: "http://localhost:3100" },
    { name: "lang_pref", value: "en", url: "http://localhost:3100" },
  ]);
});

test("chapters in order: Hero, Selected work, About, Highlight, Contact", async ({ page }) => {
  await page.goto("/");
  const ids = await page
    .locator("main > section")
    .evaluateAll((sections) => sections.map((section) => section.id));
  // Selected work depends on the data (E-25); selected-work.spec.ts covers it with its own.
  expect(ids.filter((id) => id !== "work")).toEqual(["top", "about", "highlight", "contact"]);
  expect(ids.indexOf("work")).toBeLessThan(2);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "I automate the HR work done by hand.",
  );
});

test("H1 is the LCP text: fully opaque from the first frame, only rising (D-10)", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "commit" });
  const lines = page.locator("#hero-h .line");
  await expect(lines.first()).toBeAttached();
  for (const opacity of await lines.evaluateAll((all) =>
    all.map((line) => getComputedStyle(line).opacity),
  )) {
    expect(opacity).toBe("1");
  }
  await expect(hero(page).locator("img[fetchpriority=high]")).toHaveCount(0);
});

test("mailto: subject and body per kind and page language (F5)", async ({ page }) => {
  await page.goto("/");
  const mail = "mailto:hello@rifaldiradya.com?subject=";
  await expect(hero(page).getByRole("link", { name: "Email me" })).toHaveAttribute(
    "href",
    `${mail}Hello%20Rifaldi`,
  );
  const role = contact(page).getByRole("link", { name: "Email about a full-time role" });
  await expect(role).toHaveAttribute("href", /subject=Full-time%20role%3A%20&body=Company%3A/);
  await expect(role).toHaveAttribute("data-kind", "role");
  await expect(contact(page).getByRole("link", { name: "Email about a project" })).toHaveAttribute(
    "href",
    /subject=Project%3A%20&body=The%20HR%20process%20you%20want%20to%20automate%3A/,
  );

  // D-44: the project email is the primary Contact action, the role email second.
  await expect(contact(page).locator(".acts a")).toHaveText([
    "Email about a project",
    "Email about a full-time role",
  ]);

  await page.goto("/id");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Otomasi pekerjaan HR yang manual.",
  );
  await expect(
    contact(page).getByRole("link", { name: "Email soal posisi full-time" }),
  ).toHaveAttribute("href", /subject=Posisi%20full-time%3A%20&body=Perusahaan%3A/);
});

test("Contact: email + Copy email, LinkedIn, GitHub, Download CV, clock (D-17, D-19)", async ({
  page,
}) => {
  await page.goto("/");
  await expect(contact(page).getByRole("link", { name: siteConfig.contactEmail })).toBeVisible();
  // Copy email lives only in Contact.
  await expect(page.getByRole("button", { name: "Copy email" })).toHaveCount(1);
  await expect(contact(page).getByRole("button", { name: "Copy email" })).toBeVisible();
  await expect(contact(page).getByRole("link", { name: "LinkedIn ↗" })).toHaveAttribute(
    "href",
    "https://www.linkedin.com/in/rifaldiradya",
  );
  // D-19: GitHub shows once it is set in siteConfig (v2.0.2).
  await expect(contact(page).getByRole("link", { name: "GitHub ↗" })).toHaveAttribute(
    "href",
    siteConfig.social.github,
  );
  await expect(contact(page).locator(".clock")).toHaveText(/^\d{2}:\d{2} GMT\+7$/);
});

test("Download CV in About and Contact (D-14)", async ({ page }) => {
  await page.goto("/");
  for (const location of ["about", "contact"]) {
    const link = page.locator(`#${location}`).getByRole("link", { name: "Download CV (PDF)" });
    await expect(link).toHaveAttribute("href", siteConfig.cvPath);
    await expect(link).toHaveAttribute("download", "");
    await expect(link).toHaveAttribute("data-track", "cv_download");
  }
});

test("the CV file is served (AC-6)", async ({ request }) => {
  const response = await request.get(siteConfig.cvPath);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/pdf");
});

test.describe("phone with the cookie banner (AC-1)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("role, H1 and Email me are visible without scrolling", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    const banner = page.getByRole("region", { name: "Cookie choice" });
    await expect(banner).toBeVisible();
    const cover = (await banner.boundingBox())!;

    for (const target of [
      hero(page).getByText("HR automation engineer · n8n + AI"),
      page.getByRole("heading", { level: 1 }),
      hero(page).getByRole("link", { name: "Email me" }),
    ]) {
      await expect(target).toBeInViewport({ ratio: 1 });
      const box = (await target.boundingBox())!;
      expect(box.y + box.height).toBeLessThanOrEqual(cover.y);
    }
  });
});

test.describe("reduced motion (AC-11, E-30)", () => {
  test.use({ reducedMotion: "reduce" });

  test("every chapter reads in full, in its end state, without snap", async ({ page }) => {
    await page.goto("/");
    expect(
      await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType),
    ).toBe("none");

    for (const id of ["top", "about", "highlight", "contact"]) {
      const inner = page.locator(`#${id} > .ch-inner`);
      await inner.scrollIntoViewIfNeeded();
      expect(await inner.evaluate((element) => getComputedStyle(element).opacity)).toBe("1");
    }

    // About: the statement in plain ink.
    expect(
      await page.locator("#about .fill").evaluate((element) => getComputedStyle(element).color),
    ).not.toBe("rgba(0, 0, 0, 0)");

    // Highlight: "five passwords" struck, numbers final; screen readers get the values as text.
    const line = await page
      .locator("#highlight s")
      .evaluate((element) => getComputedStyle(element, "::after").transform);
    expect(line).toBe("none");
    expect(
      await page
        .locator("#highlight .num")
        .evaluateAll((all) => all.map((n) => getComputedStyle(n).getPropertyValue("--n").trim())),
    ).toEqual(["1", "200", "13"]);
    await expect(page.locator("#highlight .stats .sr-only")).toHaveText(["5 → 1", "~200", "13"]);
  });
});

test.describe("without JS (E-07)", () => {
  test.use({ javaScriptEnabled: false });

  test("clock stays a static GMT+7 and there is no dead Copy button", async ({ page }) => {
    await page.goto("/");
    await expect(contact(page).locator(".clock")).toHaveText("GMT+7");
    await expect(page.getByRole("button", { name: "Copy email" })).toHaveCount(0);
    await expect(contact(page).getByRole("link", { name: "Email about a project" })).toBeVisible();
  });

  test("contact links stay separate words in the raw text (search snippet)", async ({ page }) => {
    await page.goto("/");
    const text = await contact(page).locator(".reach").textContent();
    expect(text).toContain(`${siteConfig.contactEmail} LinkedIn`);
  });
});
