import { AdminNav } from "@/components/admin/AdminNav";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { adminStrings } from "@/components/admin/strings";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { Container } from "@/components/ui/Container";
import { requireAdmin } from "@/lib/auth/guard";

// Every page in this group requires a valid session (SDD section 6: requireAdmin is the source of
// truth; proxy.ts only filters requests without a cookie). Header = App Flow G3.
export default async function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();

  return (
    <>
      <header className="border-b border-border bg-surface-raised">
        <Container className="flex h-16 items-center gap-3">
          <p className="mr-auto font-display font-semibold">{adminStrings.appName}</p>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex min-h-11 items-center gap-1 px-2 text-small font-medium hover:text-accent"
          >
            {adminStrings.viewSite}
            <ArrowIcon />
          </a>
          <LogoutButton />
        </Container>
      </header>
      <AdminNav />
      <main>
        <Container className="py-10">{children}</Container>
      </main>
    </>
  );
}
