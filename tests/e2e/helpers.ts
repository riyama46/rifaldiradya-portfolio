import { expect, type Page } from "@playwright/test";

// Shared by the admin e2e specs. Needs E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD in .env.local
// (the local ADMIN_EMAIL and its password, never the production one).
export const email = process.env.E2E_ADMIN_EMAIL;
export const password = process.env.E2E_ADMIN_PASSWORD;
export const hasCredentials = Boolean(email && password);
export const missingCredentials = "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD in .env.local";

export async function signIn(page: Page, next = "/admin") {
  await page.goto(next);
  await expect(page).toHaveURL(/\/admin\/login\?next=/);
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password", { exact: true }).fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(next);
}

/** A PNG drawn in the browser, so uploads go through the real compression. */
export async function makePng(page: Page, width = 2000, height = 1400, label = "E2E upload") {
  const dataUrl = await page.evaluate(
    ({ width, height, label }) => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d")!;
      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#b45309");
      gradient.addColorStop(1, "#1e3a8a");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
      context.fillStyle = "#fff";
      context.font = `bold ${Math.round(width / 16)}px sans-serif`;
      context.fillText(label, width / 20, height / 7);
      return canvas.toDataURL("image/png");
    },
    { width, height, label },
  );
  return Buffer.from(dataUrl.split(",")[1], "base64");
}
