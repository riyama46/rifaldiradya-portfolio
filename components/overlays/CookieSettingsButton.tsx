"use client";

import { useSyncExternalStore } from "react";
import { analyticsEnabled } from "@/lib/analytics/config";
import { OPEN_COOKIE_SETTINGS_EVENT } from "@/lib/analytics/consent";

const subscribe = () => () => {};

/**
 * "Cookie settings" (footer and S-03): reopens O-03. Needs JavaScript, so it only appears after
 * hydration, and only when analytics is configured (no banner → nothing to change).
 */
export function CookieSettingsButton({ label, className }: { label: string; className?: string }) {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  if (!hydrated || !analyticsEnabled) return null;

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))}
      className={className}
    >
      {label}
    </button>
  );
}
