import type { Metadata } from "next";
import { Footer } from "@/components/site/Footer";
import { HashFocus } from "@/components/site/HashFocus";
import { SkipLink } from "@/components/site/SkipLink";
import { getDictionary, locales } from "@/i18n";
import { resolveLocale } from "@/i18n/server";
import { fontVariables } from "@/lib/fonts";
import "@/styles/globals.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

// Temporary: T-12 replaces this with buildMetadata() (titles, canonical, hreflang).
export const metadata: Metadata = {
  title: "Rifaldi Radya Pratama",
  robots: { index: false, follow: false },
};

// App Flow G2 shell. The navbar is rendered by each page because it needs the page path.
export default async function PublicLayout({ children, params }: LayoutProps<"/[lang]">) {
  const lang = await resolveLocale(params);
  const dict = getDictionary(lang);

  return (
    <html lang={lang} className={fontVariables}>
      <body>
        <SkipLink label={dict.nav.skip} />
        {children}
        <Footer lang={lang} dict={dict} />
        <HashFocus />
      </body>
    </html>
  );
}
