import { afterEach, describe, expect, it, vi } from "vitest";
import { consentCookie, gaCookieDeletions, readConsent } from "@/lib/analytics/consent";

describe("consent cookie (App Flow G4)", () => {
  it("lasts 180 days on every path", () => {
    expect(consentCookie("granted", true)).toBe(
      "consent=granted; Max-Age=15552000; Path=/; SameSite=Lax; Secure",
    );
    expect(consentCookie("denied", false)).toBe(
      "consent=denied; Max-Age=15552000; Path=/; SameSite=Lax",
    );
  });

  it("reads only granted or denied", () => {
    expect(readConsent("lang_pref=id; consent=granted")).toBe("granted");
    expect(readConsent("consent=denied")).toBe("denied");
    expect(readConsent("consent=maybe")).toBeNull();
    expect(readConsent("")).toBeNull();
  });
});

describe("removing GA cookies after Reject", () => {
  it("expires _ga and _ga_<id> on the host and every parent domain", () => {
    const deletions = gaCookieDeletions(
      "_ga=GA1.1.1; consent=granted; _ga_ABC123=GS1; lang_pref=en",
      "rifaldiradya.com",
    );
    expect(deletions).toEqual([
      "_ga=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/",
      "_ga=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; Domain=.rifaldiradya.com",
      "_ga_ABC123=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/",
      "_ga_ABC123=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; Domain=.rifaldiradya.com",
    ]);
  });

  it("covers subdomains such as devstaging, and never touches other cookies", () => {
    const deletions = gaCookieDeletions("_ga=1; consent=denied", "devstaging.rifaldiradya.com");
    expect(deletions).toContain(
      "_ga=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; Domain=.rifaldiradya.com",
    );
    expect(deletions).toHaveLength(3);
    expect(deletions.join()).not.toContain("consent");
  });
});

describe("track() and data-track attributes (App Flow section 11)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  async function setup(consent: string) {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST123");
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });
    vi.stubGlobal("document", { cookie: consent });
    const events = await import("@/lib/analytics/events");
    return { gtag, ...events };
  }

  const element = (dataset: Record<string, string>) => ({ dataset }) as unknown as HTMLElement;

  it("sends nothing without consent", async () => {
    const { gtag, track } = await setup("consent=denied");
    track("language_switch", { from: "en", to: "id", source: "toggle" });
    expect(gtag).not.toHaveBeenCalled();
  });

  it("maps data attributes to the typed events", async () => {
    const { gtag, trackFromElement } = await setup("consent=granted");
    trackFromElement(
      element({ track: "contact_email_click", location: "hero", method: "mailto" }),
      "/",
      "en",
    );
    trackFromElement(
      element({ track: "project_link_click", slug: "coffee", placement: "card" }),
      "/id/work",
      "id",
    );
    expect(gtag.mock.calls).toEqual([
      ["event", "contact_email_click", { location: "hero", method: "mailto", language: "en" }],
      [
        "event",
        "project_link_click",
        { project_slug: "coffee", page: "work", placement: "card", language: "id" },
      ],
    ]);
  });

  it("ignores incomplete or unknown attributes instead of sending half an event", async () => {
    const { gtag, trackFromElement } = await setup("consent=granted");
    expect(
      trackFromElement(element({ track: "contact_email_click", location: "sidebar" }), "/", "en"),
    ).toBe(false);
    expect(
      trackFromElement(element({ track: "project_link_click", placement: "card" }), "/", "en"),
    ).toBe(false);
    expect(trackFromElement(element({ track: "something_else" }), "/", "en")).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
  });

  it("does nothing when no Measurement ID is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "");
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });
    vi.stubGlobal("document", { cookie: "consent=granted" });
    const { track } = await import("@/lib/analytics/events");
    track("language_switch", { from: "en", to: "id", source: "toggle" });
    expect(gtag).not.toHaveBeenCalled();
  });
});
