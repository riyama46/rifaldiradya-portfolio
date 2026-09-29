import { NextResponse } from "next/server";
import { guardAdminWrite } from "@/lib/auth/guard";
import { apiError } from "@/lib/http/api";
import { isImageKind, MAX_VARIANT_BYTES, mediaUrl, type ImageKind } from "@/lib/images/rules";
import { deleteOrphanImages, saveImage } from "@/lib/images/store";
import { checkVariants, uploadMessages } from "@/lib/images/upload";

// Four variants of at most 1 MB each, plus multipart overhead.
const MAX_BODY_BYTES = 4 * MAX_VARIANT_BYTES + 64 * 1024;

// API-06 (App Flow section 10): multipart `variant` parts, all made in the browser from one image,
// plus `kind`: "thumbnail" (default, 16:10) or "avatar" (1:1 profile photo, T-18b).
export async function POST(request: Request) {
  const denied = await guardAdminWrite(request);
  if (denied) return denied;

  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return apiError(413, "FILE_TOO_LARGE", uploadMessages.tooLarge);
  }

  let parts: Uint8Array[];
  let kind: ImageKind;
  try {
    const form = await request.formData();
    const requestedKind = form.get("kind") ?? "thumbnail";
    if (!isImageKind(requestedKind)) throw new Error("unknown kind");
    kind = requestedKind;
    const files = form.getAll("variant").filter((part): part is File => part instanceof File);
    parts = await Promise.all(files.map(async (file) => new Uint8Array(await file.arrayBuffer())));
  } catch {
    return apiError(422, "VALIDATION_FAILED", uploadMessages.malformed);
  }

  const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
  if (total > MAX_BODY_BYTES) return apiError(413, "FILE_TOO_LARGE", uploadMessages.tooLarge);

  const check = checkVariants(parts, kind);
  if (!check.ok) return apiError(check.status, check.code, check.message);

  try {
    const image = await saveImage(check.format, check.variants);
    // Housekeeping while we're here; never fails the upload.
    await deleteOrphanImages().catch((error: Error) =>
      console.error("[images] orphan cleanup failed:", error.message),
    );
    return NextResponse.json(
      {
        public_id: image.id,
        url: mediaUrl(image.id, image.format),
        width: image.width,
        height: image.height,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[images] upload failed:", (error as Error).message);
    return apiError(502, "UPLOAD_FAILED", "Upload failed. Check your connection and try again.");
  }
}
