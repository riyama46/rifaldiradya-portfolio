import type { Locale } from "@/i18n";

// lang_pref (App Flow G4): the visitor's language choice, set by O-01 and O-02 in the browser.
// It never changes which locale the server renders (G1); it only stops O-02 from asking again.

export const LANG_PREF_COOKIE = "lang_pref";
const MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

/** Cookie string for document.cookie. `secure` on https so it is never sent over plain http. */
export function langPrefCookie(locale: Locale, secure: boolean): string {
  return [
    `${LANG_PREF_COOKIE}=${locale}`,
    `Max-Age=${MAX_AGE_SECONDS}`,
    "Path=/",
    "SameSite=Lax",
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}

/** The stored choice, or null when there is none (or it is not en/id). */
export function readLangPref(cookieHeader: string): Locale | null {
  for (const part of cookieHeader.split(";")) {
    const [name, value] = part.trim().split("=");
    if (name === LANG_PREF_COOKIE && (value === "en" || value === "id")) return value;
  }
  return null;
}

/**
 * O-02 shows only on English pages, when no choice was stored yet, and when the browser lists an
 * Indonesian language (`id`, `id-ID`, …). `in` is the legacy code some older Android builds send.
 */
export function shouldSuggestIndonesian(options: {
  pageLocale: Locale;
  langPref: Locale | null;
  languages: readonly string[];
}): boolean {
  if (options.pageLocale !== "en" || options.langPref !== null) return false;
  return options.languages.some((language) => /^(id|in)(-|$)/i.test(language));
}

/** Browser only: remember the choice for a year. */
export function saveLangPref(locale: Locale): void {
  document.cookie = langPrefCookie(locale, window.location.protocol === "https:");
}
