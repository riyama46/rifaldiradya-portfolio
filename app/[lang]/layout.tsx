import type { Metadata } from "next";
import { locales } from "@/i18n";
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

export default async function PublicLayout({ children, params }: LayoutProps<"/[lang]">) {
  const lang = await resolveLocale(params);

  return (
    <html lang={lang} className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
