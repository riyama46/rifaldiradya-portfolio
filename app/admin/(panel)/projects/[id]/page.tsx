import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { valuesFromInput } from "@/components/admin/project-form-model";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { adminStrings } from "@/components/admin/strings";
import { requireAdmin } from "@/lib/auth/guard";
import { toProjectInput } from "@/lib/projects/mutations";
import { getProjectById } from "@/lib/projects/queries";

export const metadata: Metadata = { title: adminStrings.form.editTitle };

// S-13 Edit project (App Flow section 6, UF-08, UF-09). Unknown id → S-11 with a toast (section 2).
export default async function EditProjectPage({ params }: PageProps<"/admin/projects/[id]">) {
  const { id } = await params;
  await requireAdmin(`/admin/projects/${encodeURIComponent(id)}`);

  const project = /^[0-9A-Za-z]{1,26}$/.test(id) ? await getProjectById(id) : null;
  if (!project) redirect("/admin?notice=not-found");

  return (
    <>
      <Link
        href="/admin"
        className="text-small text-text-muted underline underline-offset-4 hover:text-text"
      >
        {adminStrings.form.back}
      </Link>
      <h1 className="mt-3 mb-8 text-heading">{adminStrings.form.editTitle}</h1>
      <ProjectForm
        mode="edit"
        projectId={project.id}
        savedPublicId={project.thumbnailPublicId}
        initial={valuesFromInput(toProjectInput(project))}
      />
    </>
  );
}
