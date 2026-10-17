import Link from "next/link";
import { CookieSettingsButton } from "@/components/overlays/CookieSettingsButton";
import { localePath, type Dictionary, type Locale } from "@/i18n";
import { siteConfig } from "@/lib/site-config";

type FooterProps = {
  lang: Locale;
  dict: Dictionary;
  /** "top" on home (→ #top), "home" on Work (→ home), none elsewhere (Delta App Flow G2). */
  back?: "top" | "home";
};

// Delta App Flow G2 footer: © year, Privacy, Cookie settings (O-03, only with JS and GA4), back link.
export function Footer({ lang, dict, back }: FooterProps) {
  return (
    <footer className="site-foot">
      <span>
        © {new Date().getFullYear()} {siteConfig.name}
      </span>
      <span className="flex flex-wrap gap-x-6">
        <Link href={localePath("/privacy", lang)} className="foot-link">
          {dict.footer.privacy}
        </Link>
        <CookieSettingsButton label={dict.footer.cookies} className="foot-link" />
      </span>
      {back === "top" && (
        <a href="#top" className="foot-link">
          {dict.footer.top}
        </a>
      )}
      {back === "home" && (
        <Link href={localePath("/", lang)} className="foot-link">
          {dict.footer.home}
        </Link>
      )}
    </footer>
  );
}
