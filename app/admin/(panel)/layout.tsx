import { AdminNav } from "@/components/admin/AdminNav";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { adminStrings } from "@/components/admin/strings";
import { requireAdmin } from "@/lib/auth/guard";

const ghost =
  "inline-flex min-h-11 items-center gap-1.5 rounded-button px-2.5 text-small font-medium text-text-muted transition-colors hover:bg-text/8 hover:text-text md:min-h-9 md:px-3";

// Every page in this group requires a valid session (SDD section 6: requireAdmin is the source of
// truth; proxy.ts only filters requests without a cookie). Header = App Flow G3 (admin.html .top):
// one sticky bar with the name, the sections, View site, the theme toggle (O-04) and Log out.
export default async function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border bg-bg">
        <div className="mx-auto flex h-15 w-full max-w-[1240px] items-center gap-2 px-3 md:gap-7 md:px-7">
          <p className="hidden items-baseline gap-2.5 font-semibold whitespace-nowrap md:flex">
            {adminStrings.brand}
            <span className="font-medium text-text-muted">{adminStrings.brandSuffix}</span>
          </p>
          <AdminNav />
          <div className="ml-auto flex items-center gap-0.5 md:gap-1.5">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={adminStrings.viewSiteLabel}
              className={ghost}
            >
              <span className="hidden md:inline">{adminStrings.viewSite}</span>
              <span aria-hidden="true">↗</span>
            </a>
            <ThemeToggle
              labels={adminStrings.theme}
              className="rounded-button text-text-muted hover:bg-text/8 hover:text-text md:size-9"
            />
            <LogoutButton className={ghost} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1240px] px-4 pt-7 pb-16 md:px-7 md:pt-10">
        {children}
      </main>
    </>
  );
}
