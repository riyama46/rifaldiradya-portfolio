import { ChapterDepth } from "@/components/site/ChapterDepth";
import { CopyEmailButton } from "@/components/site/CopyEmailButton";
import { CvLink } from "@/components/site/CvLink";
import { LocalClock } from "@/components/site/LocalClock";
import { MailtoLink } from "@/components/site/MailtoLink";
import type { Dictionary } from "@/i18n";
import { richText } from "@/i18n/rich";
import { siteConfig } from "@/lib/site-config";

// Delta APP_FLOW S-01 bab 5: two mailto actions (role, project), then the ways to reach me.
// Copy email lives only here (D-17); GitHub only once it is filled in (D-19).
export function ContactChapter({ dict }: { dict: Dictionary }) {
  const { ct } = dict;

  return (
    <section
      id="contact"
      data-zone="contact"
      aria-labelledby="contact-h"
      className="chapter ch contact"
    >
      <ChapterDepth />
      <div className="ch-inner">
        <p className="ch-label">{ct.label}</p>
        <h2 id="contact-h" className="talk">
          {richText(ct.h)}
        </h2>
        <p className="pitch">{ct.pitch}</p>

        <div className="acts">
          <MailtoLink dict={dict} kind="role" location="contact" variant="primary">
            {ct.role}
          </MailtoLink>
          <MailtoLink dict={dict} kind="project" location="contact" variant="soft">
            {ct.project}
          </MailtoLink>
        </div>

        <div className="reach">
          <span className="reach-mail">
            <MailtoLink
              dict={dict}
              kind="general"
              location="contact"
              id="contact-email"
              className="line-link"
            >
              {siteConfig.contactEmail}
            </MailtoLink>
            <CopyEmailButton
              email={siteConfig.contactEmail}
              targetId="contact-email"
              labels={{
                copy: dict.email.copy,
                copied: dict.email.copied,
                fallback: dict.email.copyFallback,
              }}
            />
          </span>
          <a
            href={siteConfig.social.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="line-link"
          >
            {ct.linkedin}
          </a>
          <CvLink dict={dict} location="contact" />
          {siteConfig.social.github && (
            <a
              href={siteConfig.social.github}
              target="_blank"
              rel="noopener noreferrer"
              className="line-link"
            >
              {ct.github}
            </a>
          )}
        </div>

        <LocalClock className="clock" />
      </div>
    </section>
  );
}
