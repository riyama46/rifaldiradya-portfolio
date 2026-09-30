"use client";

import type { MouseEvent } from "react";
import { localePath, type Locale } from "@/i18n";
import { cn } from "@/lib/cn";
import { track } from "@/lib/analytics/events";
import { saveLangPref } from "@/lib/lang-pref";

type LanguageToggleProps = {
  lang: Locale;
  /** Locale-free path of the current page (`/`, `/work`, …); null for pages without a counterpart. */
  path: string | null;
  label: string;
};

const LOCALE_LABELS: Record<Locale, string> = { en: "EN", id: "ID" };

/** A plain left click (not a new-tab / new-window / download click). */
const isPlainClick = (event: MouseEvent) =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

// O-01: real <a href> links (work without JS, crawlable). With JS a click also stores lang_pref
// and carries the #hash to the counterpart page (/#work → /id#work). The href comes from the server
// (no usePathname: it mismatches with proxy rewrites on static pages).
export function LanguageToggle({ lang, path, label }: LanguageToggleProps) {
  const target: Locale = lang === "en" ? "id" : "en";
  // Pages without a counterpart (404) switch to the other locale's home (App Flow O-01).
  const targetHref = localePath(path ?? "/", target);

  function onSwitch(event: MouseEvent<HTMLAnchorElement>) {
    saveLangPref(target);
    track("language_switch", { from: lang, to: target, source: "toggle" });
    const hash = path === null ? "" : window.location.hash;
    if (hash && isPlainClick(event)) {
      event.preventDefault();
      // Switching locale changes the root layout param, which is a full page load anyway; router.push
      // doubled the hash on that path (/#work#work, caught by e2e), so navigate directly.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`${targetHref}${hash}`);
    }
  }

  return (
    <div role="group" aria-label={label} className="flex items-center text-small font-medium">
      {(["en", "id"] as const).map((locale, index) => {
        const isActive = locale === lang;
        const itemClass = "inline-flex min-h-11 min-w-9 items-center justify-center rounded-sm";
        return (
          <span key={locale} className="flex items-center">
            {index > 0 && <span aria-hidden="true" className="h-3.5 w-px bg-border" />}
            {isActive ? (
              // The current language is not a link: an <a> without href is an uncrawlable link
              // (Lighthouse SEO), and clicking it does nothing anyway (App Flow O-01).
              <span lang={locale} aria-current="true" className={cn(itemClass, "text-accent")}>
                {LOCALE_LABELS[locale]}
              </span>
            ) : (
              <a
                href={targetHref}
                onClick={onSwitch}
                lang={locale}
                hrefLang={locale}
                className={cn(itemClass, "text-text-muted hover:text-text")}
              >
                {LOCALE_LABELS[locale]}
              </a>
            )}
          </span>
        );
      })}
    </div>
  );
}
