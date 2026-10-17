"use client";

import { useSyncExternalStore } from "react";
import { track } from "@/lib/analytics/events";
import { cn } from "@/lib/cn";
import { applyTheme, readTheme, type Theme } from "@/lib/theme";

type ThemeToggleProps = {
  labels: { toDark: string; toLight: string };
  className?: string;
};

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

// The server cannot know the theme (ThemeScript decides it in the browser); dark is the default.
const serverTheme = (): Theme => "dark";

/**
 * O-04 (public bar + admin header): icon button, the label lives in aria-label and names what a
 * click does. Hidden by CSS when the inline script never ran (no JS, E-07).
 */
export function ThemeToggle({ labels, className }: ThemeToggleProps) {
  const theme = useSyncExternalStore(subscribe, readTheme, serverTheme);
  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      aria-label={next === "light" ? labels.toLight : labels.toDark}
      onClick={() => {
        applyTheme(next);
        track("theme_switch", { to: next });
      }}
      className={cn(
        "theme-toggle inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-sm text-text transition-colors duration-200 hover:text-accent",
        className,
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="size-4"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" />
      </svg>
    </button>
  );
}
