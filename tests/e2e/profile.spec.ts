import { expect, test, type Page } from "@playwright/test";
import { hasCredentials, makePng, missingCredentials, signIn } from "./helpers";

// S-14 → hero byline, on a production build: saving the photo must update the static homepage
// (on-demand revalidation), and removing it must bring the initials back.
test.skip(!hasCredentials, missingCredentials);

const heroPhoto = (page: Page) => page.locator("#top img[srcset*='/media/']");
const initials = (page: Page) => page.locator("#top").getByText("RR", { exact: true });

test("profile photo: upload → hero shows it; remove → initials again", async ({ page }) => {
  await signIn(page, "/admin/profile");
  const save = page.getByRole("button", { name: "Save" });

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
    /-160\.(webp|jpg) 160w, .*-320\.(webp|jpg) 320w/,
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
