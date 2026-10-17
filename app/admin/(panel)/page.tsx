import type { Metadata } from "next";
import { NoticeToast } from "@/components/admin/NoticeToast";
import { ProjectList } from "@/components/admin/ProjectList";
import { adminStrings, parseNotice } from "@/components/admin/strings";
import { Button } from "@/components/ui/Button";
import { requireAdmin } from "@/lib/auth/guard";
import { heroFeaturedCount } from "@/lib/projects/admin";
import { getAllProjects } from "@/lib/projects/queries";

export const metadata: Metadata = { title: adminStrings.projects.title };

const strings = adminStrings.projects;

// S-11 Project list, read directly on the server (App Flow 9). The page checks the session itself
// because the (panel) layout does not re-run on client-side navigation.
export default async function AdminProjectsPage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const [projects, { notice }] = await Promise.all([getAllProjects(), searchParams]);
  const noticeKey = parseNotice(notice);
  const featured = heroFeaturedCount(projects);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-heading">{strings.title}</h1>
          <p className="mt-1 text-text-muted">{strings.count(projects.length)}</p>
        </div>
        <Button href="/admin/projects/new">{strings.newProject}</Button>
      </div>

      {projects.length === 0 ? (
        <div className="mt-8 rounded-card border border-dashed border-border px-6 py-10 text-center">
          <p className="mx-auto max-w-[42ch] text-balance text-text-muted">{strings.empty}</p>
          <Button href="/admin/projects/new" variant="secondary" className="mt-6">
            {strings.newProject}
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-2 text-small text-text-muted">
            <p>{strings.featuredInHero(featured.count, featured.limit)}</p>
            {featured.overLimit && (
              <p className="rounded-button border-l-4 border-l-accent bg-accent/12 px-3 py-2 font-medium text-text">
                {strings.featuredOverLimit}
              </p>
            )}
            <p>{strings.gridInfo}</p>
            <p>{strings.orderHelp}</p>
          </div>
          <div className="mt-6">
            <ProjectList projects={projects} now={new Date()} />
          </div>
        </>
      )}

      {noticeKey && <NoticeToast key={noticeKey} notice={noticeKey} />}
    </>
  );
}
