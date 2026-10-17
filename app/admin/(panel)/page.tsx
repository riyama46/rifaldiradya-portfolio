import type { Metadata } from "next";
import { NoticeToast } from "@/components/admin/NoticeToast";
import { ProjectList } from "@/components/admin/ProjectList";
import { adminStrings, parseNotice } from "@/components/admin/strings";
import { Button } from "@/components/ui/Button";
import { requireAdmin } from "@/lib/auth/guard";
import { cn } from "@/lib/cn";
import { projectCounts, selectedWorkCount, toAdminRows } from "@/lib/projects/admin";
import { getAllProjects } from "@/lib/projects/queries";

export const metadata: Metadata = { title: adminStrings.projects.title };

const strings = adminStrings.projects;

// S-11 Project list (CHANGE v2.0.0 Delta APP_FLOW section 6), read directly on the server. The page
// checks the session itself because the (panel) layout does not re-run on client-side navigation.
export default async function AdminProjectsPage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const [projects, { notice }] = await Promise.all([getAllProjects(), searchParams]);
  const noticeKey = parseNotice(notice);
  const selected = selectedWorkCount(projects);
  const counts = projectCounts(projects);

  return (
    <>
      <div className="flex flex-col items-stretch justify-between gap-5 md:flex-row md:items-end">
        <div>
          <h1 className="text-heading">{strings.title}</h1>
          <p className="mt-1.5 text-text-muted">
            {strings.summary(counts.total, counts.published, counts.drafts)}
          </p>
        </div>
        <Button href="/admin/projects/new" size="sm">
          {strings.newProject}
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="mt-8 rounded-card border border-dashed border-text-muted px-6 py-10 text-center">
          <p className="mx-auto max-w-[42ch] text-balance text-text-muted">{strings.empty}</p>
          <Button href="/admin/projects/new" variant="secondary" size="sm" className="mt-6">
            {strings.newProject}
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-small text-text-muted">
            <p
              data-testid="selected-work"
              className={cn(selected.full && "rounded-button bg-warning/14 px-2.5 py-1 text-text")}
            >
              <span className="font-medium text-text">
                {strings.selectedWork(selected.count, selected.limit)}
              </span>
              {selected.full && ` ${strings.selectedWorkFull}`}
            </p>
            <p>{strings.orderHelp}</p>
          </div>
          <ProjectList rows={toAdminRows(projects, new Date())} groupCounts={counts.groups} />
        </>
      )}

      {noticeKey && <NoticeToast key={noticeKey} notice={noticeKey} />}
    </>
  );
}
