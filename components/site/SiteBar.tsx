import Link from "next/link";
import { LanguageSuggestBanner } from "@/components/overlays/LanguageSuggestBanner";
import { LanguageToggle } from "@/components/overlays/LanguageToggle";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { localePath, type Dictionary, type Locale } from "@/i18n";
import { mailtoHref, siteConfig } from "@/lib/site-config";

type SiteBarProps = {
  lang: Locale;
  dict: Dictionary;
  /** Locale-free path of the current page; null when there is no counterpart page (404). */
  path: string | null;
};

// Delta App Flow G2 bar: name → home, Work, About, EN|ID (O-01), theme (O-04), "Email me".
// Fixed over the chapters with a scrim fading into the page; below 768 px Work and About are
// hidden, as in option-b.html. Rendered by each page because the language toggle needs the path.
export function SiteBar({ lang, dict, path }: SiteBarProps) {
  return (
    <header className="site-bar">
      <Link href={localePath("/", lang)} className="site-bar-name">
        <span className="max-md:hidden">{siteConfig.name}</span>
        <span className="md:hidden">{siteConfig.shortName}</span>
      </Link>

      <nav aria-label={dict.nav.label} className="site-bar-nav">
        <span className="flex items-center gap-[inherit] max-md:hidden">
          <Link
            href={localePath("/work", lang)}
            aria-current={path === "/work" ? "page" : undefined}
            className="bar-link"
          >
            {dict.nav.work}
          </Link>
          <Link href={localePath("/#about", lang)} className="bar-link">
            {dict.nav.about}
          </Link>
        </span>
        <LanguageToggle lang={lang} path={path} label={dict.language.label} />
        <ThemeToggle labels={dict.theme} className="w-9" />
        <a
          href={mailtoHref(dict.email.subject)}
          className="bar-link text-accent hover:text-text"
          data-track="contact_email_click"
          data-kind="general"
          data-location="bar"
        >
          {dict.nav.email}
        </a>
      </nav>

      {lang === "en" && <LanguageSuggestBanner lang={lang} path={path} labels={dict.langBanner} />}
    </header>
  );
}
