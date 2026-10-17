import { NextResponse } from "next/server";
import { guardAdminWrite } from "@/lib/auth/guard";
import { apiError, readJsonBody } from "@/lib/http/api";
import { mediaUrl } from "@/lib/images/rules";
import {
  getAvailability,
  getImage,
  getProfilePhoto,
  setAvailability,
  setProfilePhoto,
} from "@/lib/images/store";
import { revalidatePublicPages } from "@/lib/revalidate";

const ID = /^[0-9A-Z]{26}$/;
const invalid = (fields: Record<string, string>) =>
  apiError(422, "VALIDATION_FAILED", "Some fields need attention.", { fields });

const photoJson = (image: Awaited<ReturnType<typeof getImage>>) =>
  image
    ? {
        public_id: image.id,
        url: mediaUrl(image.id, image.format),
        width: image.width,
        height: image.height,
      }
    : null;

// API-09 (DECISIONS T-18b, CHANGE v2.0.0 Delta APP_FLOW section 10):
// { photo_public_id?: string | null, availability_on?: boolean }. A field that is not sent stays as
// it is. A photo must be a square uploaded with kind "avatar"; the old photo is then deleted.
export async function PUT(request: Request) {
  const denied = await guardAdminWrite(request);
  if (denied) return denied;

  const body = await readJsonBody(request);
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return invalid({});
  }
  const { photo_public_id: id, availability_on: availability } = body as {
    photo_public_id?: unknown;
    availability_on?: unknown;
  };

  if (id !== undefined && id !== null && (typeof id !== "string" || !ID.test(id))) {
    return invalid({ photo: "Choose a photo, or remove it to show the initials." });
  }
  if (availability !== undefined && typeof availability !== "boolean") {
    return invalid({ availability_on: "Show availability is not valid." });
  }

  try {
    if (id !== undefined) {
      const image = id ? await getImage(id) : null;
      if (id && (!image || image.width !== image.height)) {
        return invalid({ photo: "This photo is no longer available. Upload it again." });
      }
      await setProfilePhoto(id);
    }
    if (availability !== undefined) await setAvailability(availability);

    const [photo, availabilityOn] = await Promise.all([getProfilePhoto(), getAvailability()]);
    const revalidated = revalidatePublicPages();
    return NextResponse.json({
      photo: photoJson(photo),
      availability_on: availabilityOn,
      revalidated,
    });
  } catch (error) {
    console.error("[profile] save failed:", (error as Error).message);
    return apiError(500, "SERVER_ERROR", "Couldn't save. Try again.");
  }
}
