import { apiError } from "@/lib/http/api";
import { messages } from "./validation";

/** API-03/04: the chosen thumbnail was removed (e.g. by the 24-hour orphan cleanup) before saving. */
export const missingImage = () =>
  apiError(422, "VALIDATION_FAILED", "Some fields need attention.", {
    fields: { thumbnail: "This image is no longer available. Upload it again." },
  });

/** API-03/04, E-26: a 6th project switched on for Selected work. */
export const showOnHomeFull = () =>
  apiError(422, "VALIDATION_FAILED", "Some fields need attention.", {
    fields: { show_on_home: messages.showOnHomeFull },
  });
