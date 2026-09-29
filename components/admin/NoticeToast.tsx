"use client";

import { useEffect } from "react";
import { adminStrings, type NoticeKey } from "@/components/admin/strings";
import { Toast } from "@/components/ui/Toast";

/**
 * Shows the toast for ?notice=<key> once, then drops the parameter from the address bar so a
 * reload or a copied URL doesn't repeat it (Next.js syncs history.replaceState with its router).
 */
export function NoticeToast({ notice }: { notice: NoticeKey }) {
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("notice");
    window.history.replaceState(window.history.state, "", url);
  }, []);

  const { tone, message } = adminStrings.notices[notice];
  return <Toast tone={tone} message={message} />;
}
