import { GA_MEASUREMENT_ID } from "./config";

// GA4 in Consent Mode v2, loaded only after "Accept" (DECISIONS T-19): until then no Google script
// is requested at all, so no cookie and no cookieless ping leaves the browser.

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

const DENIED = {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
} as const;

function ensureGtag(): Gtag {
  window.dataLayer ??= [];
  window.gtag ??= function gtag() {
    // gtag.js expects the Arguments object itself, not an array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  return window.gtag;
}

let loaded = false;

/** Loads gtag.js once, with ads always denied and analytics granted, then counts this page. */
export function startAnalytics(): void {
  if (!GA_MEASUREMENT_ID || loaded) return;
  loaded = true;
  const gtag = ensureGtag();
  gtag("consent", "default", DENIED);
  gtag("consent", "update", { analytics_storage: "granted" });
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID, { send_page_view: true });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

/** After switching to Reject: GA may already be loaded on this page; stop it from storing anything. */
export function stopAnalytics(): void {
  window.gtag?.("consent", "update", { analytics_storage: "denied" });
}
