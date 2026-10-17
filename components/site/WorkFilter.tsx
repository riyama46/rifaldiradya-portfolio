"use client";

import { useCallback, useEffect, useState } from "react";
import { takeCaseFromHome, track } from "@/lib/analytics/events";
import type { ProjectGroup } from "@/lib/projects/validation";

type Filter = "all" | ProjectGroup;

type WorkFilterProps = {
  /** id of the <ol> of case rows; the filter is a data attribute on it (CSS hides the rest). */
  listId: string;
  lang: "en" | "id";
  total: number;
  groups: { group: ProjectGroup; count: number }[];
  labels: { group: string; all: string } & Record<ProjectGroup, string>;
};

// Delta APP_FLOW S-02 steps 2 and 4. Server-rendered so it takes its space from the first paint
// (no layout shift); without JS it is hidden by CSS (html without data-theme) and every row shows
// (E-07). Also opens the row named by #case-<slug> on load and on hashchange:
// filter back to All, open, scroll, focus its <summary>, case_open "hash" (unless the home title
// click already counted it). An unknown or draft slug leaves the page as it is (E-29).
export function WorkFilter({ listId, lang, total, groups, labels }: WorkFilterProps) {
  const [active, setActive] = useState<Filter>("all");

  const apply = useCallback(
    (filter: Filter) => {
      const list = document.getElementById(listId);
      if (list) list.dataset.filter = filter;
      setActive(filter);
    },
    [listId],
  );

  useEffect(() => {
    function openFromHash() {
      const slug = /^#case-([\w-]+)$/.exec(window.location.hash)?.[1];
      const row = slug && document.getElementById(`case-${slug}`);
      if (!slug || !(row instanceof HTMLDetailsElement)) return;

      apply("all");
      row.open = true;
      // Next frame: after the filter reset has laid the list out again.
      requestAnimationFrame(() => {
        row.scrollIntoView({ block: "start" });
        row.querySelector("summary")?.focus({ preventScroll: true });
      });

      if (!takeCaseFromHome(slug))
        track("case_open", { project_slug: slug, source: "hash", language: lang });
    }

    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [apply, lang]);

  if (groups.length === 0) return null;

  const buttons: { filter: Filter; label: string; count: number }[] = [
    { filter: "all", label: labels.all, count: total },
    ...groups.map(({ group, count }) => ({ filter: group, label: labels[group], count })),
  ];

  return (
    <div className="filters" role="group" aria-label={labels.group}>
      {buttons.map(({ filter, label, count }) => (
        <button
          key={filter}
          type="button"
          aria-pressed={active === filter}
          onClick={() => apply(filter)}
        >
          {label} <span className="fc">{count}</span>
        </button>
      ))}
    </div>
  );
}
