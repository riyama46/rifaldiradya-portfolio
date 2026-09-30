import { CspMeta } from "@/components/site/CspMeta";
import { Analytics } from "@/components/overlays/Analytics";
import { CookieConsent } from "@/components/overlays/CookieConsent";
import { Footer } from "@/components/site/Footer";
import { HashFocus } from "@/components/site/HashFocus";
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

// App Flow G2 shell. The navbar is rendered by each page because it needs the page path.
export default async function PublicLayout({ children, params }: LayoutProps<"/[lang]">) {
  const lang = await resolveLocale(params);
  const dict = getDictionary(lang);

  return (
    <html lang={lang} className={fontVariables}>
      <head>
        <CspMeta />
      </head>
      <body>
        <SkipLink label={dict.nav.skip} />
        {children}
        <Footer lang={lang} dict={dict} />
        <HashFocus />
        <CookieConsent lang={lang} dict={dict} />
        <Analytics lang={lang} />
      </body>
    </html>
  );
}
