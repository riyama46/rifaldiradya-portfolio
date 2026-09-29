"use client";

import { useEffect } from "react";
import { analyticsEnabled } from "@/lib/analytics/config";
import { CONSENT_CHANGE_EVENT, getConsent } from "@/lib/analytics/consent";
import { trackFromElement } from "@/lib/analytics/events";
import { startAnalytics, stopAnalytics } from "@/lib/analytics/gtag";

/**
 * Public pages only (never the admin, App Flow G3). Starts GA4 when consent is granted (on load or
 * right after Accept, which also counts the current page), stops it after Reject, and turns clicks
 * on elements with data-track attributes into GA4 events. Renders nothing.
 */
export function Analytics({ lang }: { lang: "en" | "id" }) {
  useEffect(() => {
    if (!analyticsEnabled) return;

    const sync = () => {
      const consent = getConsent();
      if (consent === "granted") startAnalytics();
      else if (consent === "denied") stopAnalytics();
    };
    sync();

    const onClick = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>("[data-track]");
      if (target) trackFromElement(target, window.location.pathname, lang);
    };

    window.addEventListener(CONSENT_CHANGE_EVENT, sync);
    document.addEventListener("click", onClick, { capture: true });
    return () => {
      window.removeEventListener(CONSENT_CHANGE_EVENT, sync);
      document.removeEventListener("click", onClick, { capture: true });
    };
  }, [lang]);

  return null;
}
