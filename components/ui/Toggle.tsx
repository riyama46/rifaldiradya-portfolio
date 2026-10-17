"use client";

import { cn } from "@/lib/cn";

type ToggleProps = {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

/** Switch (WAI-ARIA role="switch"): label and help text sit next to it and are both announced. */
export function Toggle({ id, label, description, checked, onChange, disabled }: ToggleProps) {
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-help` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-accent" : "bg-text-muted",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "inline-block size-[18px] rounded-full bg-bg transition-transform duration-200 ease-out",
            checked ? "translate-x-[19px]" : "translate-x-[3px]",
          )}
        />
      </button>
      <div>
        <p id={`${id}-label`} className="font-medium">
          {label}
        </p>
        {description && (
          <p id={`${id}-help`} className="text-small text-text-muted">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
