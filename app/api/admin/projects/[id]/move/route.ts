import { NextResponse } from "next/server";
import { guardAdminWrite } from "@/lib/auth/guard";
import { apiError, readJsonBody } from "@/lib/http/api";
import { moveProject } from "@/lib/projects/mutations";
import { revalidatePublicPages } from "@/lib/revalidate";

const ID = /^[0-9A-Za-z]{1,26}$/;

// API-08 (DECISIONS T-18b): { direction: "up" | "down" } → the project swaps with its neighbour.
export async function POST(request: Request, ctx: RouteContext<"/api/admin/projects/[id]/move">) {
  const denied = await guardAdminWrite(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  if (!ID.test(id)) return apiError(404, "NOT_FOUND", "This project no longer exists.");

  const body = (await readJsonBody(request)) as { direction?: unknown } | undefined;
  const direction = body?.direction;
  if (direction !== "up" && direction !== "down") {
    return apiError(422, "VALIDATION_FAILED", "Direction must be up or down.");
  }

  try {
    const position = await moveProject(id, direction);
    if (position === null) return apiError(404, "NOT_FOUND", "This project no longer exists.");
    const revalidated = revalidatePublicPages();
    return NextResponse.json({ position, revalidated });
  } catch (error) {
    console.error("[projects] move failed:", (error as Error).message);
    return apiError(500, "SERVER_ERROR", "Couldn't change the order. Try again.");
  }
}
