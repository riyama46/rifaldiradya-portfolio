import { eq, inArray, like } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { getDb } from "@/lib/db/client";
import { images, projects, siteSettings } from "@/lib/db/schema";
import { mediaUrl } from "@/lib/images/rules";
import {
  deleteOrphanImages,
  getAvailability,
  getImage,
  getProfilePhoto,
  getSiteSettings,
  getVariant,
  saveImage,
  setAvailability,
  setProfilePhoto,
} from "@/lib/images/store";
import {
  createProject,
  deleteProject,
  moveProject,
  ShowOnHomeLimitError,
  toProjectInput,
  updateProject,
  withStoredThumbnail,
} from "@/lib/projects/mutations";
import { getAllProjects, getProjectById, getPublishedProjects } from "@/lib/projects/queries";
import { toPublicProject } from "@/lib/projects/public";
import { projectInputSchema, type ProjectInputRaw } from "@/lib/projects/validation";

// Every row made here carries this marker, so the run cleans up after itself and ignores rows
// that already exist in the (local) database.
const run = `IT${Date.now()}`;
const createdImages: string[] = [];

function input(title: string, overrides: Partial<ProjectInputRaw> = {}) {
  return projectInputSchema.parse({
    title_en: `${run} ${title}`,
    title_id: `${run} ${title} ID`,
    summary_en: "Integration test project.",
    summary_id: "Project uji integrasi.",
    live_url: "https://example.com",
    // v2 fields needed to publish (CHANGE v2.0.0, S-12).
    meta_en: "Test · Meta",
    meta_id: "Uji · Meta",
    case_is_en: "A test project.",
    case_is_id: "Proyek uji.",
    case_did_en: ["Tested it."],
    case_did_id: ["Mengujinya."],
    status_en: "Live",
    status_id: "Live",
    ...overrides,
  });
}

const variant = (width: number) => ({
  width,
  height: Math.round((width * 10) / 16),
  bytes: new Uint8Array([width % 256, 1, 2, 3]),
});

async function newImage() {
  const image = await saveImage("webp", [variant(640), variant(960), variant(1280), variant(1600)]);
  createdImages.push(image.id);
  return image;
}

const ours = <T extends { titleEn: string }>(list: T[]) =>
  list.filter((p) => p.titleEn.startsWith(run));
const pause = () => new Promise((resolve) => setTimeout(resolve, 10));

const names = async () =>
  ours(await getAllProjects()).map((p) => [p.titleEn.slice(run.length + 1), p.sortOrder] as const);

/** Positions of the whole table must always be exactly 1…n. */
async function expectCompactPositions() {
  const all = await getAllProjects();
  expect(all.map((p) => p.sortOrder)).toEqual(all.map((_, i) => i + 1));
}

let profilePhotoBefore: string | null = null;
let availabilityBefore: boolean | null = null;

afterAll(async () => {
  // deleteProject closes position gaps, so the local sample data keeps positions 1…n.
  const left = await getDb()
    .select()
    .from(projects)
    .where(like(projects.titleEn, `${run}%`));
  for (const project of left) await deleteProject((await getProjectById(project.id))!);
  await setProfilePhoto(profilePhotoBefore);
  if (availabilityBefore !== null) await setAvailability(availabilityBefore);
  for (const id of createdImages) await getDb().delete(images).where(eq(images.id, id));
});

