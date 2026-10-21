import { describe, expect, it } from "vitest";
import en from "@/i18n/en.json";
import id from "@/i18n/id.json";
import { mailtoHref } from "@/lib/mailto";
import { siteConfig } from "@/lib/site-config";

const MAIL = "mailto:hello@rifaldiradya.com";

describe("mailtoHref", () => {
  it("general: subject only, no empty body", () => {
    expect(mailtoHref(en, "general")).toBe(`${MAIL}?subject=Hello%20Rifaldi`);
    expect(mailtoHref(id, "general")).toBe(`${MAIL}?subject=Halo%20Rifaldi`);
  });

  it("role: subject and body in the page language", () => {
    expect(mailtoHref(en, "role")).toBe(
      `${MAIL}?subject=Full-time%20role%3A%20&body=Company%3A%0ARole%20and%20link%20to%20the%20job%20post%3A%0AA%20good%20time%20to%20talk%3A%0A`,
    );
    expect(mailtoHref(id, "role")).toContain("subject=Posisi%20full-time%3A%20&body=Perusahaan%3A");
  });

  it("project: subject and body in the page language", () => {
    expect(mailtoHref(en, "project")).toContain(
      "subject=Project%3A%20&body=What%20you%20need%20built%3A",
    );
    expect(mailtoHref(id, "project")).toContain(
      "subject=Proyek%3A%20&body=Yang%20ingin%20dibangun%3A",
    );
  });

  it("walkthrough names the project in the subject (D-25)", () => {
    expect(mailtoHref(en, "walkthrough", "Single Sign-On")).toContain(
      "subject=Walkthrough%3A%20Single%20Sign-On&body=Company%3A",
    );
    expect(mailtoHref(id, "walkthrough", "HR System")).toContain(
      "subject=Walkthrough%3A%20HR%20System&body=Perusahaan%3A",
    );
  });

  it("encodes characters that would break the query", () => {
    expect(mailtoHref(en, "walkthrough", "A & B? #1")).toContain(
      "subject=Walkthrough%3A%20A%20%26%20B%3F%20%231&",
    );
  });
});

describe("siteConfig", () => {
  it("uses https for the LinkedIn profile (D-19)", () => {
    expect(siteConfig.social.linkedin).toBe("https://www.linkedin.com/in/rifaldiradya");
  });

  it("links the public GitHub profile (D-19)", () => {
    expect(siteConfig.social.github).toBe("https://github.com/riyama46");
  });

  it("serves the CV from public/cv", () => {
    expect(siteConfig.cvPath).toMatch(/^\/cv\/[a-z-]+\.pdf$/);
  });
});
