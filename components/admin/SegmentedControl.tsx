"use client";

import { cn } from "@/lib/cn";

type SegmentedControlProps<T extends string> = {
  /** Put on the first button, so "focus the first error" and label links land here. */
  id: string;
  labelledBy: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  describedBy?: string;
};

/**
 * Group / Visual type on S-12 (admin.html `.seg`): a group of toggle buttons, one pressed. Each
 * button is a plain tab stop, so it works the same with a keyboard, a mouse and a screen reader.
 */
export function SegmentedControl<T extends string>({
  id,
  labelledBy,
  options,
  value,
  onChange,
  describedBy,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className="inline-flex max-w-full flex-wrap justify-self-start gap-0.5 rounded-[8px] bg-text/8 p-[3px]"
    >
      {options.map((option, index) => {
        const pressed = option.value === value;
        return (
          <button
            key={option.value}
            id={index === 0 ? id : undefined}
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange(option.value)}
            className={cn(
              "min-h-11 cursor-pointer rounded-button px-3.5 text-small font-medium transition-colors duration-150 ease-out md:min-h-9",
              pressed
                ? "bg-surface text-text shadow-[0_0_0_1px_var(--color-text-muted)]"
                : "text-text-muted hover:text-text",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
