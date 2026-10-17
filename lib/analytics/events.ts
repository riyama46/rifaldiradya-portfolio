import { analyticsEnabled } from "./config";
import { getConsent } from "./consent";

// The GA4 events of App Flow section 11 (page_view is sent by gtag itself), typed strictly.
type Language = "en" | "id";
export type CaseOpenSource = "home_title" | "row" | "hash";

export type AnalyticsEvents = {
  contact_email_click: {
    location: "bar" | "hero" | "footer" | "work_page";
    method: "mailto" | "copy";
    language: Language;
  };
  project_link_click: {
    project_slug: string;
    page: "home" | "work";
    /** v2 placements (Delta APP_FLOW section 11): Selected work item or Work case row. */
    placement: "home" | "case";
    language: Language;
  };
  /** A Work case row opened (Delta APP_FLOW section 11). */
  case_open: {
    project_slug: string;
    source: CaseOpenSource;
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

// A title click on the home sends case_open "home_title" and leaves this one-time mark, so the
// Work page that opens the row from the same #case-<slug> does not count it again as "hash".
const CASE_FROM_HOME_KEY = "rr-case-from-home";

function markCaseFromHome(slug: string) {
  try {
    sessionStorage.setItem(CASE_FROM_HOME_KEY, slug);
  } catch {
    // Storage blocked: the Work page then also sends "hash"; nothing breaks.
  }
}

/** True once when the row was opened by a title click on the home (and clears the mark). */
export function takeCaseFromHome(slug: string): boolean {
  try {
    const marked = sessionStorage.getItem(CASE_FROM_HOME_KEY);
    sessionStorage.removeItem(CASE_FROM_HOME_KEY);
    return marked === slug;
  } catch {
    return false;
  }
}

const LOCATIONS = ["bar", "hero", "footer", "work_page"] as const;
const PLACEMENTS = ["home", "case"] as const;
const includes = <T extends string>(list: readonly T[], value: string | undefined): value is T =>
  list.includes(value as T);

/**
 * Server-rendered links declare their event with data attributes, so they stay Server Components:
 *   data-track="contact_email_click" data-location="hero" data-method="mailto"
 *   data-track="project_link_click" data-slug="…" data-placement="case"
 * One delegated listener (AnalyticsEvents) turns a click into track(). Returns false when the
 * attributes don't describe a valid event (never sends half-filled events).
 */
export function trackFromElement(element: HTMLElement, pathname: string, language: Language) {
  const { track: name, location, method, slug, placement, source } = element.dataset;
  const page = pathname === "/work" || pathname === "/id/work" ? "work" : "home";
  if (name === "contact_email_click" && includes(LOCATIONS, location)) {
    track(name, { location, method: method === "copy" ? "copy" : "mailto", language });
    return true;
  }
  if (name === "project_link_click" && slug && includes(PLACEMENTS, placement)) {
    track(name, { project_slug: slug, page, placement, language });
    return true;
  }
  if (name === "case_open" && slug && (source === "home_title" || source === "row")) {
    // A click on an open row's <summary> closes it: only opening counts.
    if (source === "row" && element.closest("details")?.open) return false;
    if (source === "home_title") markCaseFromHome(slug);
    track(name, { project_slug: slug, source, language });
    return true;
  }
  return false;
}