describe("positions (T-18b: 1…n, new first, ↑/↓)", () => {
  it("puts every new project first and keeps positions unique", async () => {
    await createProject(input("A"));
    await createProject(input("B"));
    await createProject(input("C"));
    expect(await names()).toEqual([
      ["C", 1],
      ["B", 2],
      ["A", 3],
    ]);
    await expectCompactPositions();
  });

  it("↑/↓ swaps neighbours and does nothing past the top", async () => {
    const [, b] = ours(await getAllProjects());
    expect(await moveProject(b.id, "up")).toBe(1);
    expect((await names()).map(([name]) => name)).toEqual(["B", "C", "A"]);
    expect(await moveProject(b.id, "up")).toBe(1); // already first
    expect(await moveProject(b.id, "down")).toBe(2);
    expect((await names()).map(([name]) => name)).toEqual(["C", "B", "A"]);
    expect(await moveProject("01ZZZZZZZZZZZZZZZZZZZZZZZZ", "up")).toBeNull();
    await expectCompactPositions();
  });

  it("closes the gap when a project is deleted", async () => {
    const [, b] = ours(await getAllProjects());
    await deleteProject(b);
    expect(await names()).toEqual([
      ["C", 1],
      ["A", 2],
    ]);
    await expectCompactPositions();
  });

  it("shifting positions does not count as editing the other projects (updated_at kept)", async () => {
    const stamps = async () =>
      Object.fromEntries((await getAllProjects()).map((p) => [p.id, p.updatedAt.getTime()]));
    const before = await stamps();
    await pause();
    const extra = await createProject(input("shift probe"));
    await moveProject(extra.id, "down");
    await deleteProject((await getProjectById(extra.id))!);
    const after = await stamps();
    for (const [id, time] of Object.entries(before)) expect(after[id]).toBe(time);
  });

  it("heals duplicate positions on the next move", async () => {
    const [c, a] = ours(await getAllProjects());
    await getDb().update(projects).set({ sortOrder: 1 }).where(eq(projects.id, a.id)); // corrupt
    await moveProject(c.id, "down");
    await expectCompactPositions();
  });

  it("the public query follows positions and leaves drafts out", async () => {
    const image = await newImage();
    const [first] = ours(await getAllProjects());
    const stored = await withStoredThumbnail(
      projectInputSchema.parse({
        ...toProjectInput(first),
        published: true,
        thumbnail: { public_id: image.id, url: "/x", width: 1, height: 1 },
        thumbnail_alt_en: "a",
        thumbnail_alt_id: "a",
      }),
    );
    await updateProject(first, stored!);
    const published = ours(await getPublishedProjects());
    expect(published.map((p) => p.id)).toEqual([first.id]);
  });

  it("#1 published, #2 draft, #3 published: the site skips #2, which reappears in place once published", async () => {
    const image = await newImage();
    const publish = async (id: string, published: boolean) => {
      const project = (await getProjectById(id))!;
      const stored = await withStoredThumbnail(
        projectInputSchema.parse({
          ...toProjectInput(project),
          published,
          thumbnail: { public_id: image.id, url: "/x", width: 1, height: 1 },
          thumbnail_alt_en: "a",
          thumbnail_alt_id: "a",
        }),
      );
      await updateProject(project, stored!);
    };

    const third = await createProject(input("gap 3"));
    const second = await createProject(input("gap 2"));
    const first = await createProject(input("gap 1"));
    await publish(first.id, true);
    await publish(second.id, false);
    await publish(third.id, true);

    const positions = Object.fromEntries(
      ours(await getAllProjects()).map((p) => [p.titleEn.slice(run.length + 1), p.sortOrder]),
    );
    expect([positions["gap 1"], positions["gap 2"], positions["gap 3"]]).toEqual([1, 2, 3]);

    const publicTitles = async () =>
      ours(await getPublishedProjects())
        .map((p) => p.titleEn.slice(run.length + 1))
        .filter((title) => title.startsWith("gap"));
    expect(await publicTitles()).toEqual(["gap 1", "gap 3"]);

    await publish(second.id, true);
    expect(await publicTitles()).toEqual(["gap 1", "gap 2", "gap 3"]);
    await expectCompactPositions();
  });
});

describe("create / update / delete", () => {
  it("creates slugs from the English title and adds -2 on a collision", async () => {
    const first = await createProject(input("Same Title"));
    const second = await createProject(input("Same Title"));
    expect(second.slug).toBe(`${first.slug}-2`);
    expect(first.slug).toMatch(/^it\d+-same-title$/);
  });

  it("keeps the slug when the title changes and bumps updated_at", async () => {
    const project = await createProject(input("Rename me"));
    await pause();
    const updated = await updateProject(
      project,
      projectInputSchema.parse({ ...toProjectInput(project), title_en: `${run} Renamed` }),
    );
    expect(updated?.titleEn).toBe(`${run} Renamed`);
    expect(updated?.slug).toBe(project.slug);
    expect(updated!.updatedAt.getTime()).toBeGreaterThan(project.updatedAt.getTime());
  });

  it("takes the thumbnail url and size from the images table, never from the input", async () => {
    const image = await newImage();
    const stored = await withStoredThumbnail(
      input("thumb", {
        thumbnail: {
          public_id: image.id,
          url: "https://evil.example.com/x.jpg",
          width: 1,
          height: 1,
        },
        thumbnail_alt_en: "a",
        thumbnail_alt_id: "a",
      }),
    );
    expect(stored?.thumbnail).toEqual({
      public_id: image.id,
      url: mediaUrl(image.id, "webp"),
      width: 1600,
      height: 1000,
    });

    const missing = await withStoredThumbnail(
      input("gone", {
        thumbnail: { public_id: "01ZZZZZZZZZZZZZZZZZZZZZZZZ", url: "/x", width: 1, height: 1 },
        thumbnail_alt_en: "a",
        thumbnail_alt_id: "a",
      }),
    );
    expect(missing).toBeNull();
  });

  it("deletes the old image after a replacement, and the image with the project", async () => {
    const first = await newImage();
    const second = await newImage();
    const withImage = (id: string, base: ProjectInputRaw) =>
      withStoredThumbnail(
        projectInputSchema.parse({
          ...base,
          thumbnail: { public_id: id, url: "/x", width: 1, height: 1 },
          thumbnail_alt_en: "a",
          thumbnail_alt_id: "a",
        }),
      );

    const project = await createProject((await withImage(first.id, input("images")))!);
    const replaced = await updateProject(
      project,
      (await withImage(second.id, toProjectInput(project)))!,
    );
    expect(replaced?.thumbnailPublicId).toBe(second.id);
    expect(await getImage(first.id)).toBeNull();

    expect(await deleteProject(replaced!)).toBe(true);
    expect(await getProjectById(project.id)).toBeNull();
    expect(await getImage(second.id)).toBeNull();
    expect(await deleteProject(replaced!)).toBe(false); // second delete: already gone (E-14)
  });
});

