import { expect, test, type Page } from "@playwright/test";
import { hasCredentials, makePng, missingCredentials, signIn } from "./helpers";

// S-14 (v2: photo of at least 640 px stored at 320/640, availability switch) → hero byline, on a
// production build: saving the photo must update the static homepage (on-demand revalidation),
// and removing it must bring the initials back.
test.skip(!hasCredentials, missingCredentials);

const heroPhoto = (page: Page) => page.locator("#top img[srcset*='/media/']");
const initials = (page: Page) => page.locator("#top").getByText("RR", { exact: true });

test("profile photo: upload → hero shows it; remove → initials again", async ({ page }) => {
  await signIn(page, "/admin/profile");
  const save = page.getByRole("button", { name: "Save profile" });

  // Start from "no photo" whatever an earlier run left behind.
  if (await page.getByRole("button", { name: "Remove" }).isVisible()) {
    await page.getByRole("button", { name: "Remove" }).click();
    await save.click();
    await expect(page.getByRole("status")).toHaveText("Profile saved");
  }

  await page.locator('input[type="file"]').setInputFiles({
    name: "portrait.png",
    mimeType: "image/png",
    buffer: await makePng(page, 900, 1200, "Portrait"),
  });
  await expect(page.getByRole("img", { name: "Thumbnail preview" })).toBeVisible();
  await save.click();
  await expect(page.getByRole("status")).toHaveText("Profile saved");

  await page.goto("/");
  await expect(heroPhoto(page)).toBeVisible();
  await expect(heroPhoto(page)).toHaveAttribute(
    "srcset",
    /-320\.(webp|jpg) 320w, .*-640\.(webp|jpg) 640w/,
  );
  await expect(initials(page)).toHaveCount(0);
  await page.goto("/id");
  await expect(heroPhoto(page)).toBeVisible();

  await page.goto("/admin/profile");
  await page.getByRole("button", { name: "Remove" }).click();
  await save.click();
  await expect(page.getByRole("status")).toHaveText("Profile saved");

  await page.goto("/");
  await expect(initials(page)).toBeVisible();
  await expect(heroPhoto(page)).toHaveCount(0);
});

test("availability switch: saved with API-09 and still set after a reload (AC-9 admin side)", async ({
  page,
}) => {
  await signIn(page, "/admin/profile");
  const toggle = page.getByRole("switch", { name: "Show availability" });
  const save = page.getByRole("button", { name: "Save profile" });
  const before = (await toggle.getAttribute("aria-checked")) === "true";

  await expect(save).toBeDisabled();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", String(!before));
  await save.click();
  await expect(page.getByRole("status")).toHaveText("Profile saved");

  await page.reload();
  await expect(toggle).toHaveAttribute("aria-checked", String(!before));

  // Public side (AC-9): the hero line follows the switch on both locales, the meta does not.
  for (const path of ["/", "/id"]) {
    await page.goto(path);
    const description = await page.locator("meta[name=description]").getAttribute("content");
    expect(description).not.toMatch(/open to|terbuka untuk/i);
    await expect(page.locator("#top .who-status")).toHaveCount(before ? 0 : 1);
  }
  await page.goto("/admin/profile");

  // Put it back for the next run.
  await toggle.click();
  await save.click();
  await expect(page.getByRole("status")).toHaveText("Profile saved");
  await page.reload();
  await expect(toggle).toHaveAttribute("aria-checked", String(before));
});
