import type { Metadata } from "next";
import Link from "next/link";
import { emptyValues } from "@/components/admin/project-form-model";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { adminStrings } from "@/components/admin/strings";
import { requireAdmin } from "@/lib/auth/guard";

export const metadata: Metadata = { title: adminStrings.form.newTitle };

// S-12 New project (App Flow section 6, UF-07).
export default async function NewProjectPage() {
  await requireAdmin("/admin/projects/new");

  return (
    <>
      <Link
        href="/admin"
        className="text-small text-text-muted underline underline-offset-4 hover:text-text"
      >
        {adminStrings.form.back}
      </Link>
      <h1 className="mt-3 mb-8 text-heading">{adminStrings.form.newTitle}</h1>
      <ProjectForm mode="create" initial={emptyValues} />
    </>
  );
}
