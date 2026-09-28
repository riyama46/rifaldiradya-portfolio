import { describe, expect, it } from "vitest";
import en from "@/i18n/en.json";
import id from "@/i18n/id.json";
import { mailtoHref, siteConfig } from "@/lib/site-config";

describe("mailtoHref", () => {
  it("builds the EN inquiry link with an encoded subject", () => {
    expect(mailtoHref(en.email.subject)).toBe(
      "mailto:hello@rifaldiradya.com?subject=Project%20inquiry%20from%20rifaldiradya.com",
    );
  });

  it("builds the ID inquiry link with an encoded subject", () => {
    expect(mailtoHref(id.email.subject)).toBe(
      "mailto:hello@rifaldiradya.com?subject=Tanya%20project%20dari%20rifaldiradya.com",
    );
  });

  it("encodes characters that would break the query", () => {
    expect(mailtoHref("A & B? #1")).toBe(
      `mailto:${siteConfig.email}?subject=A%20%26%20B%3F%20%231`,
    );
  });
});

describe("siteConfig", () => {
  it("uses https for the LinkedIn profile", () => {
    expect(siteConfig.social.linkedin).toMatch(/^https:\/\/www\.linkedin\.com\/in\//);
  });
});
