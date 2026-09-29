import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { projects, type Project } from "@/lib/db/schema";

const isBuildPhase = () => process.env.NEXT_PHASE === "phase-production-build";

/**
 * Published projects in standard order (sort_order asc, created_at desc). Drafts never leave here.
 *
 * E-02: if the database is unavailable during `next build` (e.g. CI without a DB), return [] so the
 * build succeeds and pages show the empty state until the next revalidation. At runtime the error
 * is re-thrown so Next.js keeps serving the last good static page instead of an empty one.
 */
export async function getPublishedProjects(): Promise<Project[]> {
  try {
    return await getDb()
      .select()
      .from(projects)
      .where(eq(projects.published, true))
      .orderBy(asc(projects.sortOrder), desc(projects.createdAt));
  } catch (error) {
    if (isBuildPhase()) {
      console.warn(
        `[projects] database unavailable during build, rendering the empty state: ${(error as Error).message}`,
      );
      return [];
    }
    throw error;
  }
}

/**
 * Every project, drafts included, in the same standard order (S-11). Admin pages render per
 * request behind requireAdmin(), so errors are simply thrown to the admin error boundary.
 */
export async function getAllProjects(): Promise<Project[]> {
  return getDb().select().from(projects).orderBy(asc(projects.sortOrder), desc(projects.createdAt));
}
