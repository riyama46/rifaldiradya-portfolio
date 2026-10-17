import { createConnection } from "mysql2/promise";
import { expect, type Page } from "@playwright/test";
import { makePng, signIn } from "./helpers";

// Shared by the specs that need real projects on the public pages (selected-work, work). Projects
// already switched on in the local database (global-setup refuses a remote one) are switched off
// directly in SQL, because v1 rows without v2 fields cannot be saved through the API until they are
// edited (E-27). They are switched back on before the last API call, which revalidates the pages.

export type Created = { id: string; slug: string; title: string };

async function sql<T>(run: (db: Awaited<ReturnType<typeof createConnection>>) => Promise<T>) {
  const db = await createConnection({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT ?? 3306),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });
  try {
    return await run(db);
  } finally {
    await db.end();
  }
}

const switchOffHome = () =>
  sql(async (db) => {
    const [rows] = await db.query("SELECT id FROM projects WHERE show_on_home = 1");
    const ids = (rows as { id: string }[]).map((row) => row.id);
    if (ids.length) await db.query("UPDATE projects SET show_on_home = 0 WHERE id IN (?)", [ids]);
    return ids;
  });

const switchOnHome = (ids: string[]) =>
  ids.length
    ? sql((db) => db.query("UPDATE projects SET show_on_home = 1 WHERE id IN (?)", [ids]))
    : Promise.resolve();

export const published = (title: string, extra: Record<string, unknown> = {}) => ({
  title_en: title,
  title_id: `${title} ID`,
  meta_en: "E2E client",
  meta_id: "Klien E2E",
  side_en: "2026",
  side_id: "2026",
  summary_en: `Summary of ${title}.`,
  summary_id: `Ringkasan ${title}.`,
  case_is_en: "A test project.",
  case_is_id: "Proyek uji.",
  case_did_en: ["Built it."],
  case_did_id: ["Membangunnya."],
  status_en: "Live",
  status_id: "Live",
  case_action: "none",
  visual_type: "number",
  card_number: "13",
  card_caption_en: "companies",
  card_caption_id: "perusahaan",
  show_on_home: true,
  published: true,
  ...extra,
});

export async function uploadScreenshot(page: Page) {
  await page.goto("/admin/projects/new");
  const upload = page.waitForResponse(
    (response) => response.url().endsWith("/api/admin/uploads") && response.status() === 201,
  );
  await page.locator('input[type="file"]').setInputFiles({
    name: "shot.png",
    mimeType: "image/png",
    buffer: await makePng(page, 1600, 1000, "Selected work"),
  });
  return (await upload).json();
}

export type Payloads = Record<string, unknown>[];

/**
 * Signs in, empties Selected work, creates the payloads (first = top of the list; a function runs
 * after sign-in, e.g. to upload a screenshot), then runs `check`.
 */
export async function withSelectedWork(
  page: Page,
  payloads: Payloads | ((page: Page) => Promise<Payloads>),
  check: (created: Created[]) => Promise<void>,
) {
  await signIn(page);
  const list = typeof payloads === "function" ? await payloads(page) : payloads;
  const origin = new URL(page.url()).origin;
  const restore = await switchOffHome();
  const created: Created[] = [];
  try {
    // New projects go to the top of the list, so create them last-first.
    for (const data of [...list].reverse()) {
      const response = await page.request.post("/api/admin/projects", {
        headers: { Origin: origin },
        data,
      });
      expect(response.status(), await response.text()).toBe(201);
      const { project } = await response.json();
      created.unshift({ id: project.id, slug: project.slug, title: project.title_en });
    }
    await check(created);
  } finally {
    await switchOnHome(restore);
    for (const { id } of created) {
      await page.request.delete(`/api/admin/projects/${id}`, { headers: { Origin: origin } });
    }
    if (!created.length) {
      // Nothing to delete means nothing revalidated: touch the pages with a throwaway draft.
      const response = await page.request.post("/api/admin/projects", {
        headers: { Origin: origin },
        data: { ...published("E2E revalidate"), show_on_home: false, published: false },
      });
      const { project } = await response.json();
      await page.request.delete(`/api/admin/projects/${project.id}`, {
        headers: { Origin: origin },
      });
    }
  }
}

/**
 * Admin saves revalidate the static pages on demand, but the first request after that can still get
 * the previous render while the new one is built: reload until the expected element is there.
 */
export async function gotoFresh(
  page: Page,
  url: string,
  ready: (page: Page) => ReturnType<Page["locator"]>,
) {
  await expect(async () => {
    await page.goto(url);
    await expect(ready(page)).toBeAttached({ timeout: 1_000 });
  }).toPass({ timeout: 30_000 });
}
