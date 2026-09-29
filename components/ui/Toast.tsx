"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";

export type ToastTone = "success" | "warning" | "error";

type ToastProps = {
  message: string;
  tone?: ToastTone;
  /** App Flow S-11: success toasts stay 4 seconds. */
  duration?: number;
  onDone?: () => void;
};

const tones: Record<ToastTone, string> = {
  success: "border-l-success bg-surface-raised",
  warning: "border-l-accent bg-accent-soft",
  error: "border-l-danger bg-surface-raised",
};

const subscribe = () => () => {};

/**
 * A polite live region that exists before its text does: the server render and hydration leave it
 * empty and the message is inserted right after, so screen readers announce it even when the toast
 * comes from a server render. No motion (the PRD Motion table has no toast entry).
 */
export function Toast({ message, tone = "success", duration = 4000, onDone }: ToastProps) {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHidden(true);
      onDone?.();
    }, duration);
    return () => window.clearTimeout(timer);
  }, [duration, onDone]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center md:inset-x-auto md:right-6 md:bottom-6"
    >
      {hydrated && !hidden && (
        <p
          className={cn(
            "pointer-events-auto max-w-sm rounded-button border border-l-4 border-border px-4 py-3 text-small font-medium shadow-card",
            tones[tone],
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
}
