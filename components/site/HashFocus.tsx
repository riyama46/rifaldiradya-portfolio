"use client";

import { useEffect } from "react";

// Same-page links (#work, skip link #content) only move the browser's focus starting point.
// This moves real focus to the target (or the heading that labels it) so keyboard and
// screen reader users land where the page scrolled to (App Flow S-01: "See the Work").
export function HashFocus() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      const id = link?.getAttribute("href")?.slice(1);
      if (!id) return;

      const target = document.getElementById(id);
      if (!target) return;

      const labelledBy = target.getAttribute("aria-labelledby");
      const focusTarget = (labelledBy && document.getElementById(labelledBy)) || target;
      requestAnimationFrame(() => focusTarget.focus({ preventScroll: true }));
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
