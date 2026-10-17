"use client";

import { adminStrings } from "@/components/admin/strings";
import { CASE_ACTIONS, type CaseAction } from "@/lib/projects/validation";

const t = adminStrings.form;

/**
 * S-12 field 11: which button closes the case on the Work page. Native radios in a fieldset, so
 * arrow keys and screen readers work without extra code. The first radio carries the field id.
 */
export function CaseActionField({
  id,
  legend,
  value,
  onChange,
}: {
  id: string;
  legend: string;
  value: CaseAction;
  onChange: (value: CaseAction) => void;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="sr-only">{legend}</legend>
      {CASE_ACTIONS.map((action, index) => (
        <label
          key={action}
          className="flex cursor-pointer items-start gap-3 rounded-[8px] border border-text-muted px-3.5 py-3 transition-colors duration-150 ease-out hover:bg-text/4 has-checked:border-accent has-checked:bg-accent/7 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
        >
          <input
            id={index === 0 ? id : undefined}
            type="radio"
            name={id}
            value={action}
            checked={value === action}
            onChange={() => onChange(action)}
            aria-describedby={`${id}-${action}-help`}
            className="mt-1 size-4 shrink-0 accent-accent focus-visible:outline-none"
          />
          <span>
            <span className="block font-medium">{t.caseActions[action].label}</span>
            <span id={`${id}-${action}-help`} className="block text-small text-text-muted">
              {t.caseActions[action].help}
            </span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
