import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/i18n";
import { mailtoHref } from "@/lib/site-config";

// E-01: never an empty page; point forward with the email CTA.
export function EmptyState({
  dict,
  trackLocation,
}: {
  dict: Dictionary;
  /** GA4 contact_email_click location; App Flow defines one only for the Work page. */
  trackLocation?: "work_page";
}) {
  return (
    <div className="rounded-card border border-dashed border-border px-6 py-10 text-center">
      <p className="mx-auto max-w-[42ch] text-balance text-text-muted">{dict.work.empty}</p>
      <Button
        href={mailtoHref(dict.email.subject)}
        variant="secondary"
        className="mt-6"
        data-track={trackLocation ? "contact_email_click" : undefined}
        data-location={trackLocation}
      >
        {dict.nav.email}
      </Button>
    </div>
  );
}
