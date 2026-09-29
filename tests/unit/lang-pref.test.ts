import { describe, expect, it } from "vitest";
import { langPrefCookie, readLangPref, shouldSuggestIndonesian } from "@/lib/lang-pref";

describe("lang_pref cookie (App Flow G4)", () => {
  it("lasts 365 days on every path, Secure only on https", () => {
    expect(langPrefCookie("id", true)).toBe(
      "lang_pref=id; Max-Age=31536000; Path=/; SameSite=Lax; Secure",
    );
    expect(langPrefCookie("en", false)).toBe(
      "lang_pref=en; Max-Age=31536000; Path=/; SameSite=Lax",
    );
  });

  it("reads only en or id", () => {
    expect(readLangPref("consent=granted; lang_pref=id")).toBe("id");
    expect(readLangPref("lang_pref=en")).toBe("en");
    expect(readLangPref("lang_pref=fr")).toBeNull();
    expect(readLangPref("my_lang_pref=id")).toBeNull();
    expect(readLangPref("")).toBeNull();
  });
});

describe("O-02: when to suggest the Indonesian version", () => {
  const base = { pageLocale: "en" as const, langPref: null, languages: ["id-ID", "en-US"] };

  it("shows for an Indonesian browser on an English page without a stored choice", () => {
    expect(shouldSuggestIndonesian(base)).toBe(true);
    expect(shouldSuggestIndonesian({ ...base, languages: ["en-US", "id"] })).toBe(true);
    expect(shouldSuggestIndonesian({ ...base, languages: ["in-ID"] })).toBe(true); // legacy code
  });

  it("never shows on Indonesian pages, after a choice, or for other languages", () => {
    expect(shouldSuggestIndonesian({ ...base, pageLocale: "id" })).toBe(false);
    expect(shouldSuggestIndonesian({ ...base, langPref: "en" })).toBe(false);
    expect(shouldSuggestIndonesian({ ...base, langPref: "id" })).toBe(false);
    expect(shouldSuggestIndonesian({ ...base, languages: ["en-US", "nl"] })).toBe(false);
    expect(shouldSuggestIndonesian({ ...base, languages: ["ind", "idx"] })).toBe(false);
  });
});
