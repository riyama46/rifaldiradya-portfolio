import { NextResponse } from "next/server";
import { guardAdminWrite } from "@/lib/auth/guard";
import { apiError, readJsonBody } from "@/lib/http/api";
import { missingImage, showOnHomeFull } from "@/lib/projects/errors";
import {
  createProject,
  ShowOnHomeLimitError,
  toProjectJson,
  withStoredThumbnail,
} from "@/lib/projects/mutations";
import { fieldErrors, pickProjectFields, projectInputSchema } from "@/lib/projects/validation";
import { revalidatePublicPages } from "@/lib/revalidate";

// API-03 (App Flow section 10): create a project, then revalidate the public pages.
export async function POST(request: Request) {
  const denied = await guardAdminWrite(request);
  if (denied) return denied;

  const body = pickProjectFields(await readJsonBody(request));
  const parsed = projectInputSchema.safeParse(body ?? {});
  if (!body || !parsed.success) {
    return apiError(422, "VALIDATION_FAILED", "Some fields need attention.", {
      fields: parsed.success ? {} : fieldErrors(parsed.error),
    });
  }

  try {
    const input = await withStoredThumbnail(parsed.data);
    if (!input) return missingImage();
    const project = await createProject(input);
    const revalidated = revalidatePublicPages();
    return NextResponse.json({ project: toProjectJson(project), revalidated }, { status: 201 });
  } catch (error) {
    if (error instanceof ShowOnHomeLimitError) return showOnHomeFull();
    console.error("[projects] create failed:", (error as Error).message);
    return apiError(500, "SERVER_ERROR", "Couldn't save. Your changes are still here — try again.");
  }
}
