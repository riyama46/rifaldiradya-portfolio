import Link from "next/link";
import { LanguageSuggestBanner } from "@/components/overlays/LanguageSuggestBanner";
import { LanguageToggle } from "@/components/overlays/LanguageToggle";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { localePath, type Dictionary, type Locale } from "@/i18n";
import { mailtoHref, siteConfig } from "@/lib/site-config";

type SiteHeaderProps = {
  lang: Locale;
  dict: Dictionary;
  /** Locale-free path of the current page; null when there is no counterpart page (404). */
  path: string | null;
};

function MailIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

// App Flow G2 navbar. Rendered by each page (not the layout) because the language toggle needs
// the page path, and usePathname() mismatches with proxy rewrites on static pages.
export function SiteHeader({ lang, dict, path }: SiteHeaderProps) {
  const mailto = mailtoHref(dict.email.subject);

  return (
    <header className="site-header sticky top-0 z-50">
      <Container className="site-header-inner flex h-16 items-center gap-0.5 sm:gap-2">
        <Link
          href={localePath("/", lang)}
          className="mr-auto rounded-sm text-[1.0625rem] font-semibold whitespace-nowrap"
        >
          <span className="max-md:hidden">{siteConfig.name}</span>
          <span className="md:hidden">{siteConfig.shortName}</span>
        </Link>

        <nav aria-label={dict.nav.label}>
          <Link
            href={localePath("/work", lang)}
            aria-current={path === "/work" ? "page" : undefined}
            className="inline-flex min-h-11 items-center rounded-sm px-1 text-[0.9375rem] sm:px-2 font-medium hover:text-accent aria-[current=page]:text-accent"
          >
            {dict.nav.work}
          </Link>
        </nav>

        <LanguageToggle lang={lang} path={path} label={dict.language.label} />
        <ThemeToggle labels={dict.theme} className="max-sm:w-9" />

        <Button
          href={mailto}
          size="icon"
          aria-label={dict.nav.email}
          className="shrink-0 md:hidden"
          data-track="contact_email_click"
          data-location="navbar"
        >
          <MailIcon />
        </Button>
        <Button
          href={mailto}
          size="sm"
          className="max-md:hidden"
          data-track="contact_email_click"
          data-location="navbar"
        >
          {dict.nav.email}
        </Button>
      </Container>
      {lang === "en" && <LanguageSuggestBanner lang={lang} path={path} labels={dict.langBanner} />}
    </header>
  );
}
