import Link from "next/link";
import { AdminThumbnail } from "@/components/admin/AdminThumbnail";
import { ReorderButtons } from "@/components/admin/ReorderButtons";
import { adminStrings } from "@/components/admin/strings";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Project } from "@/lib/db/schema";
import { formatRelativeTime } from "@/lib/projects/admin";

const strings = adminStrings.projects;
const editHref = (project: Project) => `/admin/projects/${project.id}`;

function StatusBadges({ project }: { project: Project }) {
  return (
    <span className="flex flex-wrap gap-2">
      <Badge variant="plain" className="gap-2">
        <span
          aria-hidden="true"
          className={`size-2 rounded-full ${project.published ? "bg-success" : "bg-border"}`}
        />
        {project.published ? strings.published : strings.draft}
      </Badge>
      {project.featured && <Badge>{strings.featured}</Badge>}
    </span>
  );
}

function Updated({ project, now }: { project: Project; now: Date }) {
  return (
    <time dateTime={project.updatedAt.toISOString()}>
      {formatRelativeTime(project.updatedAt, now)}
    </time>
  );
}

function TitleLink({ project }: { project: Project }) {
  return (
    <Link
      href={editHref(project)}
      className="font-medium underline decoration-border decoration-2 underline-offset-4 hover:decoration-accent"
    >
      {project.titleEn}
    </Link>
  );
}

function EditButton({ project }: { project: Project }) {
  return (
    <Button
      href={editHref(project)}
      variant="secondary"
      size="sm"
      aria-label={strings.editProject(project.titleEn)}
    >
      {strings.edit}
    </Button>
  );
}

/**
 * S-11 rows (App Flow): a table from 768px, stacked cards below it. The position is shown and
 * changed here with ↑/↓ (DECISIONS T-18b); every other change goes through S-13.
 */
export function ProjectList({ projects, now }: { projects: Project[]; now: Date }) {
  return (
    <>
      <table className="hidden w-full border-collapse text-left md:table">
        <thead className="text-small text-text-muted">
          <tr className="border-b border-border">
            <th scope="col" className="w-10 py-3 pr-3 text-right font-medium">
              {strings.columns.order}
            </th>
            <th scope="col" className="py-3 pr-4 font-medium">
              <span className="sr-only">{strings.columns.thumbnail}</span>
            </th>
            <th scope="col" className="py-3 pr-4 font-medium">
              {strings.columns.title}
            </th>
            <th scope="col" className="py-3 pr-4 font-medium">
              {strings.columns.status}
            </th>
            <th scope="col" className="py-3 pr-4 font-medium">
              {strings.columns.updated}
            </th>
            <th scope="col" className="py-3 pr-4 font-medium">
              <span className="sr-only">{strings.columns.reorder}</span>
            </th>
            <th scope="col" className="py-3 font-medium">
              <span className="sr-only">{strings.columns.actions}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project, index) => (
            <tr key={project.id} className="border-b border-border">
              <td className="py-3 pr-3 text-right font-medium tabular-nums">{index + 1}</td>
              <td className="w-20 py-3 pr-4">
                <AdminThumbnail url={project.thumbnailUrl} />
              </td>
              <td className="py-3 pr-4">
                <TitleLink project={project} />
              </td>
              <td className="py-3 pr-4">
                <StatusBadges project={project} />
              </td>
              <td className="py-3 pr-4 whitespace-nowrap text-small text-text-muted">
                <Updated project={project} now={now} />
              </td>
              <td className="py-3 pr-4">
                <ReorderButtons
                  layout="table"
                  projectId={project.id}
                  title={project.titleEn}
                  position={index + 1}
                  total={projects.length}
                />
              </td>
              <td className="py-3 text-right">
                <EditButton project={project} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="grid gap-3 md:hidden">
        {projects.map((project, index) => (
          <li
            key={project.id}
            className="rounded-card border border-border bg-surface-raised p-4 shadow-card"
          >
            <div className="flex items-start gap-3">
              <AdminThumbnail url={project.thumbnailUrl} />
              <div className="min-w-0">
                <TitleLink project={project} />
                <p className="mt-1 text-small text-text-muted">
                  {strings.order(index + 1)} ·{" "}
                  {strings.updated(formatRelativeTime(project.updatedAt, now))}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <StatusBadges project={project} />
              <div className="flex gap-1.5">
                <ReorderButtons
                  layout="card"
                  projectId={project.id}
                  title={project.titleEn}
                  position={index + 1}
                  total={projects.length}
                />
                <EditButton project={project} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
