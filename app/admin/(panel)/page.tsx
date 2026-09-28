import type { Metadata } from "next";
import { adminStrings } from "@/components/admin/strings";

export const metadata: Metadata = { title: adminStrings.projects.title };

// S-11 shell; T-14 adds the project list, T-17 the create/edit forms.
export default function AdminProjectsPage() {
  return (
    <>
      <h1 className="text-heading">{adminStrings.projects.title}</h1>
      <p className="mt-3 text-text-muted">{adminStrings.projects.empty}</p>
    </>
  );
}
