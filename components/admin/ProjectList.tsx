"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminThumbnail } from "@/components/admin/AdminThumbnail";
import { ReorderButtons } from "@/components/admin/ReorderButtons";
import { adminStrings } from "@/components/admin/strings";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { AdminProjectRow } from "@/lib/projects/admin";
import { PROJECT_GROUPS, type ProjectGroup } from "@/lib/projects/validation";

const strings = adminStrings.projects;
const groupLabels = adminStrings.form.groups;
const editHref = (row: AdminProjectRow) => `/admin/projects/${row.id}`;

type Filter = "all" | ProjectGroup;

function Visual({ row }: { row: AdminProjectRow }) {
  if (row.visual?.type === "number") {
    return (
      <span className="flex h-10 w-16 shrink-0 items-end overflow-hidden rounded-[4px] bg-accent/16 px-1.5 pb-1 text-small leading-none font-medium tracking-[-0.02em] whitespace-nowrap tabular-nums">
        {row.visual.number}
      </span>
    );
  }
  return <AdminThumbnail url={row.visual?.url ?? null} />;
}

function Status({ row }: { row: AdminProjectRow }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center gap-1.5 rounded-full px-2.5 text-[0.8125rem] font-medium whitespace-nowrap",
        row.published ? "bg-success/13 text-text" : "bg-text/8 text-text-muted",
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full", row.published ? "bg-success" : "bg-current")}
      />
      {row.published ? strings.published : strings.draft}
    </span>
  );
}

function Shown({ row }: { row: AdminProjectRow }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-full px-2.5 text-[0.8125rem] font-medium whitespace-nowrap",
        row.showOnHome ? "bg-accent/14 text-accent" : "bg-text/8 text-text-muted",
      )}
    >
      {row.showOnHome ? strings.onHome : strings.workOnly}
    </span>
  );
}

function Title({ row }: { row: AdminProjectRow }) {
  return (
    <span className="block min-w-0">
      <Link
        href={editHref(row)}
        className="font-medium underline decoration-transparent underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
      >
        {row.title}
      </Link>
      {row.meta && (
        <span className="mt-0.5 block truncate text-small text-text-muted">{row.meta}</span>
      )}
    </span>
  );
}

function Updated({ row }: { row: AdminProjectRow }) {
  return <time dateTime={row.updatedAt}>{row.updated}</time>;
}

/**
 * S-11 (CHANGE v2.0.0 Delta APP_FLOW section 6): a table from 1200px (nine columns need the
 * room), stacked rows below it. The
 * group filter only hides rows; positions and ↑/↓ always refer to the whole list, which is the
 * order on the site.
 */
export function ProjectList({
  rows,
  groupCounts,
}: {
  rows: AdminProjectRow[];
  groupCounts: Record<ProjectGroup, number>;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = filter === "all" ? rows : rows.filter((row) => row.group === filter);
  const tabs: { value: Filter; label: string; count: number }[] = [
    { value: "all", label: strings.all, count: rows.length },
    ...PROJECT_GROUPS.filter((group) => groupCounts[group] > 0).map((group) => ({
      value: group,
      label: groupLabels[group],
      count: groupCounts[group],
    })),
  ];

  const reorder = (row: AdminProjectRow, layout: "table" | "card") => (
    <ReorderButtons
      layout={layout}
      projectId={row.id}
      title={row.title}
      position={row.position}
      total={rows.length}
    />
  );

  return (
    <>
      <div
        role="group"
        aria-label={strings.filterLabel}
        className="mt-7 flex gap-1 overflow-x-auto border-b border-border"
      >
        {tabs.map((tab) => {
          const active = filter === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(tab.value)}
              className={cn(
                "relative min-h-11 shrink-0 cursor-pointer px-3 whitespace-nowrap transition-colors",
                "after:absolute after:inset-x-2 after:-bottom-px after:h-0.5",
                active ? "text-text after:bg-accent" : "text-text-muted hover:text-text",
              )}
            >
              {tab.label}
              <span className="ml-1.5 text-[0.8125rem] tabular-nums">{tab.count}</span>
            </button>
          );
        })}
      </div>

      <table className="mt-2 hidden w-full table-fixed border-collapse text-left xl:table">
        <thead className="text-[0.8125rem] text-text-muted">
          <tr className="border-b border-border">
            <th scope="col" className="w-10 py-2.5 pr-3 pl-2 font-normal">
              {strings.columns.order}
            </th>
            <th scope="col" className="w-24 py-2.5 pr-4 font-normal">
              {strings.columns.visual}
            </th>
            <th scope="col" className="py-2.5 pr-4 font-normal">
              {strings.columns.title}
            </th>
            <th scope="col" className="w-28 py-2.5 pr-4 font-normal">
              {strings.columns.group}
            </th>
            <th scope="col" className="w-30 py-2.5 pr-4 font-normal">
              {strings.columns.status}
            </th>
            <th scope="col" className="w-38 py-2.5 pr-4 font-normal">
              {strings.columns.shown}
            </th>
            <th scope="col" className="w-36 py-2.5 pr-4 font-normal">
              {strings.columns.updated}
            </th>
            <th scope="col" className="w-28 py-2.5 pr-4 font-normal">
              {strings.columns.reorder}
            </th>
            <th scope="col" className="w-20 py-2.5 pr-2 font-normal">
              <span className="sr-only">{strings.columns.actions}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr key={row.id} className="border-b border-border transition-colors hover:bg-text/3">
              <td className="py-3 pr-3 pl-2 text-small text-text-muted tabular-nums">
                {row.position}
              </td>
              <td className="py-3 pr-4">
                <Visual row={row} />
              </td>
              <td className="py-3 pr-4">
                <Title row={row} />
              </td>
              <td className="py-3 pr-4 text-small whitespace-nowrap text-text-muted">
                {groupLabels[row.group]}
              </td>
              <td className="py-3 pr-4">
                <Status row={row} />
              </td>
              <td className="py-3 pr-4">
                <Shown row={row} />
              </td>
              <td className="py-3 pr-4 text-small whitespace-nowrap text-text-muted">
                <Updated row={row} />
              </td>
              <td className="py-3 pr-4">{reorder(row, "table")}</td>
              <td className="py-3 pr-2 text-right">
                <Button
                  href={editHref(row)}
                  variant="secondary"
                  size="sm"
                  aria-label={strings.editProject(row.title)}
                >
                  {strings.edit}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="mt-1 xl:hidden">
        {visible.map((row) => (
          <li
            key={row.id}
            className="grid grid-cols-[4rem_minmax(0,1fr)_auto] gap-x-3 gap-y-2 border-b border-border py-3.5"
          >
            <Visual row={row} />
            <div className="min-w-0">
              <Title row={row} />
              <p className="mt-1 text-small text-text-muted">
                {strings.position(row.position)} · {groupLabels[row.group]} · <Updated row={row} />
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Status row={row} />
                <Shown row={row} />
              </div>
            </div>
            {reorder(row, "card")}
          </li>
        ))}
      </ul>
    </>
  );
}
