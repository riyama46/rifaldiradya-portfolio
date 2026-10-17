import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { adminStrings } from "@/components/admin/strings";
import { getAdminSession } from "@/lib/auth/guard";
import { safeAdminNext } from "@/lib/auth/next-path";

export const metadata: Metadata = { title: adminStrings.signIn.title };

// S-10 (App Flow): no sign-up, no password reset. Already signed in → straight to `next`.
export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { next: rawNext } = await searchParams;
  const next = safeAdminNext(typeof rawNext === "string" ? rawNext : null);

  if (await getAdminSession()) redirect(next);

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-sm rounded-card border border-border bg-surface p-6 sm:p-8">
        <p className="text-eyebrow font-medium text-text-muted uppercase">{adminStrings.appName}</p>
        <h1 className="mt-2 mb-6 text-heading">{adminStrings.signIn.title}</h1>
        <LoginForm next={next} />
      </div>
    </main>
  );
}
