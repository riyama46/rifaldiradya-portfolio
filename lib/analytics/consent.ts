// consent cookie (App Flow G4, O-03): "granted" | "denied", 180 days. Browser only, except the pure
// helpers, which are unit tested.

export const CONSENT_COOKIE = "consent";
export type Consent = "granted" | "denied";
const MAX_AGE_SECONDS = 180 * 24 * 60 * 60;

/** Fired on window whenever the choice changes or the banner should reopen. */
export const CONSENT_CHANGE_EVENT = "consentchange";
export const OPEN_COOKIE_SETTINGS_EVENT = "opencookiesettings";

export function readConsent(cookieHeader: string): Consent | null {
  for (const part of cookieHeader.split(";")) {
    const [name, value] = part.trim().split("=");
    if (name === CONSENT_COOKIE && (value === "granted" || value === "denied")) return value;
  }
  return null;
}

export function consentCookie(value: Consent, secure: boolean): string {
  return [
    `${CONSENT_COOKIE}=${value}`,
    `Max-Age=${MAX_AGE_SECONDS}`,
    "Path=/",
    "SameSite=Lax",
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}

/**
 * Deletion strings for the GA4 cookies (_ga and _ga_<id>). GA sets them on the widest domain it
 * can (".rifaldiradya.com"), so every parent domain of the current host is covered, plus host-only.
 */
export function gaCookieDeletions(cookieHeader: string, hostname: string): string[] {
  const names = cookieHeader
    .split(";")
    .map((part) => part.trim().split("=")[0])
    .filter((name) => name === "_ga" || name.startsWith("_ga_"));
  const labels = hostname.split(".");
  const domains = [
    "",
    ...labels.slice(0, -1).map((_, index) => `; Domain=.${labels.slice(index).join(".")}`),
  ];
  const expired = "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/";
  return names.flatMap((name) => domains.map((domain) => `${name}=; ${expired}${domain}`));
}

export const getConsent = (): Consent | null => readConsent(document.cookie);

export function saveConsent(value: Consent): void {
  document.cookie = consentCookie(value, window.location.protocol === "https:");
  if (value === "denied") {
    for (const deletion of gaCookieDeletions(document.cookie, window.location.hostname)) {
      document.cookie = deletion;
    }
  }
  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
}
