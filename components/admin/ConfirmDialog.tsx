"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: "danger" | "default";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Native modal <dialog>: focus stays inside, Esc cancels, the page behind is inert. The Cancel
 * button gets initial focus (App Flow S-13), so Enter never confirms by accident.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  tone = "default",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      cancel.current?.focus();
    } else if (!open && element.open) {
      element.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      aria-describedby={body ? bodyId : undefined}
      onCancel={(event) => {
        event.preventDefault(); // keep React state the source of truth
        if (!busy) onCancel();
      }}
      className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-card border border-border bg-surface-raised p-6 text-text shadow-card-hover backdrop:bg-text/40"
    >
      <h2 id={titleId} className="font-display text-card font-semibold">
        {title}
      </h2>
      {body && (
        <p id={bodyId} className="mt-2 text-text-muted">
          {body}
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          ref={cancel}
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="inline-flex min-h-11 cursor-pointer items-center rounded-button border border-border bg-surface-raised px-3.5 font-medium hover:border-text-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <Button
          size="sm"
          variant={tone === "danger" ? "danger" : "primary"}
          loading={busy}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
