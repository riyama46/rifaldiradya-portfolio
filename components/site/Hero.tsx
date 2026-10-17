import { Fragment } from "react";
import { ChapterDepth } from "@/components/site/ChapterDepth";
import { MailtoLink } from "@/components/site/MailtoLink";
import type { Dictionary } from "@/i18n";
import { richText } from "@/i18n/rich";
import type { PublicAvatar } from "@/lib/images/store";
import { siteConfig } from "@/lib/site-config";

type HeroProps = {
  dict: Dictionary;
  /** Profile photo from the admin (S-14); null shows the initials. */
  avatar: PublicAvatar | null;
  /** Availability switch of S-14 (D-16). */
  availabilityOn: boolean;
  /** "Scroll ↓" target: Selected work, or About when it is not rendered (E-25). */
  scrollTarget: "#work" | "#about";
};

// Delta APP_FLOW S-01 bab 1. The H1 rises in without any opacity change (D-10): it is the LCP
// element. No priority image here; the avatar is small with explicit dimensions.
export function Hero({ dict, avatar, availabilityOn, scrollTarget }: HeroProps) {
  return (
    <section id="top" data-zone="top" aria-labelledby="hero-h" className="chapter ch hero">
      <ChapterDepth />
      <div className="ch-inner">
        <div className="who">
          {avatar ? (
            // A plain <img>: the 320/640 variants cover 1–3× screens at 44/64 px, no loader needed.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar.src}
              srcSet={avatar.srcSet}
              sizes="(min-width: 768px) 64px, 44px"
              width={64}
              height={64}
              alt={dict.hero.avatarAlt}
              decoding="async"
              className="who-pic"
            />
          ) : (
            <div aria-hidden="true" className="who-pic who-initials">
              {siteConfig.initials}
            </div>
          )}
          <div>
            <p className="ch-label">
              {dict.hero.role}
              <span className="who-loc"> · {dict.hero.loc}</span>
            </p>
            {availabilityOn && (
              <p className="ch-label who-status">
                <i aria-hidden="true" />
                {dict.hero.open}
              </p>
            )}
          </div>
        </div>

        <h1 id="hero-h" className="hero-h">
          <span className="line">{dict.hero.l1}</span>{" "}
          <span className="line">{richText(dict.hero.l2)}</span>
        </h1>

        <div className="hero-foot">
          <div>
            <p className="hero-sub">{dict.hero.sub}</p>
            <p className="hero-stack">
              <span className="k">{dict.hero.stack}</span>
              {siteConfig.stack.map((item) => (
                <Fragment key={item}>
                  {" "}
                  <span>{item}</span>
                </Fragment>
              ))}
            </p>
          </div>
          <div className="hero-act">
            <MailtoLink dict={dict} kind="general" location="hero" variant="primary">
              {dict.cta}
            </MailtoLink>
            <a href={scrollTarget} className="ch-label hero-scroll">
              {dict.hero.scroll}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
