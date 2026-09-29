import { NextResponse } from "next/server";
import { guardAdminWrite } from "@/lib/auth/guard";
import { apiError, readJsonBody } from "@/lib/http/api";
import { mediaUrl } from "@/lib/images/rules";
import { getImage, setProfilePhoto } from "@/lib/images/store";
import { revalidatePublicPages } from "@/lib/revalidate";

const ID = /^[0-9A-Z]{26}$/;
const invalid = (message: string) =>
  apiError(422, "VALIDATION_FAILED", "Some fields need attention.", { fields: { photo: message } });

// API-09 (DECISIONS T-18b): { photo_public_id: string | null } sets or clears the hero photo.
// Only a square image uploaded with kind "avatar" is accepted; the old photo is then deleted.
export async function PUT(request: Request) {
  const denied = await guardAdminWrite(request);
  if (denied) return denied;

  const body = (await readJsonBody(request)) as { photo_public_id?: unknown } | undefined;
  const id = body?.photo_public_id;
  if (id !== null && (typeof id !== "string" || !ID.test(id))) {
    return invalid("Choose a photo, or remove it to show the initials.");
  }

  try {
    const image = id ? await getImage(id) : null;
    if (id && (!image || image.width !== image.height)) {
      return invalid("This photo is no longer available. Upload it again.");
    }
    await setProfilePhoto(id);
    const revalidated = revalidatePublicPages();
    return NextResponse.json({
      photo: image
        ? {
            public_id: image.id,
            url: mediaUrl(image.id, image.format),
            width: image.width,
            height: image.height,
          }
        : null,
      revalidated,
    });
  } catch (error) {
    console.error("[profile] save failed:", (error as Error).message);
    return apiError(500, "SERVER_ERROR", "Couldn't save. Try again.");
  }
}
