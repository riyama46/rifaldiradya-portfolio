import { CopyEmailButton } from "@/components/site/CopyEmailButton";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { Dictionary } from "@/i18n";
import { richText } from "@/i18n/rich";
import { mailtoHref, siteConfig } from "@/lib/site-config";

const EMAIL_TEXT_ID = "contact-email";

// App Flow S-01 section 5 / G2: centered, generous space so nothing competes with the ask.
export function FooterCta({ dict }: { dict: Dictionary }) {
  return (
    <Container className="flex flex-col items-center py-28 text-center lg:py-44">
      <p className="mb-5 flex justify-center gap-3 text-eyebrow font-medium text-text-muted uppercase">
        <b className="font-medium text-text">04</b>
        <span>{dict.label.contact}</span>
      </p>
      <h2 className="max-w-[14ch] text-display-cta">{richText(dict.cta.title)}</h2>
      <p className="mt-4 max-w-[44ch] text-balance text-text-muted">{dict.cta.sub}</p>
      <Button
        href={mailtoHref(dict.email.subject)}
        size="lg"
        className="mt-8 lg:mt-10"
        data-track="contact_email_click"
        data-location="footer"
      >
        {dict.cta.button}
        <ArrowIcon direction="right" />
      </Button>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[0.9375rem] text-text-muted">
        <span>{dict.cta.or}</span>
        <span id={EMAIL_TEXT_ID} className="font-medium text-text select-all">
          {siteConfig.email}
        </span>
        <CopyEmailButton
          email={siteConfig.email}
          targetId={EMAIL_TEXT_ID}
          labels={{
            copy: dict.email.copy,
            copied: dict.email.copied,
            fallback: dict.email.copyFallback,
          }}
        />
      </div>
    </Container>
  );
}
