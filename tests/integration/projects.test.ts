import { eq, like } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { getDb } from "@/lib/db/client";
import { images, projects } from "@/lib/db/schema";
import { mediaUrl } from "@/lib/images/rules";
import { deleteOrphanImages, getImage, getVariant, saveImage } from "@/lib/images/store";
import {
  createProject,
  deleteProject,
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

const ours = (list: { titleEn: string }[]) => list.filter((p) => p.titleEn.startsWith(run));
const pause = () => new Promise((resolve) => setTimeout(resolve, 10));

afterAll(async () => {
  const db = getDb();
  await db.delete(projects).where(like(projects.titleEn, `${run}%`));
  for (const id of createdImages) await db.delete(images).where(eq(images.id, id));
});

describe("public query (App Flow section 9)", () => {
  it("returns only published projects, sort_order asc then newest first", async () => {
    await createProject(input("draft first", { sort_order: 0 }));
    const low = await createProject(input("sort 1", { sort_order: 1, published: false }));
    await pause();
    const olderFive = await createProject(input("sort 5 older", { sort_order: 5 }));
    await pause();
    const newerFive = await createProject(input("sort 5 newer", { sort_order: 5 }));

    const image = await newImage();
    const published = {
      published: true,
      thumbnail: { public_id: image.id, url: "/x", width: 1, height: 1 },
      thumbnail_alt_en: "a",
      thumbnail_alt_id: "a",
    };
    for (const project of [low, olderFive, newerFive]) {
      const stored = await withStoredThumbnail(
        projectInputSchema.parse({ ...toProjectInput(project), ...published }),
      );
      await updateProject(project, stored!);
    }

    const titles = ours(await getPublishedProjects()).map((p) => p.titleEn.slice(run.length + 1));
    expect(titles).toEqual(["sort 1", "sort 5 newer", "sort 5 older"]);

    const all = ours(await getAllProjects()).map((p) => p.titleEn.slice(run.length + 1));
    expect(all[0]).toBe("draft first");
    expect(all).toHaveLength(4);
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
