"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { adminStrings } from "@/components/admin/strings";
import { Toast } from "@/components/ui/Toast";

type Direction = "up" | "down";

type ReorderButtonsProps = {
  projectId: string;
  title: string;
  position: number;
  total: number;
  /** The list renders a table and a card view; ids must differ between them. */
  layout: "table" | "card";
};

const strings = adminStrings.projects;

const buttonClass =
  "grid size-11 cursor-pointer place-items-center rounded-button border border-text-muted text-text-muted transition-colors hover:enabled:bg-text/8 hover:enabled:text-text disabled:cursor-not-allowed disabled:opacity-35 md:size-9";

/**
 * ↑/↓ on S-11 (DECISIONS T-18b): API-08 swaps the project with its neighbour, then the list is
 * refreshed from the server. React moves the row, which drops keyboard focus, so focus is put back
 * on the same button (or the other one at the top/bottom) and the new position is announced.
 */
export function ReorderButtons({ projectId, title, position, total, layout }: ReorderButtonsProps) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [pending, setPending] = useState<Direction | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [error, setError] = useState<{ id: number; message: string } | null>(null);
  const focusAfterRefresh = useRef<Direction | null>(null);
  const idFor = (direction: Direction) => `move-${layout}-${projectId}-${direction}`;

  useEffect(() => {
    const direction = focusAfterRefresh.current;
    if (refreshing || !direction) return;
    focusAfterRefresh.current = null;
    const same = document.getElementById(idFor(direction)) as HTMLButtonElement | null;
    const other = document.getElementById(idFor(direction === "up" ? "down" : "up"));
    (same && !same.disabled ? same : other)?.focus();
  });

  const showError = (message: string) =>
    setError((previous) => ({ id: (previous?.id ?? 0) + 1, message }));

  async function move(direction: Direction) {
    setPending(direction);
    try {
      const response = await fetch(`/api/admin/projects/${projectId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      if (response.ok) {
        const body = (await response.json()) as { position: number };
        setAnnouncement(strings.moved(title, body.position));
        focusAfterRefresh.current = direction;
        startRefresh(() => router.refresh());
      } else if (response.status === 404) {
        startRefresh(() => router.refresh());
      } else {
        showError(response.status === 401 ? adminStrings.form.sessionExpired : strings.moveFailed);
      }
    } catch {
      showError(strings.moveFailed);
    }
    setPending(null);
  }

  const busy = pending !== null || refreshing;

  return (
    <div className={layout === "card" ? "flex flex-col gap-1.5" : "flex gap-1.5"}>
      {(["up", "down"] as const).map((direction) => (
        <button
          key={direction}
          id={idFor(direction)}
          type="button"
          onClick={() => void move(direction)}
          disabled={busy || (direction === "up" ? position <= 1 : position >= total)}
          aria-label={direction === "up" ? strings.moveUp(title) : strings.moveDown(title)}
          className={buttonClass}
        >
          <span aria-hidden="true">{direction === "up" ? "↑" : "↓"}</span>
        </button>
      ))}
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
      {error && <Toast key={error.id} tone="error" message={error.message} />}
    </div>
  );
}
