"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { localePath, type Dictionary, type Locale } from "@/i18n";
import { analyticsEnabled } from "@/lib/analytics/config";
import {
  CONSENT_CHANGE_EVENT,
  getConsent,
  OPEN_COOKIE_SETTINGS_EVENT,
  saveConsent,
  type Consent,
} from "@/lib/analytics/consent";
import { cn } from "@/lib/cn";

const subscribe = (onChange: () => void) => {
  window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
};

/**
 * O-03 (App Flow): shown while no choice is stored (ignoring it = denied, and it asks again on the
 * next page), and reopened by "Cookie settings" with the current choice marked. Accept and Reject
 * look the same (no dark pattern). Phones: a compact bottom bar that leaves the hero CTA visible
 * at 375 × 667; desktop: a card at the bottom right, max 420 px. Without JS it never appears (E-07).
 */
export function CookieConsent({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const consent = useSyncExternalStore<Consent | null | undefined>(
    subscribe,
    () => getConsent(),
    () => undefined, // server + hydration: render nothing
  );
  const [reopened, setReopened] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  const section = useRef<HTMLElement>(null);
  const titleId = useId();

  useEffect(() => {
    const open = () => {
      returnFocus.current = document.activeElement as HTMLElement | null;
      setReopened(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
  }, []);

  useEffect(() => {
    if (reopened) section.current?.querySelector("button")?.focus();
  }, [reopened]);

  const visible = analyticsEnabled && consent !== undefined && (consent === null || reopened);

  // While the banner covers the bottom of the screen, an element that gets keyboard focus underneath
  // it (e.g. the hero panel's pause button on a 768 px tall laptop) is scrolled just above the
  // banner instead of staying hidden (WCAG 2.4.11 Focus Not Obscured).
  useEffect(() => {
    const element = section.current;
    if (!visible || !element) return;
    const onFocus = (event: FocusEvent) => {
      const target = event.target as Element | null;
      if (!target?.getBoundingClientRect || element.contains(target)) return;
      const focused = target.getBoundingClientRect();
      const cover = element.getBoundingClientRect();
      const overlapsX = focused.right > cover.left && focused.left < cover.right;
      if (overlapsX && focused.bottom > cover.top) {
        window.scrollBy({ top: focused.bottom - cover.top + 16, behavior: "instant" });
      }
    };
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, [visible]);

  if (!visible) return null;

  function choose(value: Consent) {
    saveConsent(value);
    if (reopened) {
      setReopened(false);
      returnFocus.current?.focus();
    }
  }

  const choice = (value: Consent, label: string) => (
    <Button
      variant="secondary"
      size="sm"
      aria-pressed={consent === null ? undefined : consent === value}
      onClick={() => choose(value)}
      className={cn("w-full", consent === value && "border-accent text-accent")}
    >
      {label}
    </Button>
  );

  return (
    <section
      ref={section}
      aria-labelledby={titleId}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg md:inset-x-auto md:right-6 md:bottom-4 md:w-[420px] md:rounded-card md:border md:p-4"
    >
      <h2 id={titleId} className="sr-only">
        {dict.consent.label}
      </h2>
      <p className="text-small">
        {dict.consent.body}{" "}
        <Link
          href={localePath("/privacy", lang)}
          className="font-medium underline decoration-accent decoration-2 underline-offset-4"
        >
          {dict.footer.privacy}
        </Link>
      </p>
      <div className="mt-2.5 grid grid-cols-2 gap-2 md:mt-3">
        {choice("granted", dict.consent.accept)}
        {choice("denied", dict.consent.reject)}
      </div>
    </section>
  );
}
