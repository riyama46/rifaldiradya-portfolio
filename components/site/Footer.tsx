import Link from "next/link";
import { CookieSettingsButton } from "@/components/overlays/CookieSettingsButton";
import { FooterCta } from "@/components/site/FooterCta";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { Container } from "@/components/ui/Container";
import { localePath, type Dictionary, type Locale } from "@/i18n";
import { siteConfig } from "@/lib/site-config";

type FooterProps = {
  lang: Locale;
  dict: Dictionary;
  /** The CTA block is shown on every public page except 404 (App Flow G2). */
  showCta?: boolean;
};

const linkClass =
  "inline-flex min-h-11 cursor-pointer items-center rounded-sm hover:text-text hover:underline";

// App Flow G2 footer. "Cookie settings" appears only with JS and a configured GA4 ID (O-03).
export function Footer({ lang, dict, showCta = true }: FooterProps) {
  return (
    <footer>
      {showCta && <FooterCta dict={dict} />}
      <Container>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border pt-5 pb-8 text-small text-text-muted">
          <Link href={localePath("/privacy", lang)} className={linkClass}>
            {dict.footer.privacy}
          </Link>
          <CookieSettingsButton label={dict.footer.cookies} className={linkClass} />
          <a
            href={siteConfig.social.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={dict.footer.linkedinAria}
            className={`group gap-1 ${linkClass}`}
          >
            LinkedIn
            <ArrowIcon />
          </a>
          <span className="sm:ml-auto">
            © {new Date().getFullYear()} {siteConfig.name}
          </span>
        </div>
      </Container>
    </footer>
  );
}
