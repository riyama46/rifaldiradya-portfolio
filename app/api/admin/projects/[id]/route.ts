import { NextResponse } from "next/server";
import { guardAdminWrite } from "@/lib/auth/guard";
import { apiError, readJsonBody } from "@/lib/http/api";
import { missingImage, showOnHomeFull } from "@/lib/projects/errors";
import {
  deleteProject,
  ShowOnHomeLimitError,
  toProjectInput,
  toProjectJson,
  updateProject,
  withStoredThumbnail,
} from "@/lib/projects/mutations";
import { getProjectById } from "@/lib/projects/queries";
import { fieldErrors, pickProjectFields, projectInputSchema } from "@/lib/projects/validation";
import { revalidatePublicPages } from "@/lib/revalidate";

// IDs are ULIDs; anything that could not be one is answered with 404 without a query.
const ID = /^[0-9A-Za-z]{1,26}$/;
const notFound = () => apiError(404, "NOT_FOUND", "This project no longer exists.");

// API-04 (App Flow section 10): partial update. The body is merged over the stored project and the
// whole result is validated, so e.g. publishing a draft without an image is still rejected (E-16).
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/projects/[id]">) {
  const denied = await guardAdminWrite(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  if (!ID.test(id)) return notFound();

  const patch = pickProjectFields(await readJsonBody(request));
  if (!patch) {
    return apiError(422, "VALIDATION_FAILED", "Some fields need attention.", { fields: {} });
  }

  try {
    const existing = await getProjectById(id);
    if (!existing) return notFound();

    const parsed = projectInputSchema.safeParse({ ...toProjectInput(existing), ...patch });
    if (!parsed.success) {
      return apiError(422, "VALIDATION_FAILED", "Some fields need attention.", {
        fields: fieldErrors(parsed.error),
      });
    }

    const input = await withStoredThumbnail(parsed.data);
    if (!input) return missingImage();
    const project = await updateProject(existing, input);
    if (!project) return notFound(); // deleted in another tab meanwhile (E-14)

    const revalidated = revalidatePublicPages();
    return NextResponse.json({ project: toProjectJson(project), revalidated });
  } catch (error) {
    if (error instanceof ShowOnHomeLimitError) return showOnHomeFull();
    console.error("[projects] update failed:", (error as Error).message);
    return apiError(500, "SERVER_ERROR", "Couldn't save. Your changes are still here — try again.");
  }
}

// API-05 (App Flow section 10): delete the project and its image, then revalidate.
export async function DELETE(request: Request, ctx: RouteContext<"/api/admin/projects/[id]">) {
  const denied = await guardAdminWrite(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  if (!ID.test(id)) return notFound();

  try {
    const existing = await getProjectById(id);
    if (!existing || !(await deleteProject(existing))) return notFound(); // E-14

    const revalidated = revalidatePublicPages();
    return NextResponse.json({ revalidated });
  } catch (error) {
    console.error("[projects] delete failed:", (error as Error).message);
    return apiError(500, "SERVER_ERROR", "Couldn't delete. Try again.");
  }
}
