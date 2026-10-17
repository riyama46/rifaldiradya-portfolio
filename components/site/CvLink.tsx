import type { Dictionary } from "@/i18n";
import { siteConfig } from "@/lib/site-config";

// D-14: the static web CV (public/cv), one English PDF for both locales. Tracked as cv_download.
export function CvLink({ dict, location }: { dict: Dictionary; location: "about" | "contact" }) {
  return (
    <a
      href={siteConfig.cvPath}
      download
      className="line-link"
      data-track="cv_download"
      data-location={location}
    >
      {dict.cv.download}
    </a>
  );
}
