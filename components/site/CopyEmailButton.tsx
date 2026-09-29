"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";

type CopyEmailButtonProps = {
  email: string;
  /** Id of the element showing the address, selected when the Clipboard API fails (E-09). */
  targetId: string;
  labels: { copy: string; copied: string; fallback: string };
};

const subscribe = () => () => {};

// UF-03: only rendered once JavaScript runs (E-07), so there is never a dead button.
export function CopyEmailButton({ email, targetId, labels }: CopyEmailButtonProps) {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [status, setStatus] = useState<"idle" | "copied" | "fallback">("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timer = window.setTimeout(() => setStatus("idle"), status === "copied" ? 2000 : 4000);
    return () => window.clearTimeout(timer);
  }, [status]);

  if (!isClient) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setStatus("copied");
    } catch {
      const target = document.getElementById(targetId);
      if (target) {
        const range = document.createRange();
        range.selectNodeContents(target);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      setStatus("fallback");
    }
    // T-19: track("contact_email_click", { location: "footer", method: "copy" })
  }

  return (
    <span className="inline-flex items-center gap-3">
      <Button
        variant="secondary"
        size="sm"
        onClick={copy}
        data-track="contact_email_click"
        data-location="footer"
        data-method="copy"
      >
        {status === "copied" ? labels.copied : labels.copy}
      </Button>
      <span role="status" aria-live="polite" className="text-small">
        {status === "copied" && <span className="sr-only">{labels.copied}</span>}
        {status === "fallback" && labels.fallback}
      </span>
    </span>
  );
}
