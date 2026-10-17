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
// `more` is the closing chapter of the Work page (S-02 step 5, option-b.html #more): its own
// heading and only the two mailto actions.
export function ContactChapter({
  dict,
  variant = "home",
}: {
  dict: Dictionary;
  variant?: "home" | "more";
}) {
  const { ct } = dict;
  const more = variant === "more";
  const id = more ? "more" : "contact";
  const location = more ? "work_contact" : "contact";

  return (
    <section id={id} data-zone={id} aria-labelledby={`${id}-h`} className="chapter ch contact">
      <ChapterDepth />
      <div className="ch-inner">
        <p className="ch-label">{ct.label}</p>
        <h2 id={`${id}-h`} className="talk">
          {richText(more ? ct.hMore : ct.h)}
        </h2>
        <p className="pitch">{ct.pitch}</p>

        <div className="acts">
          <MailtoLink dict={dict} kind="role" location={location} variant="primary">
            {ct.role}
          </MailtoLink>
          <MailtoLink dict={dict} kind="project" location={location} variant="soft">
            {ct.project}
          </MailtoLink>
        </div>

        {!more && <ContactReach dict={dict} />}
      </div>
    </section>
  );
}

function ContactReach({ dict }: { dict: Dictionary }) {
  const { ct } = dict;

  return (
    <>
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
    </>
  );
}
