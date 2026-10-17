"use client";

import { useEffect, useRef } from "react";
import { inputBorder, inputClass } from "@/components/admin/FormField";
import { addLine, canAddLine, removeLine } from "@/components/admin/project-form-model";
import { adminStrings } from "@/components/admin/strings";
import { cn } from "@/lib/cn";

const t = adminStrings.form;

type LinesInputProps = {
  /** Put on the first line, so "focus the first error" lands here. */
  id: string;
  language: "EN" | "ID";
  lines: string[];
  onChange: (lines: string[]) => void;
  onBlur: () => void;
  invalid: boolean;
  describedBy?: string;
};

/**
 * "What I did" (S-12 field 8): one input per line, + Add a line (up to 8), × removes a line. The
 * order stays as typed; blank lines are dropped when saving. Focus follows the change: a new line
 * gets focus, a removed one hands it to its neighbour.
 */
export function LinesInput({
  id,
  language,
  lines,
  onChange,
  onBlur,
  invalid,
  describedBy,
}: LinesInputProps) {
  const focusLine = useRef<number | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (focusLine.current === null) return;
    inputs.current[Math.min(focusLine.current, lines.length - 1)]?.focus();
    focusLine.current = null;
  });

  const update = (index: number, value: string) =>
    onChange(lines.map((line, position) => (position === index ? value : line)));

  return (
    <div className="grid gap-2">
      <ol className="grid gap-2">
        {lines.map((line, index) => (
          // Lines have no identity of their own; the index is their identity.
          <li key={index} className="flex gap-2">
            <input
              ref={(element) => {
                inputs.current[index] = element;
              }}
              id={index === 0 ? id : undefined}
              value={line}
              onChange={(event) => update(index, event.target.value)}
              onBlur={onBlur}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (!canAddLine(lines)) return;
                  focusLine.current = lines.length;
                  onChange(addLine(lines));
                }
              }}
              aria-label={t.line(index + 1, language)}
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              className={cn(inputClass, inputBorder(invalid))}
            />
            <button
              type="button"
              aria-label={t.removeLine(index + 1, language)}
              onClick={() => {
                focusLine.current = Math.max(0, index - (index === lines.length - 1 ? 1 : 0));
                onChange(removeLine(lines, index));
              }}
              className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-button border border-text-muted text-text-muted transition-colors hover:bg-text/8 hover:text-text"
            >
              <span aria-hidden="true">×</span>
            </button>
          </li>
        ))}
      </ol>
      {canAddLine(lines) && (
        <button
          type="button"
          aria-label={t.addLineLabel(language)}
          onClick={() => {
            focusLine.current = lines.length;
            onChange(addLine(lines));
          }}
          className="min-h-11 cursor-pointer justify-self-start rounded-button px-2.5 text-small font-medium text-accent transition-colors hover:bg-accent/10 md:min-h-9"
        >
          {t.addLine}
        </button>
      )}
    </div>
  );
}
