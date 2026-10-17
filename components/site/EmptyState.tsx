import { MailtoLink } from "@/components/site/MailtoLink";
import type { Dictionary } from "@/i18n";

// E-01: never an empty page; point forward with the email CTA. v1 look until T-30/T-31.
export function EmptyState({
  dict,
  location,
}: {
  dict: Dictionary;
  location: "contact" | "work_contact";
}) {
  return (
    <div className="rounded-card border border-dashed border-border px-6 py-10 text-center">
      <p className="mx-auto max-w-[42ch] text-balance text-text-muted">{dict.work.empty}</p>
      <MailtoLink
        dict={dict}
        kind="general"
        location={location}
        variant="secondary"
        className="mt-6"
      >
        {dict.cta}
      </MailtoLink>
    </div>
  );
}
