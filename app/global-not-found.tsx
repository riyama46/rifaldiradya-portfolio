import { CspMeta } from "@/components/site/CspMeta";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { Analytics } from "@/components/overlays/Analytics";
import { CookieConsent } from "@/components/overlays/CookieConsent";
import { Footer } from "@/components/site/Footer";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SkipLink } from "@/components/site/SkipLink";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { defaultLocale, getDictionary, isLocale, localePath } from "@/i18n";
import { fontVariables } from "@/lib/fonts";
import { LOCALE_HEADER } from "@/lib/locale-header";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "404 · Rifaldi Radya Pratama",
  robots: { index: false, follow: false },
};

// S-04 (App Flow): 404 for any unknown path, in the locale of the URL prefix (set by proxy.ts).
// Navbar and footer stay; the footer CTA block is omitted on 404 (App Flow G2).
export default async function GlobalNotFound() {
  const value = (await headers()).get(LOCALE_HEADER) ?? undefined;
  const lang = isLocale(value) ? value : defaultLocale;
  const dict = getDictionary(lang);

  return (
    <html lang={lang} className={fontVariables}>
      <head>
        <CspMeta />
      </head>
      <body>
        <SkipLink label={dict.nav.skip} />
        <SiteHeader lang={lang} dict={dict} path={null} />
        <main id="content" tabIndex={-1}>
          <Container className="py-24 lg:py-32">
            <h1 className="text-heading">{dict.notFound.title}</h1>
            <p className="mt-4 max-w-[58ch] text-text-muted">{dict.notFound.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href={localePath("/", lang)}>{dict.notFound.home}</Button>
              <Button href={localePath("/work", lang)} variant="secondary">
                {dict.notFound.work}
              </Button>
            </div>
          </Container>
        </main>
        <Footer lang={lang} dict={dict} showCta={false} />
        <CookieConsent lang={lang} dict={dict} />
        <Analytics lang={lang} />
      </body>
    </html>
  );
}
