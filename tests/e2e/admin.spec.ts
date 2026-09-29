import { expect, test, type Page } from "@playwright/test";

// UF-06 (login/logout), UF-07 (add a project with a real image), UF-09 (delete it).
// Needs the local Docker DB and test credentials in .env.local:
//   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD = the local ADMIN_EMAIL and its password.

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

test.skip(!email || !password, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD in .env.local");

async function signIn(page: Page, next = "/admin") {
  await page.goto(next);
  await expect(page).toHaveURL(/\/admin\/login\?next=/);
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password", { exact: true }).fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(next);
}

/** A 2000 × 1400 PNG drawn in the browser, so the upload goes through the real compression. */
async function makePng(page: Page): Promise<Buffer> {
  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2000;
    canvas.height = 1400;
    const context = canvas.getContext("2d")!;
    const gradient = context.createLinearGradient(0, 0, 2000, 1400);
    gradient.addColorStop(0, "#b45309");
    gradient.addColorStop(1, "#1e3a8a");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 2000, 1400);
    context.fillStyle = "#fff";
    context.font = "bold 120px sans-serif";
    context.fillText("E2E upload", 100, 200);
    return canvas.toDataURL("image/png");
  });
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

test("UF-06: sign in, reach the admin, sign out", async ({ page }, testInfo) => {
  await page.goto("/admin");
  await expect(page).toHaveURL("/admin/login?next=%2Fadmin");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

  // One wrong attempt per run (desktop only) keeps well under the 5-per-15-minutes limit.
  if (testInfo.project.name === "desktop") {
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password", { exact: true }).fill(`${password}-wrong`);
    await page.getByRole("button", { name: "Sign in" }).click();
    // The form's own alert (Next.js also renders an empty route announcer with role="alert").
    await expect(page.locator("form").getByRole("alert")).toHaveText(
      "Email or password is incorrect.",
    );
    await expect(page.getByLabel("Password", { exact: true })).toHaveValue("");
    await expect(page.getByLabel("Password", { exact: true })).toBeFocused();
  }

  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password", { exact: true }).fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/admin");
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL("/admin/login");
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login\?next=/);
});

test("UF-07 + UF-09: add a published project with an image, see it on /work, delete it", async ({
  page,
}, testInfo) => {
  const title = `E2E ${testInfo.project.name} ${Date.now()}`;
  await signIn(page);

  // UF-07
  await page.getByRole("link", { name: "New project" }).first().click();
  await expect(page.getByRole("heading", { name: "New project" })).toBeVisible();
  await page.getByLabel("Title (EN)").fill(title);
  await page.getByLabel("Title (ID)").fill(`${title} ID`);
  await page.getByLabel("Summary (EN)").fill("Created by the end-to-end test.");
  await page.getByLabel("Summary (ID)").fill("Dibuat oleh tes end-to-end.");
  await page.getByLabel("Live URL").fill("https://example.com/e2e");
  await page.getByLabel("Tags").fill("Next.js");
  await page.getByLabel("Tags").press("Enter");

  await page.locator('input[type="file"]').setInputFiles({
    name: "screenshot.png",
    mimeType: "image/png",
    buffer: await makePng(page),
  });
  await expect(page.getByRole("img", { name: "Thumbnail preview" })).toBeVisible();

  await page.getByLabel("Thumbnail alt (EN)").fill("Gradient test image");
  await page.getByLabel("Thumbnail alt (ID)").fill("Gambar uji gradasi");
  await page.getByLabel("Sort order").fill("999");
  await page.getByRole("switch", { name: "Published" }).click();
  await expect(page.getByRole("switch", { name: "Published" })).toHaveAttribute(
    "aria-checked",
    "true",
  );

  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/admin(\?|$)/);
  await expect(page.getByRole("status")).toHaveText("Project created");
  await expect(page.getByRole("link", { name: title, exact: true }).first()).toBeVisible();

  // On the public Work page after on-demand revalidation (first visit after the save).
  await page.goto("/work");
  const heading = page.getByRole("heading", { name: title, exact: true });
  await expect(heading).toBeVisible();
  // The card image sits in an aria-hidden duplicate link, so find it inside the card, not by role.
  const image = page.locator("article", { has: heading }).locator("img");
  await expect(image).toHaveAttribute("srcset", /\/media\/[0-9A-Z]{26}-640\.(webp|jpg)/);
  await expect(image).toHaveAttribute("alt", "Gradient test image");

  // UF-09
  await page.goto("/admin");
  await page
    .getByRole("link", { name: `Edit ${title}` })
    .first()
    .click();
  await page.getByRole("button", { name: "Delete project" }).click();
  const dialog = page.getByRole("dialog", { name: `Delete ${title}?` });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  await dialog.getByRole("button", { name: "Delete", exact: true }).click();

  await expect(page).toHaveURL(/\/admin(\?|$)/);
  await expect(page.getByRole("status")).toHaveText("Project deleted");
  await expect(page.getByRole("link", { name: title, exact: true })).toHaveCount(0);

  await page.goto("/work");
  await expect(page.getByRole("heading", { name: title, exact: true })).toHaveCount(0);
});
