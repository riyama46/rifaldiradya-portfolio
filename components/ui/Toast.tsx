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

// admin.html toast: inverted ink panel; the tone is the dot, the message says the rest.
const dots: Record<ToastTone, string> = {
  success: "bg-success",
  warning: "bg-accent",
  error: "bg-danger",
};

const panel =
  "pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-lg bg-text px-4 py-3 text-small font-medium text-bg shadow-lg"; // taste-skill-ignore: a toast floats over the page

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
        <p className={panel}>
          <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", dots[tone])} />
          {message}
        </p>
      )}
    </div>
  );
}
