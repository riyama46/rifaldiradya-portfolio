import { eq, like } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { getDb } from "@/lib/db/client";
import { images, projects } from "@/lib/db/schema";
import { mediaUrl } from "@/lib/images/rules";
import {
  deleteOrphanImages,
  getImage,
  getProfilePhoto,
  getVariant,
  saveImage,
  setProfilePhoto,
} from "@/lib/images/store";
import {
  createProject,
  deleteProject,
  moveProject,
  toProjectInput,
  updateProject,
  withStoredThumbnail,
} from "@/lib/projects/mutations";
import { getAllProjects, getProjectById, getPublishedProjects } from "@/lib/projects/queries";
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

afterAll(async () => {
  // deleteProject closes position gaps, so the local sample data keeps positions 1…n.
  const left = await getDb()
    .select()
    .from(projects)
    .where(like(projects.titleEn, `${run}%`));
  for (const project of left) await deleteProject((await getProjectById(project.id))!);
  await setProfilePhoto(profilePhotoBefore);
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
