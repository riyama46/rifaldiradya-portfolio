import { guardAdminWrite } from "@/lib/auth/guard";
import { apiError } from "@/lib/http/api";
import { deleteImageIfUnused } from "@/lib/images/store";

const ID = /^[0-9A-Z]{26}$/;

// API-07 (App Flow section 10): remove an upload that was never saved on a project (Remove,
// Replace, or Cancel in the form). Images used by a project are only removed through API-04/05.
export async function DELETE(request: Request, ctx: RouteContext<"/api/admin/uploads/[id]">) {
  const denied = await guardAdminWrite(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  const notFound = () => apiError(404, "NOT_FOUND", "Image not found.");
  if (!ID.test(id)) return notFound();

  try {
    const result = await deleteImageIfUnused(id);
    if (result === "in_use") {
      return apiError(409, "IMAGE_IN_USE", "This image is used by a saved project.");
    }
    return result === "deleted" ? new Response(null, { status: 204 }) : notFound();
  } catch (error) {
    console.error("[images] delete failed:", (error as Error).message);
    return apiError(500, "SERVER_ERROR", "Couldn't remove the image. Try again.");
  }
}