describe("image storage", () => {
  it("serves the smallest stored width that is wide enough", async () => {
    const image = await newImage();
    expect((await getVariant(image.id, 700))?.width).toBe(960);
    expect((await getVariant(image.id, null))?.width).toBe(1600);
    expect(await getVariant("01ZZZZZZZZZZZZZZZZZZZZZZZZ", 640)).toBeNull();
  });

  it("removes uploads that no project uses after 24 hours, and keeps used or recent ones", async () => {
    const orphan = await newImage();
    const recent = await newImage();
    const used = await newImage();
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    await getDb().update(images).set({ createdAt: twoDaysAgo }).where(eq(images.id, orphan.id));
    await getDb().update(images).set({ createdAt: twoDaysAgo }).where(eq(images.id, used.id));
    await createProject(
      (await withStoredThumbnail(
        input("uses image", {
          thumbnail: { public_id: used.id, url: "/x", width: 1, height: 1 },
          thumbnail_alt_en: "a",
          thumbnail_alt_id: "a",
        }),
      ))!,
    );

    await deleteOrphanImages();
    expect(await getImage(orphan.id)).toBeNull();
    expect(await getImage(recent.id)).not.toBeNull();
    expect(await getImage(used.id)).not.toBeNull();
  });
});

describe("profile photo (S-14)", () => {
  it("sets, replaces (deleting the old photo), clears, and survives the orphan cleanup", async () => {
    profilePhotoBefore = (await getProfilePhoto())?.id ?? null;
    const square = (width: number) => ({ width, height: width, bytes: new Uint8Array([1, 2, 3]) });
    const first = await saveImage("webp", [square(160), square(320)]);
    const second = await saveImage("webp", [square(160), square(320)]);
    createdImages.push(first.id, second.id);
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    await setProfilePhoto(first.id);
    expect((await getProfilePhoto())?.id).toBe(first.id);
    await getDb().update(images).set({ createdAt: twoDaysAgo }).where(eq(images.id, first.id));
    await deleteOrphanImages();
    expect(await getImage(first.id)).not.toBeNull(); // in use as the profile photo

    await setProfilePhoto(second.id);
    expect(await getImage(first.id)).toBeNull();

    await setProfilePhoto(null);
    expect(await getProfilePhoto()).toBeNull();
    expect(await getImage(second.id)).toBeNull();
  });
});

