"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminStrings } from "@/components/admin/strings";

// UF-10: API-02, then the login page; refresh drops any cached admin view from the router.
export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={pending}
      aria-busy={pending || undefined}
      className={`${className ?? ""} cursor-pointer disabled:cursor-wait disabled:opacity-60`}
    >
      {adminStrings.logout}
    </button>
  );
}
