"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { localePath, type Dictionary, type Locale } from "@/i18n";
import { analyticsEnabled } from "@/lib/analytics/config";
import { CONSENT_CHANGE_EVENT, getConsent } from "@/lib/analytics/consent";
import { track } from "@/lib/analytics/events";
import { readLangPref, saveLangPref, shouldSuggestIndonesian } from "@/lib/lang-pref";

type LanguageSuggestBannerProps = {
  lang: Locale;
  /** Locale-free path of the current page; null → the Indonesian home (404). */
  path: string | null;
  labels: Dictionary["langBanner"];
};

const PHONE = "(max-width: 767px)";

/** Re-evaluate when the cookie choice changes or the viewport crosses the phone breakpoint. */
function subscribe(onChange: () => void) {
  const media = window.matchMedia(PHONE);
  window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
  media.addEventListener("change", onChange);
  return () => {
    window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
    media.removeEventListener("change", onChange);
  };
}

/** On phones both banners sit at the bottom: O-02 waits until O-03 has an answer (App Flow O-02). */
const waitingForConsent = () =>
  analyticsEnabled && getConsent() === null && window.matchMedia(PHONE).matches;

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="size-4"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

/**
 * O-02 (App Flow): offered to browsers that list Indonesian, on English pages, until a choice is
 * stored in lang_pref. Decided in the browser after hydration (the server render and the first
 * client render show nothing), so it never blocks rendering and never shows without JS (E-07).
 * It is an overlay, so nothing shifts (no CLS): 48 px right under the sticky navbar from 768 px, and
 * a bar at the bottom of the screen on phones, where the hero starts only 24 px below the navbar.
 */
export function LanguageSuggestBanner({ lang, path, labels }: LanguageSuggestBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const suggest = useSyncExternalStore(
    subscribe,
    () =>
      !waitingForConsent() &&
      shouldSuggestIndonesian({
        pageLocale: lang,
        langPref: readLangPref(document.cookie),
        languages: navigator.languages?.length ? navigator.languages : [navigator.language],
      }),
    () => false,
  );

  if (!suggest || dismissed) return null;

  const href = localePath(path ?? "/", "id");

  return (
    <div
      role="region"
      aria-label={labels.text}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-accent-soft pb-[env(safe-area-inset-bottom)] md:absolute md:top-full md:bottom-auto md:border-t-0 md:border-b md:pb-0"
    >
      <div className="mx-auto flex h-12 w-full max-w-[1200px] items-center gap-3 px-4 text-small lg:px-8">
        {/* Very narrow screens show only the button; the region label still carries the sentence. */}
        <p className="mr-auto truncate max-[419px]:sr-only">{labels.text}</p>
        <Button
          href={href}
          size="sm"
          variant="secondary"
          lang="id"
          hrefLang="id"
          className="min-h-9 shrink-0 max-[419px]:mr-auto"
          onClick={(event) => {
            saveLangPref("id");
            track("language_switch", { from: "en", to: "id", source: "banner" });
            // Keep the anchor, like the toggle (/#work → /id#work).
            if (window.location.hash) {
              event.preventDefault();
              // Switching locale changes the root layout param, which is a full page load anyway; router.push
              // doubled the hash on that path (/#work#work, caught by e2e), so navigate directly.
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination
              window.location.assign(`${href}${window.location.hash}`);
            }
          }}
        >
          {labels.action}
        </Button>
        <button
          type="button"
          aria-label={labels.dismiss}
          onClick={() => {
            saveLangPref("en");
            setDismissed(true);
          }}
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-button text-text-muted hover:text-text"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}
