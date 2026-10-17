import type { ReactNode } from "react";
import { BylineBadge } from "@/components/site/BylineBadge";
import { MetaRow } from "@/components/site/MetaRow";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { Dictionary } from "@/i18n";
import type { PublicAvatar } from "@/lib/images/store";
import { richText } from "@/i18n/rich";
import { mailtoHref } from "@/lib/site-config";

type HeroProps = {
  dict: Dictionary;
  /** HeroProofPanel (T-09). When absent (0 featured projects, E-21) the hero is one column. */
  proofPanel?: ReactNode;
  /** Profile photo from the admin (S-14); null shows the initials. */
  avatar: PublicAvatar | null;
};

// App Flow S-01 section 1. H1, subheadline, and panel are never faded in (would delay LCP);
// only the highlighter animates.
export function Hero({ dict, proofPanel, avatar }: HeroProps) {
  return (
    <section id="top" className="hero-texture pt-6 pb-16 lg:pt-18 lg:pb-28">
      <Container
        className={proofPanel ? "grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-14" : ""}
      >
        <div>
          <BylineBadge avatar={avatar} />
          <h1 className="max-w-[14ch] text-display">{richText(dict.hero.title)}</h1>
          <p className="mt-4 max-w-[58ch] text-text-muted lg:mt-6 lg:text-body-lg">
            {dict.hero.subtitle}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 lg:mt-9">
            <Button href="#work">{dict.hero.ctaPrimary}</Button>
            <Button
              href={mailtoHref(dict.email.subject)}
              variant="ghost"
              data-track="contact_email_click"
              data-location="hero"
            >
              {dict.hero.ctaSecondary}
            </Button>
          </div>
          <MetaRow dict={dict} />
        </div>
        {proofPanel}
      </Container>
    </section>
  );
}
