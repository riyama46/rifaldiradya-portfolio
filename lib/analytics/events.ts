import { analyticsEnabled } from "./config";
import { getConsent } from "./consent";

// The GA4 events of App Flow section 11 (page_view is sent by gtag itself), typed strictly.
type Language = "en" | "id";

export type AnalyticsEvents = {
  contact_email_click: {
    location: "bar" | "hero" | "footer" | "work_page";
    method: "mailto" | "copy";
    language: Language;
  };
  project_link_click: {
    project_slug: string;
    page: "home" | "work";
    placement: "hero_panel" | "card";
    language: Language;
  };
  language_switch: { from: Language; to: Language; source: "toggle" | "banner" };
  /** O-04 theme toggle (Delta APP_FLOW section 11). */
  theme_switch: { to: "dark" | "light" };
};

/** No-op without an ID, without consent, or before gtag exists. GA4 sends with a beacon. */
export function track<Name extends keyof AnalyticsEvents>(
  name: Name,
  params: AnalyticsEvents[Name],
): void {
  if (!analyticsEnabled || typeof window === "undefined" || !window.gtag) return;
  if (getConsent() !== "granted") return;
  window.gtag("event", name, params);
}

const LOCATIONS = ["bar", "hero", "footer", "work_page"] as const;
const PLACEMENTS = ["hero_panel", "card"] as const;
const includes = <T extends string>(list: readonly T[], value: string | undefined): value is T =>
  list.includes(value as T);

/**
 * Server-rendered links declare their event with data attributes, so they stay Server Components:
 *   data-track="contact_email_click" data-location="hero" data-method="mailto"
 *   data-track="project_link_click" data-slug="…" data-placement="card"
 * One delegated listener (AnalyticsEvents) turns a click into track(). Returns false when the
 * attributes don't describe a valid event (never sends half-filled events).
 */
export function trackFromElement(element: HTMLElement, pathname: string, language: Language) {
  const { track: name, location, method, slug, placement } = element.dataset;
  const page = pathname === "/work" || pathname === "/id/work" ? "work" : "home";
  if (name === "contact_email_click" && includes(LOCATIONS, location)) {
    track(name, { location, method: method === "copy" ? "copy" : "mailto", language });
    return true;
  }
  if (name === "project_link_click" && slug && includes(PLACEMENTS, placement)) {
    track(name, { project_slug: slug, page, placement, language });
    return true;
  }
  return false;
}
