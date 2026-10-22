import { CspMeta } from "@/components/site/CspMeta";
import { ThemeScript } from "@/components/site/ThemeScript";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { Analytics } from "@/components/overlays/Analytics";
import { CookieConsent } from "@/components/overlays/CookieConsent";
import { ChapterDepth } from "@/components/site/ChapterDepth";
import { DotField } from "@/components/site/DotField";
import { Footer } from "@/components/site/Footer";
import { ScrollProgress } from "@/components/site/ScrollProgress";
import { SiteBar } from "@/components/site/SiteBar";
import { SkipLink } from "@/components/site/SkipLink";
import { Button } from "@/components/ui/Button";
import { defaultLocale, getDictionary, isLocale, localePath } from "@/i18n";
import { fontVariables } from "@/lib/fonts";
import { LOCALE_HEADER } from "@/lib/locale-header";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "404 · Rifaldi Radya Pratama",
  robots: { index: false, follow: false },
};

// S-04 (App Flow): 404 for any unknown path, in the locale of the URL prefix (set by proxy.ts).
// Bar and footer stay (v2 style, Delta App Flow S-04); content and behaviour unchanged.
export default async function GlobalNotFound() {
  const value = (await headers()).get(LOCALE_HEADER) ?? undefined;
  const lang = isLocale(value) ? value : defaultLocale;
  const dict = getDictionary(lang);

  return (
    <html lang={lang} className={fontVariables} suppressHydrationWarning>
      <head>
        <CspMeta />
        <ThemeScript />
      </head>
      <body>
        <SkipLink label={dict.nav.skip} />
        <ScrollProgress />
        <DotField />
        <SiteBar lang={lang} dict={dict} path={null} />
        <main id="content" tabIndex={-1}>
          <section
            data-zone="top"
            aria-labelledby="not-found-title"
            className="chapter flex min-h-[var(--win)] flex-col justify-center px-[var(--gutter)] pt-26 pb-18 max-md:pt-22 max-md:pb-14"
          >
            <ChapterDepth />
            <div>
              <h1
                id="not-found-title"
                className="max-w-[14ch] text-[clamp(2.75rem,7vw,6rem)] leading-[0.98] tracking-[-0.035em]"
              >
                {dict.notFound.title}
              </h1>
              <p className="mt-6 max-w-[46ch] text-[clamp(1.125rem,1.5vw,1.375rem)] leading-normal text-text-muted">
                {dict.notFound.body}
              </p>
              <div className="mt-10 flex flex-wrap gap-3 max-md:flex-col max-md:items-stretch">
                <Button href={localePath("/", lang)} size="lg">
                  {dict.notFound.home}
                </Button>
                <Button href={localePath("/work", lang)} variant="secondary" size="lg">
                  {dict.notFound.work}
                </Button>
              </div>
            </div>
          </section>
        </main>
        <Footer lang={lang} dict={dict} />
        <CookieConsent lang={lang} dict={dict} />
        <Analytics lang={lang} />
      </body>
    </html>
  );
}
