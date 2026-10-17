import type { Metadata } from "next";
import Link from "next/link";
import { emptyValues } from "@/components/admin/project-form-model";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { adminStrings } from "@/components/admin/strings";
import { requireAdmin } from "@/lib/auth/guard";
import { getAllProjects } from "@/lib/projects/queries";
import { selectedWorkFullWithout } from "@/lib/projects/admin";

export const metadata: Metadata = { title: adminStrings.form.newTitle };

// S-12 New project (App Flow section 6, UF-07).
export default async function NewProjectPage() {
  await requireAdmin("/admin/projects/new");
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
      <h1 className="mt-3 text-heading">{adminStrings.form.newTitle}</h1>
      <p className="mt-1.5 mb-10 text-text-muted">{adminStrings.form.intro}</p>
      <ProjectForm
        mode="create"
        initial={emptyValues}
        selectedWorkFull={selectedWorkFullWithout(projects)}
      />
    </>
  );
}
