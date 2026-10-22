export type Theme = "dark" | "light";

/** localStorage key for the visitor's choice (D-23, App Flow G4). Never sent anywhere. */
export const THEME_STORAGE_KEY = "rr-theme";

/**
 * D-36 order: `?theme=` (screenshots/QA) → saved choice → dark. The device setting is ignored on
 * purpose: the dark theme is the main look, so every first visit sees it.
 * Self-contained on purpose: ThemeScript inlines its source into <head>, so it may not reference
 * anything outside its own body.
 */
export function resolveTheme(query: string | null, stored: string | null): Theme {
  if (query === "dark" || query === "light") return query;
  if (stored === "dark" || stored === "light") return stored;
  return "dark";
}

/**
 * Runs before first paint. Every browser API is guarded: storage can throw in private mode or when
 * blocked (E-31), and then the theme is dark.
 */
export const themeScript = `(function(){var q=null,s=null;try{q=new URLSearchParams(location.search).get("theme")}catch(e){}try{s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}catch(e){}document.documentElement.dataset.theme=(${resolveTheme.toString()})(q,s)})()`;

export function readTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

/** Applies a theme for this page and remembers it when storage is available (E-31). */
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage blocked: the switch still holds for this page view.
  }
}