describe("v2 project fields (CHANGE v2.0.0, Delta APP_FLOW section 9)", () => {
  it("stores and reads back every v2 field, including an internal project without a URL", async () => {
    const created = await createProject(
      input("internal", {
        group: "panasonic",
        side_en: "2022–now",
        side_id: "2022–kini",
        case_did_en: ["Built the API.", "", "Ran the rollout."],
        tags: ["C#", "ASP.NET", "SQL Server", "Azure", "Power Automate", "Next.js"],
        case_action: "walkthrough",
        live_url: null,
        visual_type: "number",
        card_number: "5 → 1",
        card_caption_en: "passwords to one login",
        card_caption_id: "password jadi satu login",
        published: true,
      }),
    );
    const stored = (await getProjectById(created.id))!;
    expect(stored).toMatchObject({
      group: "panasonic",
      sideEn: "2022–now",
      sideId: "2022–kini",
      caseDidEn: ["Built the API.", "Ran the rollout."],
      caseDidId: ["Mengujinya."],
      caseAction: "walkthrough",
      liveUrl: null,
      visualType: "number",
      cardNumber: "5 → 1",
      cardCaptionId: "password jadi satu login",
      showOnHome: false,
      featured: false,
      published: true,
    });
    expect(stored.tags).toHaveLength(6);
    expect(toProjectInput(stored)).not.toHaveProperty("featured");
    expect(toPublicProject(stored, "en").visual).toEqual({
      type: "number",
      number: "5 → 1",
      caption: "passwords to one login",
    });
  });

  it("never writes the deprecated featured column (D-22)", async () => {
    const created = await createProject(input("featured probe"));
    await getDb().update(projects).set({ featured: true }).where(eq(projects.id, created.id));
    const updated = await updateProject(
      (await getProjectById(created.id))!,
      projectInputSchema.parse({
        ...toProjectInput(created),
        featured: false,
        title_en: `${run} f`,
      }),
    );
    expect(updated?.featured).toBe(true);
  });

  it("E-27: a published v1 row stays public until edited, then needs the v2 fields", async () => {
    const image = await newImage();
    const id = `${run.slice(-10)}V1ROW`.padEnd(26, "0").slice(0, 26);
    await getDb()
      .insert(projects)
      .values({
        id,
        slug: `${run.toLowerCase()}-v1-row`,
        titleEn: `${run} v1 row`,
        titleId: `${run} v1 row ID`,
        summaryEn: "From v1.",
        summaryId: "Dari v1.",
        liveUrl: "https://example.com",
        thumbnailPublicId: image.id,
        thumbnailUrl: mediaUrl(image.id, image.format),
        thumbnailWidth: image.width,
        thumbnailHeight: image.height,
        thumbnailAltEn: "a",
        thumbnailAltId: "a",
        sortOrder: 9999,
        published: true,
      });
    const row = ours(await getPublishedProjects()).find((p) => p.id === id)!;
    expect(toPublicProject(row, "en")).toMatchObject({ caseIs: null, caseDid: [], meta: null });

    const edit = projectInputSchema.safeParse({
      ...toProjectInput(row),
      title_en: `${run} edited`,
    });
    expect(edit.success).toBe(false);
    await deleteProject(row);
  });
});

describe("Selected work limit (E-26, AC-7)", () => {
  it("allows 5 projects on, drafts included, and refuses a 6th on create and update", async () => {
    // Other rows in the local database are switched off for the test and restored afterwards.
    const others = (await getAllProjects()).filter(
      (p) => p.showOnHome && !p.titleEn.startsWith(run),
    );
    const otherIds = others.map((p) => p.id);
    if (otherIds.length > 0) {
      await getDb()
        .update(projects)
        .set({ showOnHome: false })
        .where(inArray(projects.id, otherIds));
    }
    try {
      await getDb()
        .update(projects)
        .set({ showOnHome: false })
        .where(like(projects.titleEn, `${run}%`));

      const on = [];
      for (const n of [1, 2, 3, 4, 5]) {
        on.push(await createProject(input(`home ${n}`, { show_on_home: true })));
      }
      await expect(createProject(input("home 6", { show_on_home: true }))).rejects.toBeInstanceOf(
        ShowOnHomeLimitError,
      );

      const off = await createProject(input("home off"));
      await expect(
        updateProject(
          off,
          projectInputSchema.parse({ ...toProjectInput(off), show_on_home: true }),
        ),
      ).rejects.toBeInstanceOf(ShowOnHomeLimitError);
      expect((await getProjectById(off.id))!.showOnHome).toBe(false);

      // A project that is already on can be saved again.
      const saved = await updateProject(
        on[0],
        projectInputSchema.parse({ ...toProjectInput(on[0]), title_en: `${run} home 1b` }),
      );
      expect(saved?.showOnHome).toBe(true);

      // Turning one off frees the place.
      await updateProject(
        on[1],
        projectInputSchema.parse({ ...toProjectInput(on[1]), show_on_home: false }),
      );
      const now = await updateProject(
        off,
        projectInputSchema.parse({ ...toProjectInput(off), show_on_home: true }),
      );
      expect(now?.showOnHome).toBe(true);

      for (const project of ours(await getAllProjects())) {
        if (project.showOnHome) {
          await getDb()
            .update(projects)
            .set({ showOnHome: false })
            .where(eq(projects.id, project.id));
        }
      }
    } finally {
      if (otherIds.length > 0) {
        await getDb()
          .update(projects)
          .set({ showOnHome: true })
          .where(inArray(projects.id, otherIds));
      }
    }
  });
});

describe("availability (S-14, D-16, API-09)", () => {
  it("is on by default, and can be switched off and on", async () => {
    availabilityBefore = await getAvailability();
    await getDb().delete(siteSettings).where(eq(siteSettings.key, "availability_on"));
    expect(await getAvailability()).toBe(true);
    expect((await getSiteSettings()).availabilityOn).toBe(true);

    await setAvailability(false);
    expect(await getAvailability()).toBe(false);
    expect((await getSiteSettings()).availabilityOn).toBe(false);

    await setAvailability(true);
    expect((await getSiteSettings()).availabilityOn).toBe(true);
  });
});
