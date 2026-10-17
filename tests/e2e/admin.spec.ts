import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { email, hasCredentials, missingCredentials, password, signIn } from "./helpers";

// UF-06 (login/logout), UF-07/UF-08 v2 (S-12/S-13 per section), UF-09 (delete), AC-7 (E-26) and
// AC-8 (site without a live URL). Needs the local Docker DB and the test credentials in ./helpers.ts.

test.skip(!hasCredentials, missingCredentials);

const noHorizontalScroll = async (page: Page) =>
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );

/** A valid draft for API-03, so the limit tests can fill Selected work without the form. */
const helperProject = (title: string) => ({
  title_en: title,
  title_id: title,
  summary_en: "Helper project for the Selected work limit test.",
  summary_id: "Proyek bantu untuk tes batas Selected work.",
  case_action: "none",
  show_on_home: true,
  published: false,
});

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

test("UF-07 + UF-08 + UF-09 v2: walkthrough case with a number card, edit, delete", async ({
  page,
}, testInfo) => {
  const title = `E2E ${testInfo.project.name} ${Date.now()}`;
  await signIn(page);

  // UF-07: every S-12 section.
  await page.getByRole("link", { name: "New project" }).first().click();
  await expect(page.getByRole("heading", { name: "New project" })).toBeVisible();
  await noHorizontalScroll(page);

  await page.getByLabel("Title (EN)").fill(title);
  await page.getByLabel("Title (ID)").fill(`${title} ID`);
  await page.getByRole("button", { name: "Panasonic" }).click();
  await expect(page.getByRole("button", { name: "Panasonic" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByLabel("Meta line (EN)").fill("Panasonic · E2E");
  await page.getByLabel("Meta line (ID)").fill("Panasonic · E2E");
  await page.getByLabel("Side (EN)").fill("2026");
  await page.getByLabel("Short description (EN)").fill("Created by the end-to-end test.");
  await page.getByLabel("Short description (ID)").fill("Dibuat oleh tes end-to-end.");

  await page.getByLabel("What it is (EN)").fill("An internal tool used by the test.");
  await page.getByLabel("What it is (ID)").fill("Alat internal yang dipakai tes.");
  await page.getByRole("textbox", { name: "Line 1 (EN)" }).fill("Wrote the first line.");
  await page.getByRole("button", { name: "Add a line (EN)" }).click();
  await expect(page.getByRole("textbox", { name: "Line 2 (EN)" })).toBeFocused();
  await page.getByRole("textbox", { name: "Line 2 (EN)" }).fill("Then a second one.");
  await page.getByRole("button", { name: "Add a line (EN)" }).click();
  await page.getByRole("button", { name: "Remove line 3 (EN)" }).click();
  await expect(page.getByRole("textbox", { name: "Line 3 (EN)" })).toHaveCount(0);
  await page.getByRole("textbox", { name: "Line 1 (ID)" }).fill("Menulis baris pertama.");
  await page.getByLabel("Stack").fill("C#, SQL Server");
  await page.getByLabel("Stack").press("Enter");
  await page.getByRole("button", { name: "Remove SQL Server" }).click();
  await expect(page.getByRole("button", { name: "Remove C#" })).toBeVisible();
  await page.getByLabel("Status (EN)").fill("Live, 2026");
  await page.getByLabel("Status (ID)").fill("Berjalan, 2026");

  await page.getByRole("radio", { name: /Email to ask for a walkthrough/ }).check();
  await page.getByRole("button", { name: "Number card" }).click();
  await page.getByLabel("Number", { exact: true }).fill("13");
  await page.getByLabel("Caption (EN)").fill("companies in the test");
  await page.getByLabel("Caption (ID)").fill("perusahaan di tes");
  await page.getByRole("switch", { name: "Published" }).click();

  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/admin(\?|$)/);
  await expect(page.getByRole("status")).toHaveText("Project created");
  await expect(page.getByRole("link", { name: title, exact: true }).first()).toBeVisible();
  await noHorizontalScroll(page);

  // S-11: the group filter hides other groups, never reorders.
  await page.getByRole("button", { name: /^Websites/ }).click();
  await expect(page.getByRole("link", { name: title, exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: /^Panasonic/ }).click();
  await expect(page.getByRole("button", { name: /^Panasonic/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("link", { name: title, exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: /^All/ }).click();

  // A new project is placed first; ↓ moves it to #2 and keyboard focus stays on the button.
  const up = page.getByRole("button", { name: `Move ${title} up` }).first();
  const down = page.getByRole("button", { name: `Move ${title} down` }).first();
  await expect(up).toBeDisabled();
  await down.click();
  await expect(up).toBeEnabled();
  await expect(down).toBeFocused();
  await up.click();
  await expect(up).toBeDisabled();

  // UF-08: the stored values come back per section; switch to "No button" and save.
  await page.getByRole("link", { name: title, exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Edit project" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Line 2 (EN)" })).toHaveValue(
    "Then a second one.",
  );
  await expect(page.getByRole("radio", { name: /Email to ask for a walkthrough/ })).toBeChecked();
  await expect(page.getByLabel("Number", { exact: true })).toHaveValue("13");
  await page.getByRole("radio", { name: /No button/ }).check();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toHaveText("Changes saved");

  // UF-09
  await page.getByRole("link", { name: title, exact: true }).first().click();
  await expect(page.getByRole("radio", { name: /No button/ })).toBeChecked();
  await page.getByRole("button", { name: "Delete project" }).click();
  const dialog = page.getByRole("dialog", { name: `Delete ${title}?` });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  await dialog.getByRole("button", { name: "Delete", exact: true }).click();

  await expect(page).toHaveURL(/\/admin(\?|$)/);
  await expect(page.getByRole("status")).toHaveText("Project deleted");
  await expect(page.getByRole("link", { name: title, exact: true })).toHaveCount(0);
});

test("AC-8: the case button opens the site, so a live URL is required", async ({ page }) => {
  await signIn(page, "/admin/projects/new");
  await page.getByLabel("Title (EN)").fill("AC-8");
  await page.getByLabel("Title (ID)").fill("AC-8");
  await page.getByLabel("Short description (EN)").fill("No live URL.");
  await page.getByLabel("Short description (ID)").fill("Tanpa URL live.");
  await expect(page.getByRole("radio", { name: /Open the live site/ })).toBeChecked();
  await page.getByRole("switch", { name: "Published" }).click();
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page).toHaveURL("/admin/projects/new");
  await expect(page.locator("#live_url-error")).toHaveText(
    "Add a live URL, or choose another button.",
  );

  // The server applies the same rule (API-03).
  const response = await page.request.post("/api/admin/projects", {
    headers: { Origin: new URL(page.url()).origin },
    data: { ...helperProject("AC-8 API"), case_action: "site", show_on_home: false },
  });
  expect(response.status()).toBe(422);
  expect((await response.json()).error.fields.live_url).toBe(
    "Add a live URL, or choose another button.",
  );
});

test("AC-7 (E-26): with 5 in Selected work the 6th switch is off and the API says 422", async ({
  page,
}, testInfo) => {
  await signIn(page);
  const origin = new URL(page.url()).origin;
  const info = await page.getByTestId("selected-work").textContent();
  const current = Number(/: (\d) of 5/.exec(info ?? "")?.[1] ?? NaN);
  expect(current).toBeLessThanOrEqual(5);

  const created: string[] = [];
  try {
    for (let i = current; i < 5; i++) {
      const response = await page.request.post("/api/admin/projects", {
        headers: { Origin: origin },
        data: helperProject(`E2E limit ${testInfo.project.name} ${i} ${Date.now()}`),
      });
      expect(response.status()).toBe(201);
      created.push((await response.json()).project.id);
    }

    await page.goto("/admin");
    await expect(page.getByTestId("selected-work")).toContainText(
      "Selected work on the homepage: 5 of 5. Turn one off before adding another.",
    );

    await page.goto("/admin/projects/new");
    const toggle = page.getByRole("switch", { name: "Show in Selected work" });
    await expect(toggle).toBeDisabled();
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await expect(
      page.getByText("Selected work already has 5 projects. Turn one off first."),
    ).toBeVisible();

    // One of the five can still be switched off.
    if (created[0]) {
      await page.goto(`/admin/projects/${created[0]}`);
      await expect(page.getByRole("switch", { name: "Show in Selected work" })).toBeEnabled();
    }

    const response = await page.request.post("/api/admin/projects", {
      headers: { Origin: origin },
      data: helperProject("E2E limit 6th"),
    });
    expect(response.status()).toBe(422);
    expect((await response.json()).error.fields.show_on_home).toBe(
      "Selected work already has 5 projects. Turn one off first.",
    );
  } finally {
    for (const id of created) {
      await page.request.delete(`/api/admin/projects/${id}`, { headers: { Origin: origin } });
    }
  }
});

test("S-11, S-12, S-13 and S-14 pass axe in both themes", async ({ page }) => {
  await signIn(page);
  const edit = await page
    .locator('a[href^="/admin/projects/"]:not([href$="/new"])')
    .first()
    .getAttribute("href");
  const paths = ["/admin", "/admin/projects/new", edit ?? "/admin", "/admin/profile"];

  for (const scheme of ["dark", "light"] as const) {
    for (const path of paths) {
      await page.goto(`${path}?theme=${scheme}`);
      await page.waitForLoadState("networkidle");
      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(
        violations.map(
          (v) => `${scheme} ${path}: ${v.id} (${v.nodes.map((n) => n.target).join(", ")})`,
        ),
      ).toEqual([]);
    }
  }
});
