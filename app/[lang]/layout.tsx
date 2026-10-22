import { CspMeta } from "@/components/site/CspMeta";
import { ThemeScript } from "@/components/site/ThemeScript";
import { Analytics } from "@/components/overlays/Analytics";
import { CookieConsent } from "@/components/overlays/CookieConsent";
import { DotField } from "@/components/site/DotField";
import { Pointer } from "@/components/site/Pointer";
import { HashFocus } from "@/components/site/HashFocus";
import { ScrollProgress } from "@/components/site/ScrollProgress";
import { SkipLink } from "@/components/site/SkipLink";
import { getDictionary, locales } from "@/i18n";
import { resolveLocale } from "@/i18n/server";
import { fontVariables } from "@/lib/fonts";
import "@/styles/globals.css";

// No `dynamicParams = false` here: with it, on-demand revalidation of this layout (T-15) deletes the
// prerendered pages and every public URL becomes a 404 (vercel/next.js#63479, reproduced on
// 16.3.6). Unknown locales still 404 through resolveLocale() → notFound().
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

// Delta App Flow G2 shell. The bar and the footer are rendered by each page: the language toggle
// needs the page path and the footer's back link differs per page.
export default async function PublicLayout({ children, params }: LayoutProps<"/[lang]">) {
  const lang = await resolveLocale(params);
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
        {/* Before the page so the light sits under the content (same z-index, earlier in the DOM). */}
        <Pointer labels={dict.cur} />
        {children}
        <HashFocus />
        <CookieConsent lang={lang} dict={dict} />
        <Analytics lang={lang} />
      </body>
    </html>
  );
}
