import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { valuesFromInput } from "@/components/admin/project-form-model";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { adminStrings } from "@/components/admin/strings";
import { requireAdmin } from "@/lib/auth/guard";
import { selectedWorkFullWithout } from "@/lib/projects/admin";
import { toProjectInput } from "@/lib/projects/mutations";
import { getAllProjects, getProjectById } from "@/lib/projects/queries";

export const metadata: Metadata = { title: adminStrings.form.editTitle };

// S-13 Edit project (App Flow section 6, UF-08, UF-09). Unknown id → S-11 with a toast (section 2).
export default async function EditProjectPage({ params }: PageProps<"/admin/projects/[id]">) {
  const { id } = await params;
  await requireAdmin(`/admin/projects/${encodeURIComponent(id)}`);

  const project = /^[0-9A-Za-z]{1,26}$/.test(id) ? await getProjectById(id) : null;
  if (!project) redirect("/admin?notice=not-found");
  const projects = await getAllProjects();

  return (
    <>
      <Link
        href="/admin"
        className="inline-flex min-h-11 items-center gap-2 text-small text-text-muted hover:text-text"
      >
        <span aria-hidden="true">←</span>
        {adminStrings.form.back}
      </Link>
      <h1 className="mt-3 text-heading">{adminStrings.form.editTitle}</h1>
      <p className="mt-1.5 mb-10 text-text-muted">{adminStrings.form.intro}</p>
      <ProjectForm
        mode="edit"
        projectId={project.id}
        savedPublicId={project.thumbnailPublicId}
        initial={valuesFromInput(toProjectInput(project))}
        selectedWorkFull={selectedWorkFullWithout(projects, project.id)}
      />
    </>
  );
}
