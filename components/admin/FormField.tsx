import type { ReactNode } from "react";
import type { FieldErrors } from "@/components/admin/project-form-model";
import { adminStrings } from "@/components/admin/strings";
import { cn } from "@/lib/cn";
import type { ProjectField } from "@/lib/projects/validation";

// Building blocks shared by the S-12/S-13 sections. Inputs keep a --soft border (≥ 3:1, Delta PRD
// section 8); --faint is only used for the section rules.

export const inputClass =
  "w-full min-h-[42px] rounded-button border bg-field px-3 py-2.5 text-base text-text transition-[border-color,box-shadow] duration-150 ease-out " +
  "focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_22%,transparent)] focus-visible:outline-none";

export const inputBorder = (invalid: boolean) => (invalid ? "border-danger" : "border-text-muted");

export function describedBy(field: ProjectField, errors: FieldErrors, hasHelp: boolean) {
  const ids = [hasHelp && `${field}-help`, errors[field] && `${field}-error`].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

export function FieldError({ field, errors }: { field: ProjectField; errors: FieldErrors }) {
  if (!errors[field]) return null;
  return (
    <p id={`${field}-error`} className="text-small font-medium text-danger">
      {errors[field]}
    </p>
  );
}

/**
 * One labelled field. `as="group"` is for compound controls (lines, chips, segmented, uploader):
 * the label names a group instead of pointing at one input.
 */
export function Field({
  field,
  label,
  errors,
  help,
  aside,
  as = "label",
  children,
}: {
  field: ProjectField;
  label: string;
  errors: FieldErrors;
  help?: string;
  aside?: ReactNode;
  as?: "label" | "group";
  children: ReactNode;
}) {
  const heading = (
    <span className="flex items-baseline justify-between gap-3 text-small font-medium">
      {as === "label" ? (
        <label htmlFor={field}>{label}</label>
      ) : (
        <span id={`${field}-label`}>{label}</span>
      )}
      {aside && (
        <span aria-hidden="true" className="font-normal text-text-muted tabular-nums">
          {aside}
        </span>
      )}
    </span>
  );
  const body = (
    <>
      {heading}
      {children}
      {help && (
        <p id={`${field}-help`} className="max-w-[65ch] text-small text-text-muted">
          {help}
        </p>
      )}
      <FieldError field={field} errors={errors} />
    </>
  );
  return as === "group" ? (
    <div role="group" aria-labelledby={`${field}-label`} className="grid content-start gap-1.5">
      {body}
    </div>
  ) : (
    <div className="grid content-start gap-1.5">{body}</div>
  );
}

export function Counter({ value, max }: { value: string; max: number }) {
  const length = value.trim().length;
  return (
    <span className={cn(length > max && "font-medium text-danger")}>
      {adminStrings.form.counter(length, max)}
    </span>
  );
}

/** EN and ID side by side from 768px, stacked on phones. */
export function Pair({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

export function FormSection({
  id,
  title,
  help,
  children,
}: {
  id: string;
  title: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="border-t border-border py-7 first:border-t-0 first:pt-0"
    >
      <h2 id={`${id}-heading`} className="text-[1.0625rem] font-semibold tracking-[-0.01em]">
        {title}
      </h2>
      {help && <p className="mt-1 max-w-[65ch] text-small text-text-muted">{help}</p>}
      <div className="mt-5 grid gap-5">{children}</div>
    </section>
  );
}
