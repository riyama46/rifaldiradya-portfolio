"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminStrings } from "@/components/admin/strings";
import { Container } from "@/components/ui/Container";
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

// Admin sections (G3). usePathname is safe here: admin URLs are never rewritten by proxy.ts.
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label={adminStrings.nav.label} className="border-b border-border bg-surface">
      <Container className="flex gap-6">
        {links.map(({ href, label, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px inline-flex min-h-11 items-center border-b-2 text-small font-medium",
                active
                  ? "border-accent text-text"
                  : "border-transparent text-text-muted hover:text-text",
              )}
            >
              {label}
            </Link>
          );
        })}
      </Container>
    </nav>
  );
}
