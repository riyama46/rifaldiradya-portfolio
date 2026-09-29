import { apiError } from "@/lib/http/api";

/** API-03/04: the chosen thumbnail was removed (e.g. by the 24-hour orphan cleanup) before saving. */
export const missingImage = () =>
  apiError(422, "VALIDATION_FAILED", "Some fields need attention.", {
    fields: { thumbnail: "This image is no longer available. Upload it again." },
  });
