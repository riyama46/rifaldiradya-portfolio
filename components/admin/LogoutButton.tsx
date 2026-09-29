"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminStrings } from "@/components/admin/strings";
import { Button } from "@/components/ui/Button";

// UF-10: API-02, then the login page; refresh drops any cached admin view from the router.
export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <Button variant="secondary" size="sm" loading={pending} onClick={logout}>
      {adminStrings.logout}
    </Button>
  );
}
