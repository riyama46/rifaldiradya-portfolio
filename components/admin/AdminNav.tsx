"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminStrings } from "@/components/admin/strings";
import { cn } from "@/lib/cn";

const links = [
  {
    href: "/admin",
    label: adminStrings.nav.projects,
    match: (path: string) => path === "/admin" || path.startsWith("/admin/projects"),
  },
  {
    href: "/admin/profile",
    label: adminStrings.nav.profile,
    match: (path: string) => path.startsWith("/admin/profile"),
  },
];

// Admin sections (G3), inside the top bar like admin.html. usePathname is safe here: admin URLs
// are never rewritten by proxy.ts.
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label={adminStrings.nav.label} className="flex gap-1">
      {links.map(({ href, label, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-button px-2.5 text-small font-medium transition-colors md:min-h-9 md:px-3",
              active ? "bg-text/8 text-text" : "text-text-muted hover:text-text",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
