import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/i18n";
import { mailtoHref, type MailKind } from "@/lib/mailto";

type MailtoLinkProps = {
  dict: Dictionary;
  kind: MailKind;
  /** GA4 `location` of contact_email_click (Delta APP_FLOW section 11). */
  location: "bar" | "hero" | "contact" | "work_contact" | "case";
  /** Project title for the walkthrough subject (D-25) and its slug for the event. */
  project?: { title: string; slug: string };
  /** Renders as a button; without it a plain link styled by `className`. */
  variant?: "primary" | "soft" | "secondary";
  id?: string;
  className?: string;
  children: ReactNode;
};

// Every email action of F5: a mailto with subject and body filled per kind and page language.
// Server Component; the click is tracked through data attributes (AnalyticsEvents).
export function MailtoLink({
  dict,
  kind,
  location,
  project,
  variant,
  id,
  className,
  children,
}: MailtoLinkProps) {
  const href = mailtoHref(dict, kind, project?.title);
  const track = {
    "data-track": "contact_email_click",
    "data-kind": kind,
    "data-location": location,
    "data-method": "mailto",
    "data-slug": project?.slug,
  };

  if (variant) {
    return (
      <Button href={href} variant={variant} size="lg" id={id} className={className} {...track}>
        {children}
      </Button>
    );
  }

  return (
    <a href={href} id={id} className={className} {...track}>
      {children}
    </a>
  );
}
