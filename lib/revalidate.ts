import { revalidatePath } from "next/cache";

/**
 * After API-03/04/05 (SDD section 5): every page under app/[lang] (/, /work, /id, /id/work and
 * privacy) plus the sitemap. Paths are route-file paths, not the rewritten URLs the visitor sees.
 * From a Route Handler this marks them stale; each is rebuilt on its next visit.
 * Returns false instead of throwing, so the save still succeeds and the admin sees E-19.
 */
export function revalidatePublicPages(): boolean {
  try {
    revalidatePath("/[lang]", "layout");
    revalidatePath("/sitemap.xml");
    return true;
  } catch (error) {
    console.error("[revalidate] failed:", (error as Error).message);
    return false;
  }
}
