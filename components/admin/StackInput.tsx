"use client";

import { useState, type KeyboardEvent } from "react";
import { addTags } from "@/components/admin/project-form-model";
import { adminStrings } from "@/components/admin/strings";
import { cn } from "@/lib/cn";

const t = adminStrings.form;

type StackInputProps = {
  id: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  onBlur: () => void;
  /** Duplicate, too long or too many: shown as the field error until the next keystroke. */
  onError: (message: string | null) => void;
  invalid: boolean;
  describedBy?: string;
};

/** S-12 field 9 (Stack, column `tags`): chips added with Enter or comma, × or Backspace removes. */
export function StackInput({
  id,
  tags,
  onChange,
  onBlur,
  onError,
  invalid,
  describedBy,
}: StackInputProps) {
  const [draft, setDraft] = useState("");

  function commit(raw: string) {
    const result = addTags(tags, raw);
    onChange(result.tags);
    onError(result.error);
    setDraft(result.error ? raw.trim() : "");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit(draft);
    } else if (event.key === "Backspace" && draft === "" && tags.length > 0) {
      onChange(tags.slice(0, -1));
      onError(null);
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-button border bg-field px-2 py-1.5 focus-within:border-accent focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_22%,transparent)]",
        invalid ? "border-danger" : "border-text-muted",
      )}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex min-h-8 items-center gap-1 rounded-[5px] bg-text/8 py-0.5 pr-0.5 pl-2.5 text-small"
        >
          {tag}
          <button
            type="button"
            aria-label={t.removeTag(tag)}
            onClick={() => {
              onChange(tags.filter((item) => item !== tag));
              onError(null);
            }}
            className="grid size-7 cursor-pointer place-items-center rounded-[4px] text-text-muted hover:bg-text/8 hover:text-text"
          >
            <span aria-hidden="true">×</span>
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          onError(null);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => {
          if (draft.trim()) commit(draft);
          onBlur();
        }}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="min-w-32 flex-1 bg-transparent px-1 py-1 text-base outline-none"
      />
    </div>
  );
}
